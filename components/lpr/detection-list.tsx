"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type DetectionListProps = {
  detections: any[];
  selectedDetection: string;
  setSelectedDetection: (detection: string) => void;
};

export function DetectionList({
  detections,
  selectedDetection,
  setSelectedDetection,
}: DetectionListProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Danh sách biển số</Label>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {detections.map((detection, index) => (
          <div
            key={index}
            className={`p-3 rounded-md cursor-pointer transition-all ${
              selectedDetection === (index === 0 ? "main" : index.toString())
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
            onClick={() =>
              setSelectedDetection(index === 0 ? "main" : index.toString())
            }
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{detection.plate_number}</span>
              <Badge
                variant={
                  selectedDetection === (index === 0 ? "main" : index.toString())
                    ? "outline"
                    : "secondary"
                }
                className="ml-2"
              >
                {(detection.confidence_detection * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
