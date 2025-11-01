export const DATASET_TEMPLATES = {
  JSON: `[
  {
    "instruction": "Your instruction here",
    "input": "Input text",
    "output": "Expected output"
  }
]`,
  JSONL: `{"instruction": "Your instruction here", "input": "Input text", "output": "Expected output"}
{"instruction": "Another instruction", "input": "Another input", "output": "Another output"}`,
  CSV: `instruction,input,output
"Your instruction here","Input text","Expected output"
"Another instruction","Another input","Another output"`,
} as const;

export const TABLE_STYLES = {
  header: "h-10 px-4 text-left align-middle text-[10px] font-semibold text-neutral-500 bg-neutral-50",
  cell: "px-4 py-2 align-middle text-xs",
  headerCell: {
    no: "text-center border-r",
    name: "border-r",
    samples: "text-right border-r",
    size: "text-right border-r",
    format: "border-r",
    created: "border-r",
    actions: "text-center",
  },
  dataCell: {
    no: "text-neutral-500 text-center border-r",
    name: "font-medium border-r",
    samples: "text-right border-r",
    size: "text-right border-r",
    format: "border-r",
    created: "border-r",
    actions: "text-center",
  },
} as const;
