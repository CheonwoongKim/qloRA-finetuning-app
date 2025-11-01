"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Trash2, Loader2, MoreVertical, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_URL } from "@/constants/api";
import type { Message } from "@/types/common";

interface FineTunedModel {
  id: string;
  name: string;
  model: string;
  status: string;
}

interface DownloadedModel {
  model_id: string;
  local_path: string;
  size_mb: number;
}

export default function PlaygroundPage() {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [models, setModels] = useState<FineTunedModel[]>([]);
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch completed fine-tuned models and downloaded base models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Fetch fine-tuned models
        const ftResponse = await fetch(`${API_URL}/jobs`);
        if (ftResponse.ok) {
          const ftData = await ftResponse.json();
          const completedModels = ftData.jobs.filter(
            (job: any) => job.status === "completed"
          );
          setModels(completedModels);
        }

        // Fetch downloaded base models
        const dlResponse = await fetch(`${API_URL}/download/list`);
        if (dlResponse.ok) {
          const dlData = await dlResponse.json();
          setDownloadedModels(dlData.models || []);

          // Auto-select first downloaded model if no fine-tuned models
          if (dlData.models.length > 0 && !selectedModel) {
            setSelectedModel(`base:${dlData.models[0].model_id}`);
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if a model is selected
    if (!selectedModel) {
      alert("No model selected.\n\nPlease download a model from the Models page first.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/playground/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: selectedModel,
          message: input,
          history: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Playground Frontend] Received response:", data);
        console.log("[Playground Frontend] Response text:", data.response);
        console.log("[Playground Frontend] Response length:", data.response?.length);

        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || "(Empty response)",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: "assistant",
          content: "Error: Failed to get response from model",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Error: Could not connect to the server",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleExportCSV = () => {
    if (messages.length === 0) {
      alert("No messages to export");
      return;
    }

    // Create CSV content
    const csvHeader = "Role,Content,Timestamp\n";
    const csvRows = messages.map(msg => {
      const content = msg.content.replace(/"/g, '""'); // Escape quotes
      const timestamp = new Date(msg.timestamp).toLocaleString();
      return `"${msg.role}","${content}","${timestamp}"`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `chat_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div>
        {/* Full-size Chat Area */}
        <Card className="rounded-none h-screen flex flex-col border-0">
          {/* Header with Model Selection */}
          <CardHeader className="border-b px-12 py-6">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm font-medium">Chat</CardTitle>
              <div className="flex items-center gap-3">
                {/* Model Selection */}
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-neutral-500">MODEL</Label>
                  {models.length === 0 && downloadedModels.length === 0 ? (
                    <div className="text-xs text-neutral-400">
                      No models available
                    </div>
                  ) : (
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="rounded-none h-8 text-xs w-[250px] border-0 shadow-none focus:ring-0">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {downloadedModels.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500">
                              BASE MODELS
                            </div>
                            {downloadedModels.map((model) => (
                              <SelectItem
                                key={`base:${model.model_id}`}
                                value={`base:${model.model_id}`}
                                className="text-xs"
                              >
                                {model.model_id}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {models.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-500 mt-2">
                              FINE-TUNED MODELS
                            </div>
                            {models.map((model) => (
                              <SelectItem key={`ft:${model.id}`} value={`ft:${model.id}`} className="text-xs">
                                {model.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* More Options Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-8 w-8"
                      disabled={messages.length === 0}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none bg-white">
                    <DropdownMenuItem onClick={handleExportCSV} className="text-xs gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Export to CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearChat} className="text-xs gap-2 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto px-12 py-6">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${
                          message.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="max-w-[70%]">
                          <div
                            className={`px-4 py-2.5 ${
                              message.role === "user"
                                ? "bg-primary text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                                : "text-black rounded-tl-lg rounded-tr-lg rounded-br-lg"
                            }`}
                            style={message.role === "assistant" ? { backgroundColor: '#F1F3F5' } : undefined}
                          >
                            <div className="whitespace-pre-wrap text-xs">
                              {message.content}
                            </div>
                          </div>
                          <div className="mt-2 text-neutral-400 text-right text-[10px]">
                            {new Date(message.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] rounded-tl-lg rounded-tr-lg rounded-br-lg px-4 py-2.5" style={{ backgroundColor: '#F1F3F5' }}>
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-neutral-600 text-xs">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>

          {/* Input Area */}
          <div className="px-12 py-6 pb-8">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="w-full rounded-full h-12 text-sm border-0 pl-6 pr-12 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 placeholder:text-neutral-300"
                  style={{ backgroundColor: '#F1F3F5', boxShadow: 'none' }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || !selectedModel || isLoading}
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-none h-8 w-8"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
