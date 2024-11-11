import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.transcations)["bulk-create"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.transcations)["bulk-create"]["$post"]
>["json"];

export const useBulCreateTranscations = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transcations["bulk-create"]["$post"]({
        json,
      });

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transcations created");
      queryClient.invalidateQueries({ queryKey: ["transcations"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to create transcations");
    },
  });

  return mutation;
};
