"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2 } from "lucide-react";
import {
  ApiResponse,
  useLicensePlateStore,
} from "@/lib/store/license-plate-store";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { FileUploadTab } from "./lpr/file-upload-tab";
import { UrlInputTab } from "./lpr/url-input-tab";
import { DetectionList } from "./lpr/detection-list";
import { DetectionDetails } from "./lpr/detection-details";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ProcessImageResponse {
  detections: any[];
  processed_image_url: string;
  error?: string | null;
  processing_time_ms?: number;
}

interface ExampleItem {
  type: "local" | "remote";
  value: string;
}

const localExamplePaths = [
  "/example/1-bien.jpg",
  "/example/bien-so-choi.jpg",
  "/example/huong-xeo.jpg",
];
const remoteExampleUrls = [
  "https://giadinh.mediacdn.vn/296230595582509056/2022/4/23/bien7-16507022179641381184450.jpg",
  "https://th.bing.com/th/id/OIP.OhXJpqpzhrOxojf4X9G9mQHaFj?w=241&h=181&c=7&r=0&o=5&pid=1.7",
  "https://th.bing.com/th/id/OIP.0EIBxWjvF9ZLk6IufTeAfAHaE8?rs=1&pid=ImgDetMain",
];
const allExamples: ExampleItem[] = [
  ...localExamplePaths.map((path) => ({ type: "local" as const, value: path })),
  ...remoteExampleUrls.map((url) => ({ type: "remote" as const, value: url })),
];

interface QuickExamplesProps {
  baseUrl: string;
  onExampleClick: (example: ExampleItem) => void;
}

