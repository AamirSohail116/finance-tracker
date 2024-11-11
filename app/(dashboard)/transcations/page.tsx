"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewTranscation } from "@/features/transcations/hooks/use-new-transcations";
import { useGetTranscations } from "@/features/transcations/api/use-get-transcations";
import { useBulDeleteTranscations } from "@/features/transcations/api/use-bulk-delete-transcations";
import { useState } from "react";
import UplaodButton from "./upload-button";
import ImportCard from "./import-card";
import { transcations as transcationSchema } from "@/db/schema";
import { useSelectAccount } from "@/features/accounts/hooks/use-select-account";
import { toast } from "sonner";
import { useBulCreateTranscations } from "@/features/transcations/api/use-bulk-create-transcations";

enum VARIANTS {
  LIST = "LIST",
  IMPORT = "IMPORT",
}

const INITIAL_IMPORT_RESULTS = {
  data: [],
  error: [],
  meta: {},
};

const TranscationPage = () => {
  const [AccountDialog, confirm] = useSelectAccount();
  const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
  const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);

  const onUpload = (results: typeof INITIAL_IMPORT_RESULTS) => {
    console.log("results", results);

    setImportResults(results);
    setVariant(VARIANTS.IMPORT);
  };

  const onCancelImport = () => {
    setImportResults(INITIAL_IMPORT_RESULTS);
    setVariant(VARIANTS.LIST);
  };

  const newTranscation = useNewTranscation();
  const bulkCreateMutation = useBulCreateTranscations();
  const deleteTranscations = useBulDeleteTranscations();
  const transcationQuery = useGetTranscations();
  const transcations = transcationQuery.data || [];

  const isDisbaled = transcationQuery.isLoading || deleteTranscations.isPending;

  const onSubmitImport = async (
    values: (typeof transcationSchema.$inferInsert)[]
  ) => {
    const accountId = await confirm();

    if (!accountId) {
      return toast.error("Please select an account to contine.");
    }

    const data = values.map((value) => ({
      ...value,
      accountId: accountId as string,
    }));

    bulkCreateMutation.mutate(data, {
      onSuccess: () => {
        onCancelImport();
      },
    });
  };

  if (transcationQuery.isLoading) {
    return (
      <div className=" max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className=" border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className=" h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className=" size-6 text-slate-300 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === VARIANTS.IMPORT) {
    return (
      <>
        <AccountDialog />
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSumbit={onSubmitImport}
        />
      </>
    );
  }

  return (
    <div className=" max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className=" border-none drop-shadow-sm">
        <CardHeader className=" gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className=" text-xl line-clamp-1">
            Transcation History
          </CardTitle>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Button
              className=" w-full lg:w-auto"
              onClick={newTranscation.onOpen}
              size="sm"
            >
              <Plus className=" size-4 mr-2" />
              Add new
            </Button>
            <UplaodButton onUplaod={onUpload} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              deleteTranscations.mutate({ ids });
            }}
            disabled={isDisbaled}
            columns={columns}
            data={transcations}
            filterKey="payee"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TranscationPage;
