"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getApiUrl } from "@/lib/api-config";

interface HardwareStats {
  cpu: {
    usage: number;
    cores: number;
    frequency: number | null;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  gpu: Array<{
    id: number;
    name: string;
    load: number;
    memory_used: number;
    memory_total: number;
    memory_util: number;
    temperature: number;
  }>;
}

interface HistoryData {
  time: string;
  cpu: number;
  ram: number;
  vram: number | null;
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<HardwareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);

  const fetchHardwareStats = async () => {
    try {
      const apiUrl = getApiUrl();
      console.log('[Monitoring] Using API URL:', apiUrl);
      const response = await fetch(`${apiUrl}/hardware/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch hardware stats");
      }
      const data = await response.json();
      setStats(data);
      setError(null);

      // Add to history data
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newDataPoint: HistoryData = {
        time: timeStr,
        cpu: data.cpu.usage,
        ram: data.memory.percent,
        vram: data.gpu.length > 0 ? data.gpu[0].memory_util : null,
      };

      setHistoryData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 180 data points (6 minutes at 2 second intervals)
        return updated.slice(-180);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching hardware stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchHardwareStats();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchHardwareStats, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTemperatureColor = (temp: number) => {
    if (temp >= 80) return "text-red-600";
    if (temp >= 70) return "text-orange-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
          <div className="text-gray-500 text-[12px] font-normal">Loading hardware information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-red-600 text-[12px] font-normal">Error: {error}</div>
          <div className="text-[12px] text-gray-500">
            Make sure the backend server is running
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const gpu = stats.gpu.length > 0 ? stats.gpu[0] : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-12 py-12">
        <div className="mb-8">
          <h1 className="text-lg font-normal text-black tracking-tight">Hardware Monitoring</h1>
        </div>

        {/* Usage History Chart */}
        {historyData.length > 0 && (
          <Card className="rounded-none mb-6">
            <CardContent className="p-6">
              <p className="text-neutral-500 mb-4 text-[10px]">Usage History (Last 6 Minutes)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                    label={{ value: '%', position: 'insideLeft', style: { fontSize: 10 } }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 0 }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="CPU"
                  />
                  <Line
                    type="monotone"
                    dataKey="ram"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    name="RAM"
                  />
                  {historyData.some(d => d.vram !== null) && (
                    <Line
                      type="monotone"
                      dataKey="vram"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="VRAM"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Hardware Cards */}
        <div className="space-y-2">
          {/* GPU Information */}
          {gpu ? (
            <Card className="rounded-none">
              <CardContent className="p-6">
                <div className="grid gap-20" style={{ gridTemplateColumns: "200px 200px 200px 200px 1fr" }}>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">GPU Model</p>
                    <span className="font-medium text-xs">{gpu.name}</span>
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">Status</p>
                    <span className="font-medium text-xs text-black">Active</span>
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">VRAM</p>
                    <div className="space-y-1">
                      <span className="font-medium text-xs">
                        {gpu.memory_used.toFixed(1)} / {gpu.memory_total.toFixed(1)} GB
                      </span>
                      <Progress value={gpu.memory_util} className="h-1" />
                    </div>
                  </div>
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">Utilization</p>
                    <div className="space-y-1">
                      <span className="font-medium text-xs">{gpu.load.toFixed(0)}%</span>
                      <Progress value={gpu.load} className="h-1" />
                    </div>
                  </div>
                  {gpu.temperature > 0 && (
                    <div>
                      <p className="text-neutral-500 mb-1 text-[10px]">Temperature</p>
                      <span className={`font-medium text-xs ${getTemperatureColor(gpu.temperature)}`}>
                        {gpu.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">GPU</p>
                    <span className="font-medium text-xs text-gray-500">Not Found</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CPU Information */}
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="grid gap-20" style={{ gridTemplateColumns: "200px 200px 200px 200px 1fr" }}>
                <div>
                  <p className="text-neutral-500 mb-1 text-[10px]">CPU Model</p>
                  <span className="font-medium text-xs">{stats.cpu.model}</span>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1 text-[10px]">CPU Cores</p>
                  <span className="font-medium text-xs">{stats.cpu.cores}</span>
                </div>
                {stats.cpu.frequency && (
                  <div>
                    <p className="text-neutral-500 mb-1 text-[10px]">Frequency</p>
                    <span className="font-medium text-xs">{stats.cpu.frequency.toFixed(0)} MHz</span>
                  </div>
                )}
                <div>
                  <p className="text-neutral-500 mb-1 text-[10px]">CPU Usage</p>
                  <div className="space-y-1">
                    <span className="font-medium text-xs">{stats.cpu.usage.toFixed(1)}%</span>
                    <Progress value={stats.cpu.usage} className="h-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory & Storage */}
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="grid gap-20" style={{ gridTemplateColumns: "200px 200px 200px 1fr" }}>
                <div>
                  <p className="text-neutral-500 mb-1 text-[10px]">System Status</p>
                  <span className="font-medium text-xs text-green-600">Healthy</span>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1 text-[10px]">RAM</p>
                  <div className="space-y-1">
                    <span className="font-medium text-xs">
                      {stats.memory.used.toFixed(1)} / {stats.memory.total.toFixed(1)} GB
                    </span>
                    <Progress value={stats.memory.percent} className="h-1" />
                  </div>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1 text-[10px]">Disk</p>
                  <div className="space-y-1">
                    <span className="font-medium text-xs">
                      {stats.disk.used.toFixed(1)} / {stats.disk.total.toFixed(1)} GB
                    </span>
                    <Progress value={stats.disk.percent} className="h-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
