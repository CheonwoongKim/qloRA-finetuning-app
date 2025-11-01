export interface Dataset {
  id: string;
  name: string;
  samples: number;
  size: string;
  format: string;
  createdAt: string;
  content?: string;
}

export interface CSVRow {
  instruction: string;
  input: string;
  output: string;
}

export type DatasetFormat = "json" | "jsonl" | "csv";
export type ModalMode = "upload" | "create";
