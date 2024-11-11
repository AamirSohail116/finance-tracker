import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { Hono } from "hono";
import { parse, subDays, differenceInDays } from "date-fns";
import { db } from "@/db/drizzle";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { accounts, categories, transcations } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
    })
  ),
  async (c) => {
    const auth = getAuth(c);
    const { from, to, accountId } = c.req.valid("query");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;

    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    async function fetchFinancialDate(
      userId: string,
      startDate: Date,
      endDate: Date
    ) {
      return await db
        .select({
          income:
            sql`SUM(CASE WHEN ${transcations.amount} >= 0 THEN ${transcations.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          expenses:
            sql`SUM(CASE WHEN ${transcations.amount} < 0 THEN ${transcations.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          remaining: sum(transcations.amount).mapWith(Number),
        })
        .from(transcations)
        .innerJoin(accounts, eq(transcations.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transcations.accountId, accountId) : undefined,
            eq(accounts.userId, userId),
            gte(transcations.date, startDate),
            lte(transcations.date, endDate)
          )
        );
    }

    const [currentPeriod] = await fetchFinancialDate(
      auth.userId,
      startDate,
      endDate
    );
    const [lastPeriod] = await fetchFinancialDate(
      auth.userId,
      lastPeriodStart,
      lastPeriodEnd
    );

    const incomeChange = calculatePercentageChange(
      currentPeriod.income,
      lastPeriod.income
    );

    const expensesChange = calculatePercentageChange(
      currentPeriod.expenses,
      lastPeriod.expenses
    );

    const remainingChange = calculatePercentageChange(
      currentPeriod.remaining,
      lastPeriod.remaining
    );

    const category = await db
      .select({
        name: categories.name,
        value: sql`SUM(ABS(${transcations.amount}))`.mapWith(Number),
      })
      .from(transcations)
      .innerJoin(accounts, eq(transcations.accountId, accounts.id))
      .innerJoin(categories, eq(transcations.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transcations.accountId, accountId) : undefined,
          eq(accounts.userId, auth?.userId),
          lt(transcations.amount, 0),
          gte(transcations.date, startDate),
          lte(transcations.date, endDate)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transcations.amount}))`));

    const topCategories = category.slice(0, 3);
    const otherCategories = category.slice(3);

    const otherSum = otherCategories.reduce(
      (sum, current) => sum + current.value,
      0
    );

    const finalCategories = topCategories;
    if (otherCategories.length > 0) {
      finalCategories.push({
        name: "other",
        value: otherSum,
      });
    }

    const activeDays = await db
      .select({
        date: transcations.date,
        income:
          sql`SUM(CASE WHEN ${transcations.amount} >= 0 THEN ${transcations.amount} ELSE 0 END)`.mapWith(
            Number
          ),
        expenses:
          sql`SUM(CASE WHEN ${transcations.amount} < 0 THEN ABS(${transcations.amount}) ELSE 0 END)`.mapWith(
            Number
          ),
      })
      .from(transcations)
      .innerJoin(accounts, eq(transcations.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transcations.accountId, accountId) : undefined,
          eq(accounts.userId, auth?.userId),
          gte(transcations.date, startDate),
          lte(transcations.date, endDate)
        )
      )
      .groupBy(transcations.date)
      .orderBy(transcations.date);

    const days = fillMissingDays(activeDays, startDate, endDate);

    return c.json({
      data: {
        remainingAmount: currentPeriod.remaining,
        remainingChange,
        incomeAmount: currentPeriod.income,
        incomeChange,
        expensesAmount: currentPeriod.expenses,
        expensesChange,
        categories: finalCategories,
        days,
      },
    });
  }
);

export default app;
