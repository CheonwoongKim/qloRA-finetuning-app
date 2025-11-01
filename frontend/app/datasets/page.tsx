"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DatasetTable } from "@/components/datasets/DatasetTable";
import { EmptyState } from "@/components/datasets/EmptyState";
import { DatasetModal } from "@/components/datasets/DatasetModal";
import { DatasetDetailModal } from "@/components/datasets/DatasetDetailModal";
import type { Dataset, CSVRow, DatasetFormat, ModalMode } from "@/types/dataset";
import { DATASET_TEMPLATES } from "@/constants/dataset";
import { convertRowsToFormat, parseFileForSampleCount, formatFileSize } from "@/utils/dataset";
import { Plus, Upload } from "lucide-react";
import { API_URL } from "@/constants/api";

export default function DatasetsPage() {
  // State
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Create states
  const [datasetName, setDatasetName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<DatasetFormat>("json");
  const [csvRows, setCsvRows] = useState<CSVRow[]>([
    { instruction: "", input: "", output: "" },
  ]);

  // Fetch datasets
  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // Modal handlers
  const handleOpenModal = (mode: ModalMode) => {
    setModalMode(mode);
    setIsModalOpen(true);
    if (mode === "create") {
      setSelectedFormat("json");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUploadedFile(null);
    setDatasetName("");
    setSelectedFormat("json");
    setCsvRows([{ instruction: "", input: "", output: "" }]);
  };

  // CSV Row handlers
  const handleAddCsvRow = () => {
    setCsvRows([...csvRows, { instruction: "", input: "", output: "" }]);
  };

  const handleDeleteCsvRow = (index: number) => {
    if (csvRows.length > 1) {
      setCsvRows(csvRows.filter((_, i) => i !== index));
    }
  };

  const handleCsvCellChange = (index: number, field: keyof CSVRow, value: string) => {
    const newRows = [...csvRows];
    newRows[index][field] = value;
    setCsvRows(newRows);
  };

  // Save dataset
  const handleSaveDataset = async () => {
    try {
      if (modalMode === "create" && datasetName) {
        const content = convertRowsToFormat(csvRows, selectedFormat);
        const size = new Blob([content]).size;

        const newDataset: Dataset = {
          id: `ds-${Date.now()}`,
          name: datasetName,
          samples: csvRows.length,
          size: formatFileSize(size),
          format: selectedFormat.toUpperCase(),
          createdAt: new Date().toISOString().split("T")[0],
          content,
        };

        const response = await fetch(`${API_URL}/datasets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newDataset),
        });

        if (response.ok) {
          await fetchDatasets();
          handleCloseModal();
        }
      } else if (modalMode === "upload" && uploadedFile) {
        const samples = await parseFileForSampleCount(uploadedFile);
        const newDataset: Dataset = {
          id: `ds-${Date.now()}`,
          name: uploadedFile.name.replace(/\.[^/.]+$/, ""),
          samples,
          size: formatFileSize(uploadedFile.size),
          format: uploadedFile.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
          createdAt: new Date().toISOString().split("T")[0],
        };

        const response = await fetch(`${API_URL}/datasets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newDataset),
        });

        if (response.ok) {
          await fetchDatasets();
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error("Error saving dataset:", error);
    }
  };

  // Delete dataset
  const handleDeleteDataset = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/datasets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchDatasets();
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
    }
  };

  // Handle row click
  const handleRowClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDataset(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-12 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-lg font-normal text-black tracking-tight">
            Dataset Management
          </h1>
          {datasets.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleOpenModal("create")}
                size="sm"
                variant="ghost"
                className="rounded-none hover:bg-neutral-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
              <Button
                onClick={() => handleOpenModal("upload")}
                size="sm"
                variant="ghost"
                className="rounded-none hover:bg-neutral-100"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {datasets.length === 0 ? (
          <EmptyState
            onCreateClick={() => handleOpenModal("create")}
            onUploadClick={() => handleOpenModal("upload")}
          />
        ) : (
          <DatasetTable
            datasets={datasets}
            onDelete={handleDeleteDataset}
            onRowClick={handleRowClick}
          />
        )}

        {/* Create/Upload Modal */}
        <DatasetModal
          isOpen={isModalOpen}
          mode={modalMode}
          datasetName={datasetName}
          selectedFormat={selectedFormat}
          csvRows={csvRows}
          uploadedFile={uploadedFile}
          onClose={handleCloseModal}
          onSave={handleSaveDataset}
          onNameChange={setDatasetName}
          onFormatChange={setSelectedFormat}
          onCellChange={handleCsvCellChange}
          onAddRow={handleAddCsvRow}
          onDeleteRow={handleDeleteCsvRow}
          onFileChange={setUploadedFile}
        />

        {/* Detail Modal */}
        <DatasetDetailModal
          isOpen={isDetailModalOpen}
          dataset={selectedDataset}
          onClose={handleCloseDetailModal}
        />
      </div>
    </div>
  );
}
