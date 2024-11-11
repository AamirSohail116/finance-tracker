import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.transcations)[":id"]["$delete"]
>;

export const useDeletTranscation = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.transcations[":id"]["$delete"]({
        param: { id },
      });

      return response.json();
    },
    onSuccess: () => {
      toast.success("Transcation deleted");
      queryClient.invalidateQueries({ queryKey: ["transcation", { id }] });
      queryClient.invalidateQueries({ queryKey: ["transcations"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to delete transcation");
    },
  });

  return mutation;
};
