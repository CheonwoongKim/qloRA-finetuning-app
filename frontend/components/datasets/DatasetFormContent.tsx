import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CSVRow, DatasetFormat } from "@/types/dataset";
import { Plus, Trash2 } from "lucide-react";

interface DatasetFormContentProps {
  datasetName: string;
  selectedFormat: DatasetFormat;
  csvRows: CSVRow[];
  onNameChange: (name: string) => void;
  onFormatChange: (format: DatasetFormat) => void;
  onCellChange: (index: number, field: keyof CSVRow, value: string) => void;
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
}

export function DatasetFormContent({
  datasetName,
  selectedFormat,
  csvRows,
  onNameChange,
  onFormatChange,
  onCellChange,
  onAddRow,
  onDeleteRow,
}: DatasetFormContentProps) {
  const formats: DatasetFormat[] = ["json", "jsonl", "csv"];

  return (
    <div className="space-y-4">
      {/* Dataset Name */}
      <div>
        <Label htmlFor="dataset-name" className="text-[10px]">
          DATASET NAME
        </Label>
        <Input
          id="dataset-name"
          value={datasetName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="my-training-data"
          className="mt-1 rounded-none h-8 text-xs border-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
        />
      </div>

      {/* Format Selection */}
      <div>
        <Label className="text-[10px]">FORMAT</Label>
        <div className="flex gap-2 mt-1">
          {formats.map((format) => (
            <Button
              key={format}
              size="sm"
              variant={selectedFormat === format ? "default" : "outline"}
              onClick={() => onFormatChange(format)}
              className="rounded-none h-8"
            >
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Editor */}
      <div>
        <Label htmlFor="dataset-content" className="text-[10px]">
          CONTENT
        </Label>
        <div className="mt-1 space-y-2">
          <div className="border-2 rounded-none overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b-2">
                  <th className="text-center px-3 py-2 font-medium text-[10px] text-neutral-500 w-[50px] bg-neutral-200">
                    #
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-[10px] text-neutral-500">
                    INSTRUCTION
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-[10px] text-neutral-500">
                    INPUT
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-[10px] text-neutral-500">
                    OUTPUT
                  </th>
                  <th className="w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="text-center px-3 py-2 bg-neutral-50 border-r font-medium text-neutral-500">
                      {index + 1}
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.instruction}
                        onChange={(e) => onCellChange(index, "instruction", e.target.value)}
                        className="h-8 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                        placeholder="Instruction"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.input}
                        onChange={(e) => onCellChange(index, "input", e.target.value)}
                        className="h-8 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                        placeholder="Input"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.output}
                        onChange={(e) => onCellChange(index, "output", e.target.value)}
                        className="h-8 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                        placeholder="Output"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRow(index)}
                        disabled={csvRows.length === 1}
                        className="h-8 w-8 p-0 rounded-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            onClick={onAddRow}
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-none h-8"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </Button>
        </div>
      </div>
    </div>
  );
}