const QuickExamples = React.memo<QuickExamplesProps>(
  ({ baseUrl, onExampleClick }) => {
    return (
      <Card className="md:w-1/3 lg:w-1/4 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Ví dụ dùng nhanh</CardTitle>
          <CardDescription>Nhấp vào ảnh để điền nhanh vào ô URL</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(85vh-150px)] rounded-md border border-muted/30 pr-3">
            <div className="grid grid-cols-2 gap-3 p-3 ">
              {allExamples.map((example, index) => (
                <button
                  key={`${example.type}-${index}`}
                  onClick={() => onExampleClick(example)} // Use the passed callback
                  className="overflow-hidden rounded-md border border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-150 ease-in-out shadow-sm hover:shadow-md block group relative aspect-[3/2]"
                  aria-label={`Sử dụng ví dụ ${example.type} ${index + 1}`}
                  title={`Sử dụng ảnh này (${example.type})`}
                >
                  <Image
                    src={example.value}
                    alt={`Ví dụ ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 150px"
                    className="object-cover group-hover:scale-105 transition-transform duration-150 ease-in-out"
                    unoptimized={example.type === "remote"}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parentButton = target.closest("button");
                      if (
                        parentButton &&
                        !parentButton.querySelector(".error-placeholder")
                      ) {
                        const placeholder = document.createElement("div");
                        placeholder.className =
                          "error-placeholder absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs p-1";
                        placeholder.textContent = "Lỗi tải ảnh";
                        parentButton.appendChild(placeholder);
                      }
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 text-center">
                    <Badge
                      variant={
                        example.type === "local" ? "secondary" : "outline"
                      }
                      className="text-xs scale-90 origin-bottom-left"
                    >
                      {example.type === "local" ? "Local" : "URL"}
                    </Badge>
                  </div>
                </button>
              ))}
              {allExamples.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 col-span-2">
                  Không tìm thấy ảnh ví dụ hợp lệ.
                </p>
              )}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
);
QuickExamples.displayName = "QuickExamples";

export function LicensePlateUpload() {
  const {
    selectedFile,
    previewUrl,
    loading,
    loadingMessage,
    loadingProgress,
    result,
    error,
    selectedDetection,
    imageUrl,
    inputMethod,
    getCurrentDetection,
    setSelectedFile,
    setPreviewUrl,
    setLoading,
    setLoadingMessage,
    setLoadingProgress,
    setResult,
    setError,
    setSelectedDetection,
    setImageUrl,
    setInputMethod,
  } = useLicensePlateStore();

  const currentDetection = getCurrentDetection();

  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const handleExampleClick = useCallback(
    (example: ExampleItem) => {
      let urlToUse = "";
      if (example.type === "local" && baseUrl) {
        urlToUse = `${baseUrl}${example.value}`;
      } else if (example.type === "remote") {
        urlToUse = example.value;
      }

      if (urlToUse) {
        setInputMethod("url");
        setImageUrl(urlToUse);
        setResult(null);
        setError(null);
        setPreviewUrl(null);
        setSelectedFile(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [
      baseUrl,
      setInputMethod,
      setImageUrl,
      setResult,
      setError,
      setPreviewUrl,
      setSelectedFile,
    ]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setImageUrl("");
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (inputMethod === "file" && !selectedFile) {
      setError("Vui lòng chọn file ảnh trước khi nhận dạng");
      return;
    }

    if (inputMethod === "url" && !imageUrl) {
      setError("Vui lòng nhập URL ảnh trước khi nhận dạng");
      return;
    }

    setLoading(true);
    setLoadingMessage("Đang kết nối...");
    setLoadingProgress(10);
    setError(null);
    setResult(null);
    setSelectedDetection(null);

    let progressInterval: NodeJS.Timeout | null = null;
    try {
      let currentProgress = 10;
      setLoadingProgress(currentProgress);
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 5 + 2;
        if (currentProgress >= 95) {
          currentProgress = 95;
          if (progressInterval) clearInterval(progressInterval);
        }
        setLoadingProgress(currentProgress);

        if (currentProgress < 30) {
          setLoadingMessage("Đang tải lên...");
        } else if (currentProgress < 70) {
          setLoadingMessage("Đang xử lý ảnh...");
        } else {
          setLoadingMessage("Đang phân tích...");
        }
      }, 300);

      let response: Response;
      let endpoint: string;
      const fetchOptions: RequestInit = { method: "POST" };

      if (!API_BASE_URL) {
        console.log("Check key:", API_BASE_URL);
      }

      if (inputMethod === "file" && selectedFile) {
        setLoadingMessage("Đang gửi yêu cầu xử lý file...");
        endpoint = `${API_BASE_URL}/process-image`;
        const formData = new FormData();
        formData.append("file", selectedFile);
        fetchOptions.body = formData;
      } else if (inputMethod === "url" && imageUrl) {
        setLoadingMessage("Đang gửi yêu cầu xử lý URL...");
        endpoint = `${API_BASE_URL}/process-image-url`;
        fetchOptions.headers = { "Content-Type": "application/json" };
        fetchOptions.body = JSON.stringify({ url: imageUrl });
      } else {
        throw new Error("Input không hợp lệ.");
      }

      response = await fetch(endpoint, fetchOptions);

      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(98);
      setLoadingMessage("Đang nhận kết quả...");

      const data: ProcessImageResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || `Lỗi API: ${response.status} ${response.statusText}`
        );
      }

      setLoadingProgress(100);
      setLoadingMessage("Hoàn tất!");
      setResult({
        ...data,
        error: data.error === undefined ? null : data.error,
      });
      setSelectedDetection("main");

      if (data.error) {
        setError(data.error);
      }

      if (!data.detections || data.detections.length === 0) {
        if (!data.error) {
          setError("Không phát hiện được biển số nào trong ảnh.");
        }
      }
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Processing Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định khi xử lý ảnh.";
      setError(errorMessage);
      setLoadingProgress(0);
      setResult(null);
    } finally {
      setLoading(false);
      setLoadingMessage("");
      if (progressInterval) clearInterval(progressInterval);
    }
  };

  useEffect(() => {
    let currentPreviewUrl = previewUrl;
    return () => {
      if (currentPreviewUrl && currentPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreviewUrl);
        console.log("Revoked blob URL:", currentPreviewUrl);
      }
    };
  }, [previewUrl]);

  const shouldShowResultCard = Boolean(
    result?.detections && result.detections.length > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="overflow-hidden border-2 border-muted/30 md:flex-1">
          <CardHeader className="bg-muted/20">
            <CardTitle className="text-xl">Nhận dạng biển số xe</CardTitle>
            <CardDescription>
              Tải lên hình ảnh hoặc nhập URL để nhận dạng và phân tích biển số xe
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs
              value={inputMethod}
              onValueChange={(value) => setInputMethod(value as "file" | "url")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="file">Tải lên ảnh</TabsTrigger>
                <TabsTrigger value="url">URL ảnh</TabsTrigger>
              </TabsList>

              <TabsContent value="file">
                <FileUploadTab
                  previewUrl={previewUrl}
                  loading={loading}
                  loadingMessage={loadingMessage}
                  loadingProgress={loadingProgress}
                  error={error}
                  result={result}
                  handleFileChange={handleFileChange}
                  handleUpload={handleUpload}
                />
              </TabsContent>

              <TabsContent value="url">
                <UrlInputTab
                  imageUrl={imageUrl}
                  loading={loading}
                  loadingMessage={loadingMessage}
                  loadingProgress={loadingProgress}
                  error={error}
                  result={result}
                  setImageUrl={setImageUrl}
                  setResult={setResult}
                  setError={setError}
                  handleUpload={handleUpload}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <QuickExamples baseUrl={baseUrl} onExampleClick={handleExampleClick} />
      </div>

      {/* --- Result Section --- */}
      {shouldShowResultCard && (
        <React.Fragment>
          {result && (
            <Card className="border-2 border-muted/30">
              <CardHeader className="bg-muted/20">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    Kết quả nhận dạng
                    {result.detections.length > 1 && (
                      <Badge variant="secondary" className="ml-2">
                        {result.detections.length} biển số
                      </Badge>
                    )}
                  </div>
                  {result.processing_time_ms && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {`Time: ${result.processing_time_ms.toFixed(0)} ms`}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.detections.length > 1 && (
                    <div className="md:col-span-1">
                      <DetectionList
                        detections={result.detections}
                        selectedDetection={selectedDetection ?? "main"}
                        setSelectedDetection={setSelectedDetection}
                      />
                    </div>
                  )}
                  <div
                    className={
                      result.detections.length > 1
                        ? "md:col-span-2"
                        : "md:col-span-3"
                    }
                  >
                    <DetectionDetails
                      detection={currentDetection}
                      processedImageUrl={result.processed_image_url}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
