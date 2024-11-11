import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import TableHeadSelect from "./table-head-select";

type Props = {
  headers: string[];
  body: string[][];
  seletcedColumns: Record<string, string | null>;
  onTableHeaderSelectChange: (
    columnIndex: number,
    value: string | null
  ) => void;
};

const ImportTable = ({
  headers,
  body,
  seletcedColumns,
  onTableHeaderSelectChange,
}: Props) => {
  return (
    <div className=" rounded-md border overflow-hidden">
      <Table>
        <TableHeader className=" bg-muted">
          <TableRow>
            {headers.map((_item, index) => (
              <TableHead key={index}>
                <TableHeadSelect
                  columnIndex={index}
                  selectedColumns={seletcedColumns}
                  onChange={onTableHeaderSelectChange}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {body.map((row: string[], index) => (
            <TableRow key={index}>
              {row.map((cell, index) => (
                <TableCell key={index}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ImportTable;
