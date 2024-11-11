"use client";

import EditAccountSheet from "@/features/accounts/components/edit-account-shhet";
import NewAccountSheet from "@/features/accounts/components/new-account-sheet";
import EditCategorySheet from "@/features/categories/components/edit-category-shhet";
import NewCategorySheet from "@/features/categories/components/new-category-sheet";
import NewTranscationSheet from "../features/transcations/components/new-transcation-sheet";
import EditTranscationSheet from "@/features/transcations/components/edit-account-shhet";

export const SheetProvider = () => {
  return (
    <>
      <NewAccountSheet />
      <EditAccountSheet />

      <NewCategorySheet />
      <EditCategorySheet />

      <NewTranscationSheet />
      <EditTranscationSheet />
    </>
  );
};
