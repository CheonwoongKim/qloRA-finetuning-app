"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Heart, Plus, X, CheckCircle, Loader2, Trash2, AlertCircle } from "lucide-react";
import { API_URL } from "@/constants/api";
import type { Model, DownloadedModel, DownloadStatus } from "@/types/common";

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchModels, setSearchModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({});
  const [hfToken, setHfToken] = useState<string>("");
  const downloadIntervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    fetchDownloadedModels();
    // Load token from localStorage
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const token = settings.hfToken || "";
      setHfToken(token);
      console.log("[Models] Loaded HF token from settings:", token ? `${token.substring(0, 10)}...` : "(empty)");
    } else {
      console.log("[Models] No settings found in localStorage");
    }

    // Cleanup intervals on unmount
    return () => {
      Object.values(downloadIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const fetchDownloadedModels = async () => {
    try {
      const response = await fetch(`${API_URL}/download/list`);
      const data = await response.json();
      setDownloadedModels(data.models || []);
    } catch (error) {
      console.error("Failed to fetch downloaded models:", error);
    }
  };

  const fetchRecommendedModels = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/models/recommended/small-language-models`);
      if (hfToken) {
        url.searchParams.append("token", hfToken);
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      setSearchModels(data.models || []);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRecommendedModels();
      return;
    }

    setLoading(true);
    try {
      const url = new URL(`${API_URL}/models/search`);
      url.searchParams.append("query", searchQuery);
      url.searchParams.append("limit", "12");
      if (hfToken) {
        url.searchParams.append("token", hfToken);
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      setSearchModels(data.models || []);
    } catch (error) {
      console.error("Failed to search models:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleDownload = async (modelId: string) => {
    try {
      const tokenToSend = hfToken && hfToken.trim() !== "" ? hfToken.trim() : null;
      console.log("[Models] Starting download for:", modelId);
      console.log("[Models] Token present:", tokenToSend ? "Yes" : "No");

      setDownloadStatus((prev) => ({
        ...prev,
        [modelId]: { status: "downloading", progress: 0 },
      }));

      const response = await fetch(`${API_URL}/download/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: modelId,
          token: tokenToSend
        }),
      });

      const data = await response.json();

      if (data.status === "started" || data.status === "already_downloading") {
        // 다운로드 상태 폴링 - ref에 저장하여 컴포넌트 상태와 독립적으로 관리
        const interval = setInterval(async () => {
          const statusResponse = await fetch(`${API_URL}/download/status/${encodeURIComponent(modelId)}`);
          const statusData = await statusResponse.json();

          setDownloadStatus((prev) => ({
            ...prev,
            [modelId]: {
              status: statusData.status,
              progress: statusData.progress || 0,
              error: statusData.error,
            },
          }));

          if (statusData.status === "completed") {
            clearInterval(interval);
            delete downloadIntervalsRef.current[modelId];
            // 다운로드 완료 후 목록 새로고침
            fetchDownloadedModels();
            // 성공 알림 (선택사항)
            console.log(`✓ Model ${modelId} downloaded successfully`);
          } else if (statusData.status === "failed") {
            clearInterval(interval);
            delete downloadIntervalsRef.current[modelId];
            // Show error message
            const errorMsg = statusData.error || "Download failed. Please try again.";
            alert(`Download Failed\n\n${errorMsg}`);
          }
        }, 2000);

        // interval을 ref에 저장
        downloadIntervalsRef.current[modelId] = interval;

        // 다운로드 시작 알림
        alert(`Download Started\n\nModel ${modelId} is now downloading in the background.\nYou can continue using the app while the download completes.`);

        // 모달을 즉시 닫을 수 있도록 (다운로드는 백그라운드에서 계속)
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to download model:", error);
      setDownloadStatus((prev) => ({
        ...prev,
        [modelId]: { status: "failed", progress: 0 },
      }));
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to delete ${modelId}?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/download/delete/${encodeURIComponent(modelId)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the downloaded models list
        await fetchDownloadedModels();

        // Clear selected model if it was deleted
        if (selectedModel === modelId) {
          setSelectedModel(null);
        }

        // Show success message (optional)
        console.log(`Model ${modelId} deleted successfully`);
      } else {
        const error = await response.json();
        console.error("Failed to delete model:", error);
        alert(`Failed to delete model: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to delete model:", error);
      alert("Failed to delete model. Please try again.");
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    fetchRecommendedModels();
  };

  const getDownloadButton = (modelId: string) => {
    const status = downloadStatus[modelId];

    if (status?.status === "downloading") {
      return (
        <Button size="sm" disabled className="gap-2 h-8 rounded-none">
          <Loader2 className="w-4 h-4 animate-spin" />
          Downloading...
        </Button>
      );
    }

    if (status?.status === "completed") {
      return (
        <Button size="sm" variant="outline" className="gap-2 h-8 rounded-none" disabled>
          <CheckCircle className="w-4 h-4 text-green-600" />
          Downloaded
        </Button>
      );
    }

    if (status?.status === "failed") {
      return (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 h-8 rounded-none border-red-300 text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            const errorMsg = status.error || "Download failed. This model may require authentication.";
            alert(`Download Failed\n\n${errorMsg}`);
          }}
        >
          <AlertCircle className="w-4 h-4" />
          Failed
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-2 h-8 rounded-none"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload(modelId);
        }}
      >
        <Download className="w-4 h-4" />
        Download
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-12 py-12">
        <div className="mb-8">
          <h1 className="text-lg font-normal text-black tracking-tight">Model Selection</h1>
        </div>

        {/* Downloaded Models Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Add Model Slot - Always First */}
          <Card
            className="rounded-none cursor-pointer transition-all border-dashed border-2 border-neutral-400 flex items-center justify-center min-h-[200px] bg-transparent hover:bg-neutral-50 hover:border-neutral-500"
            onClick={openModal}
          >
            <div className="text-center">
              <Plus className="w-4 h-4 mx-auto text-neutral-400 mb-2" />
              <p className="text-xs text-neutral-600">Add Model</p>
            </div>
          </Card>

          {/* Show downloading models */}
          {Object.entries(downloadStatus).filter(([_, status]) => status.status === "downloading").map(([modelId, status]) => (
            <Card
              key={`downloading-${modelId}`}
              className="rounded-none border-neutral-300 bg-neutral-50"
            >
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-500 mb-1 text-[10px]">MODEL</p>
                      <span className="font-medium text-xs truncate block">{modelId.split("/")[1] || modelId}</span>
                    </div>
                    <Loader2 className="w-4 h-4 text-black ml-2 flex-shrink-0 animate-spin" />
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">AUTHOR</p>
                    <span className="font-medium text-xs truncate block">{modelId.split("/")[0] || "unknown"}</span>
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">STATUS</p>
                    <span className="font-medium text-xs text-black">Downloading...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {downloadedModels.map((model) => (
            <Card
              key={model.model_id}
              className={`rounded-none cursor-pointer transition-all ${
                selectedModel === model.model_id
                  ? "ring-2 ring-black border-black"
                  : ""
              }`}
              onClick={() => setSelectedModel(model.model_id)}
            >
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-500 mb-1 text-[10px]">MODEL</p>
                      <span className="font-medium text-xs truncate block">{model.model_id.split("/")[1] || model.model_id}</span>
                    </div>
                    {selectedModel === model.model_id && (
                      <CheckCircle className="w-4 h-4 text-black ml-2 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">AUTHOR</p>
                    <span className="font-medium text-xs truncate block">{model.model_id.split("/")[0] || "unknown"}</span>
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">SIZE</p>
                    <span className="font-medium text-xs">{model.size_mb.toFixed(2)} MB</span>
                  </div>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 w-full h-8 rounded-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModel(model.model_id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Search Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-none w-full max-w-3xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-normal text-black">Search and Download Model</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-none h-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Search models from Hugging Face Hub..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10 rounded-none h-8 text-xs border-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                    />
                  </div>
                  <Button onClick={performSearch} className="rounded-none h-8">Search</Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                    <div className="text-gray-500 text-[12px] font-normal">Searching models...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {searchModels.map((model) => (
                      <Card key={model.id} className="rounded-none">
                        <CardContent className="p-5">
                          <div className="space-y-3">
                            {/* Model Name and Download Button */}
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-medium text-sm truncate">{model.name}</span>
                              <div className="flex-shrink-0">
                                {getDownloadButton(model.id)}
                              </div>
                            </div>
                            {/* Metadata */}
                            <div className="flex items-center gap-6 flex-wrap">
                              <div>
                                <p className="text-neutral-500 mb-1 text-[10px]">AUTHOR</p>
                                <span className="font-medium text-xs">{model.author}</span>
                              </div>
                              <div>
                                <p className="text-neutral-500 mb-1 text-[10px]">DOWNLOADS</p>
                                <div className="flex items-center gap-1">
                                  <Download className="w-3 h-3 text-neutral-500" />
                                  <span className="font-medium text-xs">{formatNumber(model.downloads)}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-neutral-500 mb-1 text-[10px]">LIKES</p>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-neutral-500" />
                                  <span className="font-medium text-xs">{formatNumber(model.likes)}</span>
                                </div>
                              </div>
                              {model.tags.length > 0 && (
                                <div>
                                  <p className="text-neutral-500 mb-1 text-[10px]">TAGS</p>
                                  <div className="flex flex-wrap gap-1">
                                    {model.tags.slice(0, 3).map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-neutral-100 rounded-none text-[10px] text-neutral-600"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
