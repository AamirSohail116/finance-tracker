import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.transcations)[":id"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.transcations)[":id"]["$patch"]
>["json"];

export const useEditTranscation = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transcations[":id"]["$patch"]({
        param: { id },
        json,
      });

      return response.json(); // Removed the second `await`
    },
    onSuccess: () => {
      toast.success("Transcation updated");
      queryClient.invalidateQueries({ queryKey: ["transcation", { id }] });
      queryClient.invalidateQueries({ queryKey: ["transcations"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to edit transcation");
    },
  });

  return mutation;
};
