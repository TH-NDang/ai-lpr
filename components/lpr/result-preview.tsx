"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

type ResultPreviewProps = {
  processedImageUrl: string | null | undefined;
  error: string | null;
};

export function ResultPreview({ processedImageUrl, error }: ResultPreviewProps) {
  if (processedImageUrl) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Kết quả nhận dạng</Label>
          <div className="mt-2 rounded-lg overflow-hidden border-2 border-primary/30 bg-primary/5">
            <img
              src={processedImageUrl}
              alt="Kết quả nhận dạng"
              className="w-full object-contain max-h-[300px]"
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-6 text-muted-foreground">
        <img
          src="/placeholder-license-plate.svg"
          alt="License plate placeholder"
          className="w-32 h-32 mx-auto mb-4 opacity-20"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <p>Vui lòng tải lên ảnh biển số để nhận dạng</p>
      </div>
    </div>
  );
} 