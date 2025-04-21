"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { translateColor } from "@/lib/store/license-plate-store"; // Import helper

type DetectionDetailsProps = {
  detection: any | null; // Consider using a more specific type like ProcessedDetection
  processedImageUrl: string | null | undefined;
};

export function DetectionDetails({
  detection,
  processedImageUrl,
}: DetectionDetailsProps) {
  if (!detection) return null;

  const confidencePercent =
    detection.confidence_percent ?? detection.confidence_detection * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label className="text-base font-medium mb-2 block">
          Hình ảnh đã xử lý
        </Label>
        {processedImageUrl && (
          <div className="rounded-lg overflow-hidden border border-muted">
            <img
              src={processedImageUrl}
              alt="Ảnh đã xử lý"
              className="w-full h-auto object-contain"
            />
          </div>
        )}
      </div>

      <div>
        <Label className="text-base font-medium mb-2 block">
          Thông tin biển số
        </Label>

        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className="px-3 py-1.5 text-xl font-bold">
              {detection.plate_number}
            </Badge>
            {detection.ocr_engine_used && (
              <Badge variant="outline" className="text-xs">
                OCR: {detection.ocr_engine_used}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Độ tin cậy:</span>
            <Progress value={confidencePercent} className="h-2 flex-1" />
            <span className="text-sm font-medium">
              {confidencePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {detection.plate_analysis && (
          <div className="space-y-3 border rounded-md p-3 bg-muted/10">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Tỉnh/TP
                </span>
                <span className="font-medium">
                  {detection.plate_analysis.province_name || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Mã tỉnh
                </span>
                <span className="font-medium">
                  {detection.plate_analysis.province_code || "N/A"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Loại biển
                </span>
                <span className="font-medium">
                  {detection.plate_analysis.plate_type_info?.name ||
                    "Không xác định"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Màu biển
                </span>
                <span className="font-medium">
                  {translateColor(detection.plate_analysis.detected_color)}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">
                Định dạng hợp lệ:
              </span>
              {detection.plate_analysis.is_valid_format ? (
                <Badge
                  variant="default"
                  className="flex items-center gap-1 bg-green-500 text-white"
                >
                  <CheckCircle2 className="h-3 w-3" /> Hợp lệ
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Không hợp lệ
                </Badge>
              )}
            </div>

            {detection.plate_analysis.format_description && (
              <div>
                <span className="text-xs text-muted-foreground block">
                  Mô tả:
                </span>
                <span className="text-sm">
                  {detection.plate_analysis.format_description}
                </span>
              </div>
            )}

            <details className="text-sm">
              <summary className="cursor-pointer text-primary font-medium flex items-center">
                <Info className="h-3 w-3 mr-1" /> Thông tin chi tiết
              </summary>
              <div className="mt-2 pl-2 border-l-2 border-muted space-y-1">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Biển số gốc:
                  </span>
                  <span className="ml-1 font-mono">
                    {detection.plate_analysis.original}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Biển số chuẩn hóa:
                  </span>
                  <span className="ml-1 font-mono">
                    {detection.plate_analysis.normalized}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Seri:</span>
                  <span className="ml-1">
                    {detection.plate_analysis.serial || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Số đăng ký:
                  </span>
                  <span className="ml-1">
                    {detection.plate_analysis.number || "N/A"}
                  </span>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
