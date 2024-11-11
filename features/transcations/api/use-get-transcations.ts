import { client } from "@/lib/hono";
import { converAmountFromMiliunits } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export const useGetTranscations = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";

  const query = useQuery({
    // check if params are needed
    queryKey: ["transcations", { from, to, accountId }],
    queryFn: async () => {
      const response = await client.api.transcations.$get({
        query: {
          from,
          to,
          accountId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transcations");
      }

      const { data } = await response.json();
      return data.map((transcation) => ({
        ...transcation,
        amount: converAmountFromMiliunits(transcation.amount),
      }));
    },
  });

  return query;
};
