import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatasetUploadContentProps {
  uploadedFile: File | null;
  onFileChange: (file: File | null) => void;
}

export function DatasetUploadContent({
  uploadedFile,
  onFileChange,
}: DatasetUploadContentProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-none p-8 text-center hover:border-primary transition-colors">
        <Label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <div className="text-xs text-neutral-600">
              Click to select file or drag and drop
            </div>
            <div className="text-[10px] text-neutral-500">
              Supports JSON, JSONL, CSV
            </div>
          </div>
          <Input
            id="file-upload"
            type="file"
            accept=".json,.jsonl,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </Label>
      </div>

      {uploadedFile && (
        <div className="bg-green-50 border border-green-200 rounded-none p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-xs text-green-800">
                {uploadedFile.name}
              </p>
              <p className="text-[10px] text-green-600">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileChange(null)}
              className="rounded-none h-8"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
