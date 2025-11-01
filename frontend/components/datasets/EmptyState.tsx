import { Button } from "@/components/ui/button";
import { FileEdit, Upload } from "lucide-react";

interface EmptyStateProps {
  onCreateClick: () => void;
  onUploadClick: () => void;
}

export function EmptyState({ onCreateClick, onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="text-center max-w-md">
        <h2 className="font-medium text-neutral-900 mb-2" style={{ fontSize: '14px' }}>
          No Datasets Yet
        </h2>
        <p className="text-neutral-500 mb-8" style={{ fontSize: '12px' }}>
          Create or upload your first training dataset to begin fine-tuning your models
        </p>
        <div className="flex justify-center gap-3">
          <Button
            onClick={onCreateClick}
            variant="outline"
            className="gap-2"
            style={{ fontSize: '13px' }}
          >
            <FileEdit className="w-4 h-4" />
            Create Dataset
          </Button>
          <Button
            onClick={onUploadClick}
            className="gap-2"
            style={{ fontSize: '13px' }}
          >
            <Upload className="w-4 h-4" />
            Upload Dataset
          </Button>
        </div>
      </div>
    </div>
  );
}
