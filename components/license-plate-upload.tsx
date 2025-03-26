"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlateAnalysis {
  original: string;
  normalized: string;
  province_code: string;
  province_name: string;
  serial: string;
  number: string;
  vehicle_type: string;
  plate_type: string;
  is_valid: boolean;
  format: string;
}

interface LicensePlateRecord {
  id: number;
  plateNumber: string;
  confidence: number;
  imageUrl: string;
  processedImageUrl: string;
  provinceCode?: string;
  provinceName?: string;
  vehicleType?: string;
  plateType?: string;
  plateFormat?: string;
  plateSerial?: string;
  registrationNumber?: string;
  createdAt: string;
  plateAnalysis?: PlateAnalysis;
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
      toast.error("Vui lòng chọn hình ảnh trước");
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
        throw new Error("Không thể xử lý hình ảnh");
      }

      const data = await response.json();
      setResult(data);
      if (data.success === false) {
        toast.warning(data.plateNumber || "Không thể nhận dạng biển số");
      } else {
        toast.success("Biển số xe đã được xử lý thành công");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error("Không thể xử lý hình ảnh");
    } finally {
      setLoading(false);
    }
  };

  // Xác định màu cho loại biển số
  const getPlateTypeColor = (plateType: string) => {
    const types: Record<string, string> = {
      personal: "bg-slate-100 text-slate-800",
      commercial: "bg-yellow-100 text-yellow-800",
      government: "bg-blue-100 text-blue-800",
      military: "bg-red-100 text-red-800",
      police: "bg-blue-100 text-blue-800",
      diplomatic: "bg-purple-100 text-purple-800",
      international: "bg-green-100 text-green-800",
    };
    return types[plateType] || "bg-slate-100 text-slate-800";
  };

  // Xác định tên hiển thị cho loại biển số
  const getPlateTypeName = (plateType: string) => {
    const types: Record<string, string> = {
      personal: "Xe cá nhân",
      commercial: "Xe kinh doanh",
      government: "Xe cơ quan nhà nước",
      military: "Xe quân đội",
      police: "Xe công an",
      diplomatic: "Xe ngoại giao",
      international: "Xe quốc tế",
    };
    return types[plateType] || "Xe cá nhân";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Tải lên hình ảnh</Label>
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
            {loading ? "Đang xử lý..." : "Xử lý hình ảnh"}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div>
                <Label>Biển số xe</Label>
                <p className="text-3xl font-bold">{result.plateNumber}</p>
                {result.plateAnalysis?.plate_type && (
                  <div className="mt-2">
                    <Badge
                      className={getPlateTypeColor(
                        result.plateAnalysis.plate_type
                      )}
                    >
                      {getPlateTypeName(result.plateAnalysis.plate_type)}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label>Độ tin cậy</Label>
                <Progress value={result.confidence} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {result.confidence}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hình ảnh gốc</Label>
                  <img
                    src={result.imageUrl}
                    alt="Original"
                    className="mt-2 rounded-lg w-full"
                  />
                </div>
                {result.processedImageUrl && (
                  <div>
                    <Label>Hình ảnh đã xử lý</Label>
                    <img
                      src={result.processedImageUrl}
                      alt="Processed"
                      className="mt-2 rounded-lg w-full"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="details" className="pt-4">
              {result.plateAnalysis && result.plateAnalysis.is_valid ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Định dạng biển số</Label>
                      <p className="font-medium">
                        {result.plateAnalysis.format}
                      </p>
                    </div>
                    <div>
                      <Label>Loại phương tiện</Label>
                      <p className="font-medium">
                        {result.plateAnalysis.vehicle_type || "Không xác định"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mã tỉnh/thành</Label>
                      <p className="font-medium">
                        {result.plateAnalysis.province_code}
                      </p>
                    </div>
                    <div>
                      <Label>Tỉnh/thành phố</Label>
                      <p className="font-medium">
                        {result.plateAnalysis.province_name}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Seri đăng ký</Label>
                      <p className="font-medium">
                        {result.plateAnalysis.serial}
                      </p>
                    </div>
                    <div>
                      <Label>Số đăng ký</Label>
                      <p className="font-medium">
                        {result.plateAnalysis.number}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Thời gian nhận dạng</Label>
                    <p className="font-medium">
                      {new Date(result.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">
                    {result.plateAnalysis
                      ? "Biển số không đúng định dạng hoặc không thể phân tích"
                      : "Không có thông tin phân tích"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
