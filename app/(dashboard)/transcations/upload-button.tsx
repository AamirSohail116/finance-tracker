/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import React from "react";
import { useCSVReader } from "react-papaparse";
type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUplaod: (result: any) => void;
};

const UplaodButton = ({ onUplaod }: Props) => {
  const { CSVReader } = useCSVReader();
  // add a pay wall
  return (
    <CSVReader onUploadAccepted={onUplaod}>
      {({ getRootProps }: any) => (
        <Button size={"sm"} className=" w-full lg:w-auto" {...getRootProps()}>
          <Upload className=" size-4 mr-2" />
          Import
        </Button>
      )}
    </CSVReader>
  );
};

export default UplaodButton;
