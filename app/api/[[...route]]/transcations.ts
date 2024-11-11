import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import z from "zod";
import { parse, subDays } from "date-fns";

import { db } from "@/db/drizzle";
import {
  transcations,
  insertTrancationSchema,
  categories,
  accounts,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!auth?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30);

      const startDate = from
        ? parse(from, "yyyy-MM-dd", new Date())
        : defaultFrom;

      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

      const data = await db
        .select({
          id: transcations.id,
          date: transcations.date,
          category: categories.name,
          categoryId: transcations.categoryId,
          payee: transcations.payee,
          amount: transcations.amount,
          notes: transcations.notes,
          account: accounts.name,
          accountId: transcations.accountId,
        })
        .from(transcations)
        .innerJoin(accounts, eq(transcations.accountId, accounts.id))
        .leftJoin(categories, eq(transcations.categoryId, categories.id))
        .where(
          and(
            accountId ? eq(transcations.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
            gte(transcations.date, startDate),
            lte(transcations.date, endDate)
          )
        )
        .orderBy(desc(transcations.date));

      return c.json({ data });
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .select({
          id: transcations.id,
          date: transcations.date,
          categoryId: transcations.categoryId,
          payee: transcations.payee,
          amount: transcations.amount,
          notes: transcations.notes,
          accountId: transcations.accountId,
        })
        .from(transcations)
        .innerJoin(accounts, eq(transcations.accountId, accounts.id))
        .where(and(eq(accounts.userId, auth.userId), eq(transcations.id, id)));

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      insertTrancationSchema.omit({
        id: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const data = await db
        .insert(transcations)
        .values({
          id: createId(),
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-create",
    clerkMiddleware(),
    zValidator("json", z.array(insertTrancationSchema.omit({ id: true }))),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const data = await db
        .insert(transcations)
        .values(
          values.map((value) => ({
            id: createId(),
            ...value,
          }))
        )
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const transcationToDelete = db.$with("transcations_to_delete").as(
        db
          .select({ id: transcations.id })
          .from(transcations)
          .innerJoin(accounts, eq(transcations.accountId, accounts.id))
          .where(
            and(
              inArray(transcations.id, values.ids),
              eq(accounts.userId, auth.userId)
            )
          )
      );

      const data = await db
        .with(transcationToDelete)
        .delete(transcations)
        .where(
          inArray(transcations.id, sql`(select id from ${transcationToDelete})`)
        )
        .returning({
          id: transcations.id,
        });

      return c.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    zValidator(
      "json",
      insertTrancationSchema.omit({
        id: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transcationUpdate = db.$with("transcations_to_update").as(
        db
          .select({ id: transcations.id })
          .from(transcations)
          .innerJoin(accounts, eq(transcations.accountId, accounts.id))
          .where(and(eq(transcations.id, id), eq(accounts.userId, auth.userId)))
      );

      const [data] = await db
        .with(transcationUpdate)
        .update(transcations)
        .set(values)
        .where(
          inArray(transcations.id, sql`(select id from ${transcationUpdate})`)
        )
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),

    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const transcationDelete = db.$with("transcations_to_delete").as(
        db
          .select({ id: transcations.id })
          .from(transcations)
          .innerJoin(accounts, eq(transcations.accountId, accounts.id))
          .where(and(eq(transcations.id, id), eq(accounts.userId, auth.userId)))
      );

      const [data] = await db
        .with(transcationDelete)
        .delete(transcations)
        .where(
          inArray(transcations.id, sql`(select id from ${transcationDelete})`)
        )
        .returning({
          id: transcations.id,
        });

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  );

export default app;
