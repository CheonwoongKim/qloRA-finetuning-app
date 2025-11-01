import { Button } from "@/components/ui/button";
import type { CSVRow, DatasetFormat, ModalMode } from "@/types/dataset";
import { X } from "lucide-react";
import { DatasetFormContent } from "./DatasetFormContent";
import { DatasetUploadContent } from "./DatasetUploadContent";

interface DatasetModalProps {
  isOpen: boolean;
  mode: ModalMode;
  datasetName: string;
  selectedFormat: DatasetFormat;
  csvRows: CSVRow[];
  uploadedFile: File | null;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
  onFormatChange: (format: DatasetFormat) => void;
  onCellChange: (index: number, field: keyof CSVRow, value: string) => void;
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
  onFileChange: (file: File | null) => void;
}

export function DatasetModal({
  isOpen,
  mode,
  datasetName,
  selectedFormat,
  csvRows,
  uploadedFile,
  onClose,
  onSave,
  onNameChange,
  onFormatChange,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onFileChange,
}: DatasetModalProps) {
  if (!isOpen) return null;

  const isCreateMode = mode === "create";
  const isSaveDisabled = isCreateMode
    ? !datasetName || csvRows.length === 0
    : !uploadedFile;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-none w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-normal text-black tracking-tight">
              {isCreateMode ? "Create Dataset" : "Upload Dataset"}
            </h2>
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
          {isCreateMode ? (
            <DatasetFormContent
              datasetName={datasetName}
              selectedFormat={selectedFormat}
              csvRows={csvRows}
              onNameChange={onNameChange}
              onFormatChange={onFormatChange}
              onCellChange={onCellChange}
              onAddRow={onAddRow}
              onDeleteRow={onDeleteRow}
            />
          ) : (
            <DatasetUploadContent
              uploadedFile={uploadedFile}
              onFileChange={onFileChange}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-none h-8 text-xs hover:bg-neutral-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaveDisabled}
            className="rounded-none h-8 text-xs"
          >
            {isCreateMode ? "Create Dataset" : "Upload Dataset"}
          </Button>
        </div>
      </div>
    </div>
  );
}
