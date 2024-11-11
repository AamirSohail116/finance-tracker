import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import z from "zod";
import { insertTrancationSchema } from "@/db/schema";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { useOpenTranscation } from "../hooks/use-open-transcation";
import { TranscationForm } from "./transcation-form";
import { useGetTranscation } from "../api/use-get-transcation";
import { useEditTranscation } from "../api/use-edit-transcation";
import { useDeletTranscation } from "../api/use-delete-transcation";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertTrancationSchema.omit({
  id: true,
});

type formValues = z.input<typeof formSchema>;

const EditTranscationSheet = () => {
  const { isOpen, onClose, id } = useOpenTranscation();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this transcation."
  );

  const transcationQuery = useGetTranscation(id);
  const editMutationTranscation = useEditTranscation(id);
  const deleteMutationTranscation = useDeletTranscation(id);

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
    editMutationTranscation.isPending ||
    deleteMutationTranscation.isPending ||
    categoryMutation.isPending ||
    accountMutation.isPending;

  const isLoading =
    categoryQuery.isLoading ||
    accountQuery.isLoading ||
    transcationQuery.isLoading;

  const onSubmit = (values: formValues) => {
    editMutationTranscation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const defaultValues = transcationQuery.data
    ? {
        accountId: transcationQuery.data.accountId,
        categoryId: transcationQuery.data.categoryId,
        amount: transcationQuery.data.amount.toString(),
        date: transcationQuery.data.date
          ? new Date(transcationQuery.data.date)
          : new Date(),
        payee: transcationQuery.data.payee,
        notes: transcationQuery.data.notes,
      }
    : {
        accountId: "",
        date: new Date(),
        amount: "",
        payee: "",
        notes: "",
        categoryId: "",
      };

  const onDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteMutationTranscation.mutate(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className=" space-y-4">
          <SheetHeader>
            <SheetTitle>Edit transcation</SheetTitle>
            <SheetDescription>Edit an existing transcation.</SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className=" absolute inset-0 flex items-center justify-center">
              <Loader2 className=" size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <TranscationForm
              id={id}
              onDelete={onDelete}
              onSubmit={onSubmit}
              disabled={isPending}
              defaultValue={defaultValues}
              categoryOptions={categoryOptions}
              onCreateCategory={onCreateCategory}
              onCreateAccount={onCreateAccount}
              accountOptions={accountOptions}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EditTranscationSheet;
