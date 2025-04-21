"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { ResultPreview } from "./result-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FileUploadTabProps = {
  previewUrl: string | null;
  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  error: string | null;
  result: any | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
};

export function FileUploadTab({
  previewUrl,
  loading,
  loadingMessage,
  loadingProgress,
  error,
  result,
  handleFileChange,
  handleUpload,
}: FileUploadTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Chọn file ảnh biển số</Label>
          <div className="relative">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <Upload size={16} />
            </div>
          </div>
        </div>
        <div
          onClick={() => document.getElementById("image")?.click()}
          className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer flex items-center justify-center min-h-[160px] ${
            previewUrl
              ? "border-primary/30 bg-primary/5"
              : "border-muted-foreground/30 hover:border-muted-foreground/50 bg-muted/20 hover:bg-muted/30"
          }`}
        >
          {previewUrl ? (
            <div className="w-full h-full p-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-[240px] object-contain rounded"
              />
            </div>
          ) : (
            <div className="text-center p-6">
              <Upload className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Kéo thả ảnh hoặc click để chọn
              </p>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ: JPG, PNG, JPEG
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleUpload} className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingMessage}
            </>
          ) : (
            "Nhận dạng biển số"
          )}
        </Button>
      </div>

      <ResultPreview
        processedImageUrl={result?.processed_image_url ?? undefined}
        error={error}
      />
    </div>
  );
}
