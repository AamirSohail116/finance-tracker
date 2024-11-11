/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import ImportTable from "./import-table";
import { converAmountToMiliunits } from "@/lib/utils";
import { format, parse } from "date-fns";

const dateFormat = "yyyy-MM-dd HH:mm:ss";
const outputFormat = "yyyy-MM-dd";

const requiredOptions = ["amount", "date", "payee"];

interface SelectedColumnState {
  [key: string]: string | null;
}

type Props = {
  data: string[][];
  onCancel: () => void;
  onSumbit: (data: any) => void;
};

const ImportCard = ({ data, onCancel, onSumbit }: Props) => {
  const [seletcedColumns, setSelectedColumns] = useState<SelectedColumnState>(
    {}
  );
  const headers = data[0];
  const body = data.slice(1);

  const onTableHeaderSelectChange = (
    columnIndex: number,
    value: string | null
  ) => {
    setSelectedColumns((prev) => {
      const newSelectedColumn = { ...prev };

      for (const key in newSelectedColumn) {
        if (newSelectedColumn[key] === value) {
          newSelectedColumn[key] = null;
        }
      }

      if (value === "skip") {
        value = null;
      }

      newSelectedColumn[`column_${columnIndex}`] = value;
      return newSelectedColumn;
    });
  };

  const progress = Object.values(seletcedColumns).filter(Boolean).length;

  const handleContine = () => {
    const getColIndex = (column: string) => {
      return column.split("_")[1];
    };

    const mappedData = {
      headers: headers.map((_header, index) => {
        const columnIndex = getColIndex(`column_${index}`);
        return seletcedColumns[`column_${columnIndex}`] || null;
      }),
      body: body
        .map((row) => {
          const transformedRow = row.map((cell, index) => {
            const columnIndex = getColIndex(`column_${index}`);
            return seletcedColumns[`column_${columnIndex}`] ? cell : null;
          });
          return transformedRow.every((item) => item === null)
            ? []
            : transformedRow;
        })
        .filter((row) => row.length > 0),
    };

    const arrayOfData = mappedData.body.map((row) => {
      return row.reduce((acc: any, cell, index) => {
        const header = mappedData.headers[index];
        if (header !== null) {
          acc[header] = cell;
        }

        return acc;
      }, {});
    });

    const formattedData = arrayOfData.map((item) => {
      const parsedAmount = converAmountToMiliunits(parseFloat(item.amount));

      let formattedDate = "";
      try {
        // Try parsing the date with the expected format
        const parsedDate = parse(item.date, dateFormat, new Date());
        formattedDate = format(parsedDate, outputFormat);
      } catch (error) {
        console.error("Date parsing error:", error, "for date:", item.date);
        formattedDate = ""; // or you could use new Date(), or skip formatting
      }

      return {
        ...item,
        amount: parsedAmount,
        date: formattedDate,
      };
    });

    onSumbit(formattedData);
  };

  return (
    <div className=" max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className=" border-none drop-shadow-sm">
        <CardHeader className=" gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className=" text-xl line-clamp-1">
            Import Transcation
          </CardTitle>
          <div className=" flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Button onClick={onCancel} size="sm" className=" w-full lg:w-auto">
              Cancel
            </Button>
            <Button
              className=" w-full lg:w-auto"
              onClick={handleContine}
              size={"sm"}
              disabled={progress < requiredOptions.length}
            >
              Contine ({progress} / {requiredOptions.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ImportTable
            headers={headers}
            body={body}
            seletcedColumns={seletcedColumns}
            onTableHeaderSelectChange={onTableHeaderSelectChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportCard;
