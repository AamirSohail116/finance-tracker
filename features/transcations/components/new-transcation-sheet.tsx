import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import z from "zod";
import { insertTrancationSchema } from "@/db/schema";
import { useNewTranscation } from "../hooks/use-new-transcations";
import { useCreateTranscation } from "../api/use-create-transcation";
import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { TranscationForm } from "./transcation-form";
import { Loader2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertTrancationSchema.omit({
  id: true,
});

type formValues = z.input<typeof formSchema>;

const NewTranscationSheet = () => {
  const { isOpen, onClose } = useNewTranscation();
  const mutation = useCreateTranscation();

  const categoryQuery = useGetCategories();
  const categoryMutation = useCreateCategory();
  const onCreateCategory = (name: string) =>
    categoryMutation.mutate({
      name,
    });
  const categoryOptions = (categoryQuery.data ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const accountQuery = useGetAccounts();
  const accountMutation = useCreateAccount();
  const onCreateAccount = (name: string) =>
    accountMutation.mutate({
      name,
    });
  const accountOptions = (accountQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const isPending =
    mutation.isPending ||
    categoryMutation.isPending ||
    accountMutation.isPending;

  const isLoading = categoryQuery.isLoading || accountQuery.isLoading;

  const onSubmit = (values: formValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className=" space-y-4">
        <SheetHeader>
          <SheetTitle>New Transcation</SheetTitle>
          <SheetDescription>Add a new transcation.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className=" absolute inset-0 flex items-center justify-center">
            <Loader2 className=" size-4 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <TranscationForm
            onSubmit={onSubmit}
            disabled={isPending}
            categoryOptions={categoryOptions}
            onCreateCategory={onCreateCategory}
            onCreateAccount={onCreateAccount}
            accountOptions={accountOptions}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NewTranscationSheet;
