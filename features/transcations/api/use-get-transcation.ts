import { client } from "@/lib/hono";
import { converAmountFromMiliunits } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useGetTranscation = (id?: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["transcation", { id }],
    queryFn: async () => {
      const response = await client.api.transcations[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transcation");
      }

      const { data } = await response.json();
      return {
        ...data,
        amount: converAmountFromMiliunits(data.amount),
      };
    },
  });

  return query;
};
