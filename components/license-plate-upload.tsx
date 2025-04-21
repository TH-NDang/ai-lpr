"use client";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
} from "lucide-react";
import {
  useLicensePlateStore,
} from "@/lib/store/license-plate-store";
import {
  processLicensePlateImage,
  processLicensePlateFromUrl,
} from "@/app/(main)/actions";

import { FileUploadTab } from "./lpr/file-upload-tab";
import { UrlInputTab } from "./lpr/url-input-tab";
import { DetectionList } from "./lpr/detection-list";
import { DetectionDetails } from "./lpr/detection-details";

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
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
    setLoadingMessage(`Đang kết nối...`);
    setLoadingProgress(10);
    setError(null);
    setResult(null);

    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev: number) => {
          const newProgress = prev + Math.random() * 5 + 2;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
        const currentProgress = loadingProgress;
        if (currentProgress < 30) {
          setLoadingMessage(`Đang tải lên...`);
        } else if (currentProgress < 70) {
          setLoadingMessage(`Đang xử lý ảnh...`);
        } else {
          setLoadingMessage(`Đang phân tích...`);
        }
      }, 300);

      let data;
      if (inputMethod === "file") {
        setLoadingMessage("Đang gửi yêu cầu xử lý...");
        data = await processLicensePlateImage(selectedFile!);
      } else {
        setLoadingMessage("Đang gửi yêu cầu URL...");
        data = await processLicensePlateFromUrl(imageUrl);
      }

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("Hoàn tất!");
      setResult(data);
      setSelectedDetection("main");

      if (data.error) {
        setError(data.error);
      }

      if (!data.detections || data.detections.length === 0) {
        setError("Không phát hiện được biển số nào trong ảnh.");
      }
    } catch (err) {
      console.error("Processing Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định khi xử lý ảnh.";
      setError(errorMessage);
      setLoadingProgress(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-2 border-muted/30">
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

      {result?.detections && result.detections.length > 0 && (
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
    </div>
  );
}
