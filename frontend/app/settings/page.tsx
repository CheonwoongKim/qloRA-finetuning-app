"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FolderOpen, Eye, EyeOff, Check, HelpCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    modelPath: "",
    datasetPath: "",
    cachePath: "",
    logPath: "",
    hfToken: "",
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);

  // Initialize default paths
  useEffect(() => {
    const initializePaths = async () => {
      try {
        // Try to get saved settings from localStorage first
        const savedSettings = localStorage.getItem("settings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
          setIsLoading(false);
          return;
        }

        // If running in Electron, get default paths
        if (typeof window !== 'undefined' && window.electron) {
          const homePath = await window.electron.getPath('home');
          const baseDir = `${homePath}/finetuning`;

          const defaultSettings = {
            modelPath: `${baseDir}/models`,
            datasetPath: `${baseDir}/datasets`,
            cachePath: `${baseDir}/cache`,
            logPath: `${baseDir}/logs`,
            hfToken: "",
          };

          setSettings(defaultSettings);
        } else {
          // Fallback for web browser
          const defaultSettings = {
            modelPath: "/path/to/models",
            datasetPath: "/path/to/datasets",
            cachePath: "/path/to/cache",
            logPath: "/path/to/logs",
            hfToken: "",
          };
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error initializing paths:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePaths();
  }, []);

  const handlePathChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleBrowse = async (key: string) => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electron) {
      try {
        const currentPath = settings[key as keyof typeof settings];
        const selectedPath = await window.electron.selectDirectory(currentPath);

        if (selectedPath) {
          handlePathChange(key, selectedPath);
        }
      } catch (error) {
        console.error('Error selecting directory:', error);
        alert('Failed to open directory selector');
      }
    } else {
      // Running in web browser
      alert("File dialog is only available in the desktop app. Please enter the path manually.");
    }
  };

  const handleSave = () => {
    // Trim all path values and token before saving
    const trimmedSettings = {
      modelPath: settings.modelPath.trim(),
      datasetPath: settings.datasetPath.trim(),
      cachePath: settings.cachePath.trim(),
      logPath: settings.logPath.trim(),
      hfToken: settings.hfToken.trim(),
    };

    localStorage.setItem("settings", JSON.stringify(trimmedSettings));
    setSettings(trimmedSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-12 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-lg font-normal text-black tracking-tight">Settings</h1>
          <Button
            onClick={handleSave}
            size="sm"
            className={`gap-2 rounded-none ${isSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            <Check className="w-4 h-4" />
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>

        {/* Storage Paths Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-4">Storage Paths</h2>
          <div className="space-y-2">
            {/* Model Path */}
            <Card className="rounded-none">
            <CardContent className="p-5">
              <div className="grid gap-20" style={{ gridTemplateColumns: "200px 1fr 120px" }}>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-neutral-500 text-[10px]">Model Path</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex">
                          <HelpCircle className="w-3 h-3 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-auto max-w-xs">
                        다운로드한 모델 파일이 저장되는 디렉토리입니다.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="font-medium text-xs">Models storage location</span>
                </div>
                <div>
                  <Input
                    value={settings.modelPath}
                    onChange={(e) => handlePathChange("modelPath", e.target.value)}
                    placeholder="/path/to/models"
                    className=""
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBrowse("modelPath")}
                    className="h-8 w-8 p-0 rounded-none hover:bg-neutral-100"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dataset Path */}
          <Card className="rounded-none">
            <CardContent className="p-5">
              <div className="grid gap-20" style={{ gridTemplateColumns: "200px 1fr 120px" }}>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-neutral-500 text-[10px]">Dataset Path</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex">
                          <HelpCircle className="w-3 h-3 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-auto max-w-xs">
                        학습에 사용할 데이터셋 파일이 저장되는 디렉토리입니다.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="font-medium text-xs">Datasets storage location</span>
                </div>
                <div>
                  <Input
                    value={settings.datasetPath}
                    onChange={(e) => handlePathChange("datasetPath", e.target.value)}
                    placeholder="/path/to/datasets"
                    className=""
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBrowse("datasetPath")}
                    className="h-8 w-8 p-0 rounded-none hover:bg-neutral-100"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Path */}
          <Card className="rounded-none">
            <CardContent className="p-5">
              <div className="grid gap-20" style={{ gridTemplateColumns: "200px 1fr 120px" }}>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-neutral-500 text-[10px]">Cache Path</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex">
                          <HelpCircle className="w-3 h-3 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-auto max-w-xs">
                        임시 파일 및 캐시 데이터가 저장되는 디렉토리입니다.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="font-medium text-xs">Temporary files location</span>
                </div>
                <div>
                  <Input
                    value={settings.cachePath}
                    onChange={(e) => handlePathChange("cachePath", e.target.value)}
                    placeholder="/path/to/cache"
                    className=""
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBrowse("cachePath")}
                    className="h-8 w-8 p-0 rounded-none hover:bg-neutral-100"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log Path */}
          <Card className="rounded-none">
            <CardContent className="p-5">
              <div className="grid gap-20" style={{ gridTemplateColumns: "200px 1fr 120px" }}>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-neutral-500 text-[10px]">Log Path</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex">
                          <HelpCircle className="w-3 h-3 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-auto max-w-xs">
                        학습 과정의 로그 파일이 저장되는 디렉토리입니다.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="font-medium text-xs">Training logs location</span>
                </div>
                <div>
                  <Input
                    value={settings.logPath}
                    onChange={(e) => handlePathChange("logPath", e.target.value)}
                    placeholder="/path/to/logs"
                    className=""
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBrowse("logPath")}
                    className="h-8 w-8 p-0 rounded-none hover:bg-neutral-100"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* API Configuration Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-4">API Configuration</h2>
          <div className="space-y-2">
            {/* Hugging Face Token */}
            <Card className="rounded-none">
              <CardContent className="p-5">
                <div className="grid gap-20" style={{ gridTemplateColumns: "200px 1fr 120px" }}>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-neutral-500 text-[10px]">Hugging Face Token</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex">
                            <HelpCircle className="w-3 h-3 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="text-xs w-auto max-w-xs">
                          Hugging Face의 제한된 모델에 접근하기 위한 인증 토큰입니다.
                        </PopoverContent>
                      </Popover>
                    </div>
                    <span className="font-medium text-xs">Access token for gated models</span>
                  </div>
                  <div>
                    <Input
                      type={showToken ? "text" : "password"}
                      value={settings.hfToken}
                      onChange={(e) => handlePathChange("hfToken", e.target.value)}
                      placeholder="hf_..."
                      className=""
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      className="h-8 w-8 p-0 rounded-none hover:bg-neutral-100"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
