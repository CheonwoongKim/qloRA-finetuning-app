"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Activity,
  Zap,
  TrendingDown,
  Clock,
  HardDrive,
  Cpu,
  Download,
  Pause,
  StopCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { API_URL } from "@/constants/api";
import type { LossDataPoint } from "@/types/common";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [isTraining, setIsTraining] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(1);
  const [stats, setStats] = useState({
    loss: 0,
    learningRate: 0,
    samplesPerSecond: 0,
    vramUsage: 0,
    timeElapsed: "00:00:00",
    timeRemaining: "00:00:00",
  });
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobInfo, setJobInfo] = useState<{
    id: string;
    name: string;
    model: string;
    dataset: string;
    status: "running" | "completed" | "failed" | "pending";
  } | null>(null);
  const [logs, setLogs] = useState<Array<{timestamp: string; level: string; message: string}>>([]);
  const [checkpoints, setCheckpoints] = useState<Array<{
    id: string;
    epoch: number;
    step: number;
    loss: number;
    timestamp: string;
    file_path: string;
    file_size_mb: number;
  }>>([]);

  // Download checkpoint handler
  const handleDownloadCheckpoint = async (checkpointId: string, step: number) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/checkpoints/${checkpointId}/download`);

      if (!response.ok) {
        throw new Error("Failed to download checkpoint");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${jobInfo?.name || jobId}-checkpoint-${step}.json`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading checkpoint:", error);
      alert("Failed to download checkpoint. Please try again.");
    }
  };

  // Fetch job info and metrics from API
  useEffect(() => {
    const fetchJobInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${jobId}/info`);
        if (response.ok) {
          const data = await response.json();
          setJobInfo({
            id: data.id,
            name: data.name,
            model: data.model,
            dataset: data.dataset,
            status: data.status
          });
          setProgress(data.progress || 0);
          setIsTraining(data.status === "running");
        }
      } catch (err) {
        console.error("Error fetching job info:", err);
      }
    };

    const fetchLossData = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${jobId}/metrics`);
        if (!response.ok) {
          throw new Error("Failed to fetch loss data");
        }
        const data = await response.json();
        setLossHistory(data.loss_history);

        if (data.current_metrics) {
          setStats(prev => ({
            ...prev,
            loss: data.current_metrics.current_loss
          }));
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching loss data:", err);
        setLoading(false);
      }
    };

    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${jobId}/logs`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };

    const fetchCheckpoints = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${jobId}/checkpoints`);
        if (response.ok) {
          const data = await response.json();
          setCheckpoints(data.checkpoints || []);
        }
      } catch (err) {
        console.error("Error fetching checkpoints:", err);
      }
    };

    fetchJobInfo();
    fetchLossData();
    fetchLogs();
    fetchCheckpoints();

    const interval = setInterval(() => {
      if (isTraining) {
        fetchLossData();
        fetchLogs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, isTraining]);

  if (!jobInfo) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
          <div className="text-gray-500 text-xs">Loading job details...</div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    const statusConfig = {
      running: {
        icon: Activity,
        text: "Running",
        bg: "bg-neutral-100",
        text_color: "text-black",
        border: "border-neutral-200",
        dot: "bg-black"
      },
      completed: {
        icon: CheckCircle2,
        text: "Completed",
        bg: "bg-green-50",
        text_color: "text-green-700",
        border: "border-green-200",
        dot: "bg-green-500"
      },
      failed: {
        icon: AlertCircle,
        text: "Failed",
        bg: "bg-red-50",
        text_color: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500"
      },
      pending: {
        icon: Clock,
        text: "Pending",
        bg: "bg-neutral-50",
        text_color: "text-neutral-700",
        border: "border-neutral-200",
        dot: "bg-neutral-500"
      }
    };

    const config = statusConfig[jobInfo.status];
    const Icon = config.icon;

    return (
      <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-sm ${config.bg} ${config.text_color} border ${config.border} inline-flex items-center gap-1.5`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-12 py-12">
        {/* Top Bar */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-black text-xs mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Jobs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-normal text-black mb-1">{jobInfo.name}</h1>
              <p className="text-xs text-neutral-500">Job ID: {jobInfo.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {isTraining && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 rounded-none">
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50 rounded-none">
                    <StopCircle className="w-3.5 h-3.5" />
                    Stop
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
          {/* Configuration Section */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-3">Configuration</h2>
            <Card className="rounded-none border-0 bg-white">
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-x-12 gap-y-4">
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">BASE MODEL</div>
                    <div className="text-xs font-medium text-neutral-900">{jobInfo.model}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">DATASET</div>
                    <div className="text-xs font-medium text-neutral-900">{jobInfo.dataset}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">EPOCHS</div>
                    <div className="text-xs font-medium text-neutral-900">3</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">BATCH SIZE</div>
                    <div className="text-xs font-medium text-neutral-900">4</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">LEARNING RATE</div>
                    <div className="text-xs font-medium text-neutral-900">2e-4</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-3">Training Progress</h2>
            <Card className="rounded-none border-0 bg-white">
              <CardContent className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-neutral-500">Epoch {currentEpoch}/3</span>
                    <span className="text-xs font-medium text-neutral-900">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">TIME ELAPSED</div>
                    <div className="text-xs font-medium text-neutral-900">{stats.timeElapsed}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">TIME REMAINING</div>
                    <div className="text-xs font-medium text-neutral-900">{stats.timeRemaining}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Grid */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 mb-3">Metrics</h2>
            <div className="grid grid-cols-4 gap-4">
              <Card className="rounded-none border-0 bg-white">
                <CardContent className="p-5">
                  <div className="text-[10px] text-neutral-400 mb-2">TRAINING LOSS</div>
                  <div className="text-xl font-semibold text-neutral-900">
                    {stats.loss.toFixed(4)}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-0 bg-white">
                <CardContent className="p-5">
                  <div className="text-[10px] text-neutral-400 mb-2">LEARNING RATE</div>
                  <div className="text-xl font-semibold text-neutral-900">
                    {stats.learningRate.toFixed(4)}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-0 bg-white">
                <CardContent className="p-5">
                  <div className="text-[10px] text-neutral-400 mb-2">SAMPLES/SECOND</div>
                  <div className="text-xl font-semibold text-neutral-900">
                    {stats.samplesPerSecond.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-0 bg-white">
                <CardContent className="p-5">
                  <div className="text-[10px] text-neutral-400 mb-2">VRAM USAGE</div>
                  <div className="text-xl font-semibold text-neutral-900">
                    {stats.vramUsage.toFixed(1)} GB
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts">
          <div className="mb-6">
            <Card className="rounded-none border-0 bg-white">
              <CardContent className="p-6">
                {loading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-neutral-400 text-xs">Loading chart data...</div>
                  </div>
                ) : lossHistory.length === 0 ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-neutral-400 text-xs">No training data available yet</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={lossHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="step"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Training Step', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: '#6b7280' } }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Loss', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 11,
                          borderRadius: 4,
                          border: '1px solid #e5e7eb',
                          backgroundColor: 'white'
                        }}
                        formatter={(value: number) => value.toFixed(4)}
                        labelFormatter={(label) => `Step ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Training Loss"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
          <div className="mb-6">
            <Card className="rounded-none border-0 bg-white">
              <CardContent className="p-0">
                <div className="bg-neutral-900 text-green-400 font-mono text-xs h-[600px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-neutral-500 text-center py-24">No logs available</div>
                  ) : (
                    <div className="p-4">
                      {logs.map((log, idx) => (
                        <div key={idx} className="mb-1">
                          <span className="text-neutral-500">[{log.timestamp}]</span> {log.message}
                        </div>
                      ))}
                      {isTraining && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-neutral-500">Training in progress...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            {/* Checkpoints Tab */}
            <TabsContent value="checkpoints">
          <div>
            {checkpoints.length === 0 ? (
              <Card className="rounded-none border-0 bg-white">
                <CardContent className="py-12 text-center">
                  <div className="text-neutral-400 text-xs">
                    No checkpoints saved yet
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {checkpoints.map((checkpoint) => (
                  <Card key={checkpoint.id} className="hover:bg-neutral-50 transition-colors rounded-none border-0 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-neutral-900">
                              Epoch {checkpoint.epoch}
                            </span>
                            <span className="text-neutral-400">·</span>
                            <span className="text-sm text-neutral-500">
                              Step {checkpoint.step}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-400">Loss:</span>
                              <span className="text-neutral-700 font-medium">{checkpoint.loss.toFixed(4)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-400">Size:</span>
                              <span className="text-neutral-700 font-medium">{checkpoint.file_size_mb.toFixed(1)} MB</span>
                            </div>
                            <span className="text-neutral-400">{checkpoint.timestamp}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 h-8 rounded-none"
                          onClick={() => handleDownloadCheckpoint(checkpoint.id, checkpoint.step)}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
            </TabsContent>
          </Tabs>

      </div>
    </div>
  );
}
