"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { ResultPreview } from "./result-preview";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";

type UrlInputTabProps = {
  imageUrl: string;
  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  error: string | null;
  result: any | null;
  setImageUrl: (url: string) => void;
  setResult: (result: any | null) => void;
  setError: (error: string | null) => void;
  handleUpload: () => Promise<void>;
};

export function UrlInputTab({
  imageUrl,
  loading,
  loadingMessage,
  loadingProgress,
  error,
  result,
  setImageUrl,
  setResult,
  setError,
  handleUpload,
}: UrlInputTabProps) {
  const [tempUrl, setTempUrl] = useState(imageUrl);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempUrl(event.target.value);
    setResult(null);
    setError(null);
    setPreviewError(null);
  };

  const loadImagePreview = () => {
    if (!tempUrl) {
      setPreviewError("Vui lòng nhập URL.");
      setImageUrl("");
      return;
    }
    if (!tempUrl.match(/^https?:\/\//)) {
      setPreviewError("URL không hợp lệ.");
      setImageUrl("");
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    const img = new Image();
    img.onload = () => {
      setPreviewLoading(false);
      setImageUrl(tempUrl);
      setError(null);
    };
    img.onerror = () => {
      setPreviewLoading(false);
      setPreviewError("Không thể tải ảnh từ URL này.");
      setImageUrl("");
      setError("Không thể tải ảnh từ URL được cung cấp.");
    };
    img.src = tempUrl;
  };

  useEffect(() => {
    setTempUrl(imageUrl);
  }, [imageUrl]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-grow grid w-full items-center gap-1.5">
          <Label htmlFor="imageUrl">URL Hình ảnh</Label>
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={tempUrl}
            onChange={handleUrlChange}
            onBlur={loadImagePreview}
          />
        </div>
        <Button onClick={loadImagePreview} variant="outline" disabled={previewLoading || !tempUrl}>
          {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />} <span className="ml-2 hidden sm:inline">Tải Ảnh</span>
        </Button>
      </div>

      <div className="mt-4 border rounded-lg p-4 flex justify-center items-center bg-muted/20 min-h-[200px]">
        {loading && loadingProgress < 100 ? (
           <div className="text-center space-y-2">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
              <Progress value={loadingProgress} className="w-full" />
            </div>
        ) : previewLoading ? (
          <div className="text-center space-y-2">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải xem trước...</p>
          </div>
        ) : previewError ? (
          <div className="text-center text-red-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>Lỗi tải ảnh: {previewError}</p>
          </div>
        ) : error && !result ? (
            <div className="text-center text-red-500">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <p>Lỗi xử lý: {error}</p>
            </div>
        ): result?.processed_image_url ? (
            <img
              src={result.processed_image_url}
              alt="Processed preview"
              className="max-w-full max-h-96 rounded-md object-contain"
            />
          )
         : imageUrl ? (
          <img
            src={imageUrl}
            alt="URL preview"
            className="max-w-full max-h-96 rounded-md object-contain"
          />
        ) : (
          <p className="text-muted-foreground">Nhập URL và nhấn "Tải Ảnh" để xem trước</p>
        )}
      </div>

      <Button onClick={handleUpload} disabled={loading || !imageUrl || previewError !== null}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {loading ? loadingMessage : "Nhận dạng biển số"}
      </Button>

      {error && !loading && !previewError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
