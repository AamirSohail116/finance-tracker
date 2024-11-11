import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.transcations.$post>;
type RequestType = InferRequestType<
  typeof client.api.transcations.$post
>["json"];

export const useCreateTranscation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (json: any) => {
      const response = await client.api.transcations.$post({ json });

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transcation created");
      queryClient.invalidateQueries({ queryKey: ["transcations"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to create transcation");
    },
  });

  return mutation;
};
