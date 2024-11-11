import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.transcations)["bulk-delete"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.transcations)["bulk-delete"]["$post"]
>["json"];

export const useBulDeleteTranscations = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transcations["bulk-delete"]["$post"]({
        json,
      });

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transcations deleted");
      queryClient.invalidateQueries({ queryKey: ["transcations"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to delete transcations");
    },
  });

  return mutation;
};
