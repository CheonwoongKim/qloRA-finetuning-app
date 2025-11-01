"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Database, CheckCircle, HardDrive, Loader2, X, Brain, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { API_URL } from "@/constants/api";
import type { DownloadedModel } from "@/types/common";

interface UploadedDataset {
  id: string;
  name: string;
  samples: number;
  size: string;
  format?: string;
}

interface NewJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: () => void;
}

export function NewJobModal({ open, onOpenChange, onJobCreated }: NewJobModalProps) {
  const router = useRouter();
  const [jobName, setJobName] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [uploadedDatasets, setUploadedDatasets] = useState<UploadedDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fine-tuning parameters
  const [learningRate, setLearningRate] = useState("2e-4");
  const [epochs, setEpochs] = useState("3");
  const [batchSize, setBatchSize] = useState("4");
  const [maxSeqLength, setMaxSeqLength] = useState("512");

  // QLoRA parameters
  const [loraR, setLoraR] = useState("8");
  const [loraAlpha, setLoraAlpha] = useState("16");
  const [loraDropout, setLoraDropout] = useState("0.05");

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setJobName("");
      setSelectedModel(null);
      setSelectedDataset(null);
      setLearningRate("2e-4");
      setEpochs("3");
      setBatchSize("4");
      setMaxSeqLength("512");
      setLoraR("8");
      setLoraAlpha("16");
      setLoraDropout("0.05");
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const modelsRes = await fetch(`${API_URL}/download/list`);
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setDownloadedModels(modelsData.models || []);
      }
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

  const handleSubmit = async () => {
    if (!jobName.trim() || !selectedModel || !selectedDataset) return;

    try {
      setSubmitting(true);
      const selectedModelData = downloadedModels.find(m => m.model_id === selectedModel);
      const selectedDatasetData = uploadedDatasets.find(d => d.id === selectedDataset);
      const jobData = {
        name: jobName.trim(),
        model: selectedModelData?.model_id || selectedModel,
        dataset: selectedDatasetData?.name || selectedDataset,
        learning_rate: parseFloat(learningRate),
        epochs: parseInt(epochs),
        batch_size: parseInt(batchSize),
        max_seq_length: parseInt(maxSeqLength),
        lora_r: parseInt(loraR),
        lora_alpha: parseInt(loraAlpha),
        lora_dropout: parseFloat(loraDropout),
      };

      const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        const result = await response.json();
        onOpenChange(false);
        if (onJobCreated) onJobCreated();
        router.push(`/jobs/${result.job.id}`);
      }
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = jobName.trim() && selectedModel && selectedDataset && !submitting;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-none w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-3 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-normal text-black">Create New Fine-tuning Job</h2>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="rounded-none h-8" disabled={submitting}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                <div className="text-neutral-500 text-sm">Loading...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">Job Name</h3>
                <Input type="text" placeholder="e.g., Customer Support Model - v1" value={jobName} onChange={(e) => setJobName(e.target.value)} className="rounded-none h-8" />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">Select Base Model</h3>

                {downloadedModels.length === 0 ? (
                  <div className="p-6 border-2 border-dashed rounded-none text-center">
                    <HardDrive className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">No models available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {downloadedModels.map((model) => {
                      const isSelected = selectedModel === model.model_id;
                      const sizeGB = (model.size_mb / 1024).toFixed(2);
                      return (
                        <div key={model.model_id} className={`px-5 py-3 border rounded-none cursor-pointer transition-all ${isSelected ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`} onClick={() => setSelectedModel(model.model_id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                              <Brain className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-black" : "text-neutral-600"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-neutral-900 truncate" style={{ fontSize: '13px', fontWeight: 400 }}>{model.model_id}</p>
                                <p className="text-neutral-500" style={{ fontSize: '10px' }}>{sizeGB} GB</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-5 h-5 text-black flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">Select Dataset</h3>

                {uploadedDatasets.length === 0 ? (
                  <div className="p-6 border-2 border-dashed rounded-none text-center">
                    <Database className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">No datasets available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedDatasets.map((dataset) => {
                      const isSelected = selectedDataset === dataset.id;
                      return (
                        <div key={dataset.id} className={`px-5 py-3 border rounded-none cursor-pointer transition-all ${isSelected ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"}`} onClick={() => setSelectedDataset(dataset.id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                              <Database className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-black" : "text-neutral-600"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-neutral-900 truncate" style={{ fontSize: '13px', fontWeight: 400 }}>{dataset.name}</p>
                                <p className="text-neutral-500" style={{ fontSize: '10px' }}>{dataset.samples} samples</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-5 h-5 text-black flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">Training Parameters</h3>

                <TooltipProvider>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>Learning Rate</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">학습 속도를 제어합니다. 값이 클수록 빠르게 학습하지만 불안정할 수 있습니다. 일반적으로 2e-4 ~ 5e-5 사이 값을 사용합니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="text"
                        placeholder="2e-4"
                        value={learningRate}
                        onChange={(e) => setLearningRate(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>Epochs</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">전체 데이터셋을 몇 번 반복 학습할지 결정합니다. 값이 클수록 더 많이 학습하지만 과적합 위험이 있습니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="3"
                        value={epochs}
                        onChange={(e) => setEpochs(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>Batch Size</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">한 번에 처리할 데이터 샘플 수입니다. 값이 클수록 빠르지만 더 많은 메모리가 필요합니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="4"
                        value={batchSize}
                        onChange={(e) => setBatchSize(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>Max Sequence Length</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">처리할 최대 토큰 길이입니다. 긴 텍스트를 다룰수록 더 큰 값이 필요하지만 메모리 사용량도 증가합니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="512"
                        value={maxSeqLength}
                        onChange={(e) => setMaxSeqLength(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">QLoRA Configuration</h3>

                <TooltipProvider>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>LoRA Rank (r)</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">저랭크 행렬의 차원입니다. 값이 클수록 표현력이 높아지지만 메모리와 계산량이 증가합니다. 일반적으로 8 또는 16을 사용합니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="8"
                        value={loraR}
                        onChange={(e) => setLoraR(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>LoRA Alpha</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">LoRA의 스케일링 파라미터입니다. rank와 함께 학습 강도를 조절합니다. 일반적으로 rank의 2배 값을 사용합니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="16"
                        value={loraAlpha}
                        onChange={(e) => setLoraAlpha(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-xs font-medium text-neutral-700" style={{ fontSize: '10px' }}>LoRA Dropout</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs rounded-none">
                            <p className="text-xs">과적합 방지를 위한 드롭아웃 비율입니다. 0.05 ~ 0.1 사이의 값이 일반적이며, 0은 드롭아웃을 사용하지 않습니다.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="text"
                        placeholder="0.05"
                        value={loraDropout}
                        onChange={(e) => setLoraDropout(e.target.value)}
                        className="rounded-none h-8"
                      />
                    </div>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-none h-8 text-xs hover:bg-neutral-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="rounded-none h-8 text-xs">
            {submitting ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </div>
    </div>
  );
}
