"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewJobModal } from "@/components/new-job-modal";
import { Settings, Activity, Plus, Search, MoreVertical, Play, Trash2, Download, Pause, StopCircle, FileText, Edit, X } from "lucide-react";
import { API_URL } from "@/constants/api";
import type { FineTuningJob } from "@/types/common";
import { StatusBadge } from "@/components/ui/status-badge";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data states
  const [jobs, setJobs] = useState<FineTuningJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);

  // Fetch jobs function
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsRes = await fetch(`${API_URL}/jobs`);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Menu action handlers
  const handleView = (job: FineTuningJob) => {
    window.location.href = `/jobs/${job.id}`;
  };

  const handleStart = async (job: FineTuningJob) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${job.id}/start`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchJobs(); // Refresh the list
        // Navigate to job detail page to see progress
        window.location.href = `/jobs/${job.id}`;
      } else {
        const error = await response.json();
        alert(`Failed to start job: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error starting job:", error);
      alert("Failed to start job. Please try again.");
    }
  };

  const handleEdit = (job: FineTuningJob) => {
    // Navigate to new job page with pre-filled data
    const params = new URLSearchParams({
      edit: job.id,
      name: job.name,
      model: job.model,
      dataset: job.dataset,
    });
    window.location.href = `/new-job?${params.toString()}`;
  };

  const handleDownload = async (job: FineTuningJob) => {
    try {
      // Fetch checkpoints for the job
      const response = await fetch(`${API_URL}/jobs/${job.id}/checkpoints`);
      if (!response.ok) {
        throw new Error("Failed to fetch checkpoints");
      }

      const data = await response.json();
      if (!data.checkpoints || data.checkpoints.length === 0) {
        alert("No checkpoints available for download");
        return;
      }

      // Download the last checkpoint (best model)
      const lastCheckpoint = data.checkpoints[data.checkpoints.length - 1];
      const downloadUrl = `${API_URL}/jobs/${job.id}/checkpoints/${lastCheckpoint.id}/download`;

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${job.id}-checkpoint-${lastCheckpoint.step}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error downloading model:", error);
      alert("Failed to download model. Please try again.");
    }
  };

  const handlePause = async (job: FineTuningJob) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${job.id}/pause`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchJobs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to pause job: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error pausing job:", error);
      alert("Failed to pause job. Please try again.");
    }
  };

  const handleStop = async (job: FineTuningJob) => {
    const confirmed = window.confirm("Are you sure you want to stop this training job?\n\nThis action cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/jobs/${job.id}/stop`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchJobs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to stop job: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error stopping job:", error);
      alert("Failed to stop job. Please try again.");
    }
  };

  const handleViewLogs = (job: FineTuningJob) => {
    // Navigate to job detail page and scroll to logs section
    window.location.href = `/jobs/${job.id}#logs`;
  };

  const handleRetry = async (job: FineTuningJob) => {
    const confirmed = window.confirm("Create a new training job with the same configuration?");
    if (!confirmed) return;

    try {
      // Create a new job with the same configuration
      const newJobData = {
        name: `${job.name} (Retry)`,
        model: job.model,
        dataset: job.dataset,
        // Copy any other relevant configuration
      };

      const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newJobData),
      });

      if (response.ok) {
        await fetchJobs(); // Refresh the list
        alert("New training job created successfully");
      } else {
        const error = await response.json();
        alert(`Failed to create retry job: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error retrying job:", error);
      alert("Failed to retry job. Please try again.");
    }
  };

  const handleDeleteJob = async (job: FineTuningJob) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?\n\nThis action cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchJobs();
      } else {
        const error = await response.json();
        alert(`Failed to delete job: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-12 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-normal text-black tracking-tight">Fine-tuning Jobs</h1>
        </div>

        {/* Show tabs, search, and New Train button only if there are jobs */}
        {jobs.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              {["all", "running", "completed", "failed", "pending"].map((status) => {
                const count = status === "all"
                  ? jobs.length
                  : jobs.filter((j) => j.status === status).length;
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-none ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {status === "all" ? "All" :
                     status === "running" ? "Running" :
                     status === "completed" ? "Completed" :
                     status === "failed" ? "Failed" : "Pending"}
                    <span className={`ml-1.5 text-[10px] ${
                      isActive ? "text-neutral-300" : "text-neutral-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search by name or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <Button
                size="sm"
                onClick={() => setIsNewJobModalOpen(true)}
                className="rounded-none h-8"
              >
                <Plus className="w-3 h-3 mr-2" />
                New Train
              </Button>
            </div>
          </div>
        )}

        {/* Jobs List or Empty State */}
        <div className="space-y-2">
          {jobs.length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <div className="text-center max-w-md">
                <h2 className="font-medium text-neutral-900 mb-2" style={{ fontSize: '14px' }}>No Fine-tuning Jobs Yet</h2>
                <p className="text-neutral-500 mb-8" style={{ fontSize: '12px' }}>Create your first fine-tuning job to get started with customizing language models for your specific use case</p>
                <Button
                  variant="outline"
                  className="gap-2"
                  style={{ fontSize: '13px' }}
                  onClick={() => setIsNewJobModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Create Fine-tuning Job
                </Button>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-neutral-400 mb-4">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p>No jobs match your filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="overflow-hidden cursor-pointer hover:bg-neutral-50 transition-colors rounded-none bg-white"
                onClick={() => window.location.href = `/jobs/${job.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job Name - No Label */}
                      <h3 className="text-sm font-medium text-neutral-900 mb-3">{job.name}</h3>

                      {/* Horizontal Parameters */}
                      <div className="flex items-center gap-6">
                        {/* Model */}
                        <div className="w-48">
                          <p className="text-neutral-500 mb-1 text-[10px]">MODEL</p>
                          <span className="font-medium text-xs truncate block">{job.model}</span>
                        </div>

                        {/* Dataset */}
                        <div className="w-44">
                          <p className="text-neutral-500 mb-1 text-[10px]">DATASET</p>
                          <span className="font-medium text-xs truncate block">{job.dataset}</span>
                        </div>

                        {/* Status */}
                        <div className="w-24">
                          <p className="text-neutral-500 mb-1 text-[10px]">STATUS</p>
                          <StatusBadge status={job.status} />
                        </div>

                        {/* Progress (all jobs) */}
                        <div className="w-32">
                          <p className="text-neutral-500 mb-1 text-[10px]">PROGRESS</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-neutral-100 h-1">
                              <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-black">{job.progress}%</span>
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="w-24">
                          <p className="text-neutral-500 mb-1 text-[10px]">CREATED</p>
                          <span className="font-medium text-xs">{job.createdAt}</span>
                        </div>

                        {/* Duration */}
                        <div className="w-24">
                          <p className="text-neutral-500 mb-1 text-[10px]">DURATION</p>
                          <span className="font-medium text-xs">{job.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-2 ml-6" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50 bg-white rounded-none">
                          {/* View - Always available */}
                          <DropdownMenuItem className="text-xs" onClick={() => handleView(job)}>
                            <Play className="w-3.5 h-3.5 mr-2" />
                            View
                          </DropdownMenuItem>

                          {/* Start - Only for pending or paused jobs */}
                          {(job.status === "pending" || job.status === "paused") && (
                            <DropdownMenuItem className="text-xs" onClick={() => handleStart(job)}>
                              <Play className="w-3.5 h-3.5 mr-2" />
                              Start
                            </DropdownMenuItem>
                          )}

                          {/* Edit - Only for pending jobs */}
                          {job.status === "pending" && (
                            <DropdownMenuItem className="text-xs" onClick={() => handleEdit(job)}>
                              <Edit className="w-3.5 h-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}

                          {/* Pause - Only for running jobs */}
                          {job.status === "running" && (
                            <DropdownMenuItem className="text-xs" onClick={() => handlePause(job)}>
                              <Pause className="w-3.5 h-3.5 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}

                          {/* Stop - Only for running or paused jobs */}
                          {(job.status === "running" || job.status === "paused") && (
                            <DropdownMenuItem className="text-xs" onClick={() => handleStop(job)}>
                              <StopCircle className="w-3.5 h-3.5 mr-2" />
                              Stop
                            </DropdownMenuItem>
                          )}

                          {/* Download Model - Only for completed jobs */}
                          {job.status === "completed" && (
                            <DropdownMenuItem className="text-xs" onClick={() => handleDownload(job)}>
                              <Download className="w-3.5 h-3.5 mr-2" />
                              Download Model
                            </DropdownMenuItem>
                          )}

                          {/* View Logs - For running, completed, and failed jobs */}
                          {(job.status === "running" || job.status === "completed" || job.status === "failed") && (
                            <DropdownMenuItem className="text-xs" onClick={() => handleViewLogs(job)}>
                              <FileText className="w-3.5 h-3.5 mr-2" />
                              View Logs
                            </DropdownMenuItem>
                          )}

                          {/* Retry - Only for failed jobs */}
                          {job.status === "failed" && (
                            <DropdownMenuItem className="text-xs" onClick={() => handleRetry(job)}>
                              <Settings className="w-3.5 h-3.5 mr-2" />
                              Retry
                            </DropdownMenuItem>
                          )}

                          {/* Delete - Always available */}
                          <DropdownMenuItem
                            className="text-red-600 text-xs"
                            onClick={() => handleDeleteJob(job)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>

      {/* New Job Modal */}
      <NewJobModal
        open={isNewJobModalOpen}
        onOpenChange={setIsNewJobModalOpen}
        onJobCreated={fetchJobs}
      />
    </div>
  );
}
