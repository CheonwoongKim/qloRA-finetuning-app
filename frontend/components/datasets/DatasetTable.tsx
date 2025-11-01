import { Button } from "@/components/ui/button";
import { TABLE_STYLES } from "@/constants/dataset";
import type { Dataset } from "@/types/dataset";
import { Trash2 } from "lucide-react";

interface DatasetTableProps {
  datasets: Dataset[];
  onDelete: (id: string) => void;
  onRowClick: (dataset: Dataset) => void;
}

export function DatasetTable({ datasets, onDelete, onRowClick }: DatasetTableProps) {
  const { header, cell, headerCell, dataCell } = TABLE_STYLES;

  return (
    <div className="border rounded-none bg-white overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '40%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead className="[&_tr]:border-b-2">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th className={`${header} ${headerCell.no}`}>NO</th>
            <th className={`${header} ${headerCell.name}`}>NAME</th>
            <th className={`${header} ${headerCell.samples}`}>SAMPLES</th>
            <th className={`${header} ${headerCell.size}`}>SIZE</th>
            <th className={`${header} ${headerCell.format}`}>FORMAT</th>
            <th className={`${header} ${headerCell.created}`}>CREATED</th>
            <th className={`${header} ${headerCell.actions}`}>ACTIONS</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {datasets.map((dataset, index) => (
            <tr key={dataset.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer">
              <td
                className={`${cell} ${dataCell.no}`}
                onClick={() => onRowClick(dataset)}
              >
                {index + 1}
              </td>
              <td
                className={`${cell} ${dataCell.name}`}
                onClick={() => onRowClick(dataset)}
              >
                {dataset.name}
              </td>
              <td
                className={`${cell} ${dataCell.samples}`}
                onClick={() => onRowClick(dataset)}
              >
                {dataset.samples}
              </td>
              <td
                className={`${cell} ${dataCell.size}`}
                onClick={() => onRowClick(dataset)}
              >
                {dataset.size}
              </td>
              <td
                className={`${cell} ${dataCell.format}`}
                onClick={() => onRowClick(dataset)}
              >
                {dataset.format}
              </td>
              <td
                className={`${cell} ${dataCell.created}`}
                onClick={() => onRowClick(dataset)}
              >
                {dataset.createdAt}
              </td>
              <td className={`${cell} ${dataCell.actions}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(dataset.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
