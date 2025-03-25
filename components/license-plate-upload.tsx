"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface LicensePlateRecord {
  id: number;
  plateNumber: string;
  confidence: number;
  imageUrl: string;
  processedImageUrl: string;
  createdAt: string;
}

export function LicensePlateUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LicensePlateRecord | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/license-plate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      setResult(data);
      toast.success("License plate processed successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Upload Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {preview && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <img src={preview} alt="Preview" className="object-cover" />
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Process Image"}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Results</h3>
          <div className="space-y-4">
            <div>
              <Label>License Plate Number</Label>
              <p className="text-2xl font-bold">{result.plateNumber}</p>
            </div>
            <div>
              <Label>Confidence</Label>
              <Progress value={result.confidence} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {result.confidence}%
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Original Image</Label>
                <img
                  src={result.imageUrl}
                  alt="Original"
                  className="mt-2 rounded-lg"
                />
              </div>
              {result.processedImageUrl && (
                <div>
                  <Label>Processed Image</Label>
                  <img
                    src={result.processedImageUrl}
                    alt="Processed"
                    className="mt-2 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
