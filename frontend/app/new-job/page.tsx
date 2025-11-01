"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Sparkles,
  Database,
  CheckCircle,
  HardDrive,
  Cpu,
  AlertCircle,
  Loader2
} from "lucide-react";
import { API_URL } from "@/constants/api";
import type { DownloadedModel } from "@/types/common";

interface UploadedDataset {
  id: string;
  name: string;
  samples: number;
  size: string;
  format?: string;
}

export default function NewJobPage() {
  const router = useRouter();

  // Form state
  const [jobName, setJobName] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  // Data states
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [uploadedDatasets, setUploadedDatasets] = useState<UploadedDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch models and datasets on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch downloaded models
        const modelsRes = await fetch(`${API_URL}/download/list`);
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          setDownloadedModels(modelsData.models || []);
        }

        // Fetch uploaded datasets
        const datasetsRes = await fetch(`${API_URL}/datasets`);
        if (datasetsRes.ok) {
          const datasetsData = await datasetsRes.json();
          setUploadedDatasets(datasetsData.datasets || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!jobName.trim() || !selectedModel || !selectedDataset) {
      return;
    }

    try {
      setSubmitting(true);

      const selectedModelData = downloadedModels.find(m => m.model_id === selectedModel);
      const selectedDatasetData = uploadedDatasets.find(d => d.id === selectedDataset);

      const jobData = {
        name: jobName.trim(),
        model: selectedModelData?.model_id || selectedModel,
        dataset: selectedDatasetData?.name || selectedDataset,
      };

      const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to the created job's detail page
        router.push(`/jobs/${result.job.id}`);
      } else {
        console.error("Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = jobName.trim() && selectedModel && selectedDataset && !submitting;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
          <div className="text-neutral-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Fixed */}
      <div className="bg-white border-b">
        <div className="px-12 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-black mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <h1 className="text-lg font-semibold text-black tracking-tight mb-2">
            Create New Fine-tuning Job
          </h1>
          <p className="text-sm text-neutral-500">
            Configure and start a new fine-tuning job
          </p>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="px-12 py-8 pb-24 max-w-4xl mx-auto space-y-8">

          {/* Job Name Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Job Name</h2>
              <p className="text-sm text-neutral-500">
                Give your fine-tuning job a descriptive name
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Label htmlFor="job-name" className="text-sm font-medium text-neutral-700 mb-2 block">
                  Name
                </Label>
                <Input
                  id="job-name"
                  type="text"
                  placeholder="e.g., Customer Support Model - v1"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Model Selection Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Select Base Model</h2>
              <p className="text-sm text-neutral-500">
                Choose a pre-trained model to fine-tune
              </p>
            </div>

            {downloadedModels.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                      <HardDrive className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">
                      No Models Available
                    </h3>
                    <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
                      You need to download a base model before creating a fine-tuning job.
                      Visit the Models page to download your first model.
                    </p>
                    <Link href="/models">
                      <Button size="sm">
                        <HardDrive className="w-4 h-4 mr-2" />
                        Download Models
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {downloadedModels.map((model) => {
                  const isSelected = selectedModel === model.model_id;
                  const sizeGB = (model.size_mb / 1024).toFixed(2);

                  return (
                    <Card
                      key={model.model_id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                        isSelected
                          ? "border-black bg-neutral-50 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      onClick={() => setSelectedModel(model.model_id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Model Header */}
                            <div className="flex items-start gap-3">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                                isSelected ? "bg-neutral-200" : "bg-neutral-100"
                              }`}>
                                <Sparkles className={`w-6 h-6 ${
                                  isSelected ? "text-black" : "text-neutral-600"
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base text-neutral-900 mb-1 truncate">
                                  {model.model_id}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-neutral-500">
                                  <div className="flex items-center gap-1.5">
                                    <HardDrive className="w-3.5 h-3.5" />
                                    <span className="font-medium">{sizeGB} GB</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5" />
                                    <span>Ready for training</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Model Details */}
                            <div className={`p-3 rounded-lg ${
                              isSelected ? "bg-white border border-neutral-300" : "bg-neutral-50"
                            }`}>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-neutral-500">Location:</span>
                                  <p className="font-mono text-[10px] text-neutral-700 mt-0.5 truncate">
                                    {model.local_path}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-neutral-500">Storage:</span>
                                  <p className="font-medium text-neutral-900 mt-0.5">
                                    {model.size_mb.toFixed(0)} MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          <div className="ml-4 flex-shrink-0">
                            {isSelected ? (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-neutral-300" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dataset Selection Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Select Dataset</h2>
              <p className="text-sm text-neutral-500">
                Choose a dataset for training
              </p>
            </div>

            {uploadedDatasets.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                      <Database className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">
                      No Datasets Available
                    </h3>
                    <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
                      You need to upload a dataset before creating a fine-tuning job.
                      Visit the Data page to upload your first dataset.
                    </p>
                    <Link href="/data">
                      <Button size="sm">
                        <Database className="w-4 h-4 mr-2" />
                        Upload Dataset
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {uploadedDatasets.map((dataset) => {
                  const isSelected = selectedDataset === dataset.id;

                  return (
                    <Card
                      key={dataset.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                        isSelected
                          ? "border-black bg-neutral-50 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      onClick={() => setSelectedDataset(dataset.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                              isSelected ? "bg-neutral-200" : "bg-neutral-100"
                            }`}>
                              <Database className={`w-6 h-6 ${
                                isSelected ? "text-black" : "text-neutral-600"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-neutral-900 mb-1 truncate">
                                {dataset.name}
                              </h3>
                              <div className="flex items-center gap-4 text-xs text-neutral-500">
                                <span>{dataset.samples} samples</span>
                                <span>•</span>
                                <span>{dataset.size}</span>
                                {dataset.format && (
                                  <>
                                    <span>•</span>
                                    <span>{dataset.format}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          <div className="ml-4 flex-shrink-0">
                            {isSelected ? (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-neutral-300" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Fixed Bottom Navigation Panel */}
      <div className="fixed bottom-0 left-20 right-0 bg-white border-t shadow-lg z-50">
        <div className="px-12 py-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Cancel Button */}
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>
            </Link>

            {/* Right Side: Validation Message + Submit Button */}
            <div className="flex items-center gap-3">
              {/* Validation Message */}
              {!canSubmit && !submitting && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {!jobName.trim() ? "Enter a job name" :
                     !selectedModel ? "Select a model" :
                     "Select a dataset"}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Fine-tuning Job
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
