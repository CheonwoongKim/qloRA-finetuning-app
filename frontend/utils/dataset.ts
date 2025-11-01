import type { CSVRow, DatasetFormat } from "@/types/dataset";

export function convertRowsToFormat(rows: CSVRow[], format: DatasetFormat): string {
  if (format === "json") {
    return JSON.stringify(rows, null, 2);
  } else if (format === "jsonl") {
    return rows.map((row) => JSON.stringify(row)).join("\n");
  } else if (format === "csv") {
    const header = "instruction,input,output";
    const csvRows = rows.map(
      (row) =>
        `"${row.instruction.replace(/"/g, '""')}","${row.input.replace(/"/g, '""')}","${row.output.replace(/"/g, '""')}"`
    );
    return [header, ...csvRows].join("\n");
  }
  return "";
}

export function parseFileForSampleCount(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase();

      let sampleCount = 0;
      try {
        if (ext === "json") {
          const data = JSON.parse(content);
          sampleCount = Array.isArray(data) ? data.length : 1;
        } else if (ext === "jsonl") {
          sampleCount = content
            .trim()
            .split("\n")
            .filter((line) => line.trim()).length;
        } else if (ext === "csv") {
          const lines = content.trim().split("\n");
          sampleCount = Math.max(0, lines.length - 1); // Exclude header
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        sampleCount = 0;
      }
      resolve(sampleCount);
    };
    reader.readAsText(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
