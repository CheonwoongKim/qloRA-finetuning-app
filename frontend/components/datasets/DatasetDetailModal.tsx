import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Dataset } from "@/types/dataset";
import { X } from "lucide-react";

interface DatasetDetailModalProps {
  isOpen: boolean;
  dataset: Dataset | null;
  onClose: () => void;
}

export function DatasetDetailModal({
  isOpen,
  dataset,
  onClose,
}: DatasetDetailModalProps) {
  if (!isOpen || !dataset) return null;

  // Parse content to display
  let parsedContent: any[] = [];
  try {
    if (dataset.content) {
      if (dataset.format === "JSON") {
        parsedContent = JSON.parse(dataset.content);
      } else if (dataset.format === "JSONL") {
        parsedContent = dataset.content
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => JSON.parse(line));
      } else if (dataset.format === "CSV") {
        const lines = dataset.content.split("\n");
        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
        parsedContent = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
          return headers.reduce((obj: any, header, index) => {
            obj[header] = values[index] || "";
            return obj;
          }, {});
        });
      }
    }
  } catch (error) {
    console.error("Error parsing dataset content:", error);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-none w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-black tracking-tight">
                {dataset.name}
              </h2>
              <div className="flex gap-4 mt-1 text-[10px] text-neutral-500">
                <span>Format: {dataset.format}</span>
                <span>Samples: {dataset.samples}</span>
                <span>Size: {dataset.size}</span>
                <span>Created: {dataset.createdAt}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-none h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {parsedContent.length > 0 ? (
            <div className="border rounded-none bg-white">
              <Table>
                <TableHeader className="[&_tr]:border-b-2">
                  <TableRow>
                    <TableHead className="text-[10px] font-semibold text-neutral-500 bg-neutral-50 w-[60px] text-center border-r">
                      #
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-neutral-500 bg-neutral-50 border-r">
                      INSTRUCTION
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-neutral-500 bg-neutral-50 border-r">
                      INPUT
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-neutral-500 bg-neutral-50">
                      OUTPUT
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedContent.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs py-2 text-neutral-500 text-center border-r">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-xs py-2 border-r max-w-xs truncate">
                        {row.instruction || "-"}
                      </TableCell>
                      <TableCell className="text-xs py-2 border-r max-w-xs truncate">
                        {row.input || "-"}
                      </TableCell>
                      <TableCell className="text-xs py-2 max-w-xs truncate">
                        {row.output || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 text-sm">
              No content available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-end">
          <Button onClick={onClose} className="rounded-none h-8 text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
