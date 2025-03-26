"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface PlateAnalysis {
  original: string;
  normalized: string;
  province_code: string | null;
  province_name: string | null;
  serial: string | null;
  number: string | null;
  plate_type: string;
  plate_type_info: {
    name: string;
    description: string;
  } | null;
  detected_color: string | null;
  is_valid_format: boolean;
  format_description: string | null;
}

interface Detection {
  plate_number: string;
  confidence_detection: number;
  bounding_box: [number, number, number, number];
  plate_analysis: PlateAnalysis | null;
}

interface ApiResponse {
  detections: Detection[];
  processed_image_url: string | null;
  error: string | null;
}

// Tạo kiểu dữ liệu mới cho kết quả xử lý
interface ProcessedDetection {
  plate_number: string;
  confidence_detection: number;
  plate_analysis: PlateAnalysis | null;
  detections: Detection[];
  processed_image_url: string | null;
  error: string | null;
}

export function LicensePlateUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<string>("main");

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
    if (!selectedFile) {
      setError("Vui lòng chọn file ảnh trước khi nhận dạng");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Địa chỉ API có thể thay đổi tùy theo cấu hình của bạn
      const response = await fetch("http://localhost:5000/process-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Lỗi: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setResult(data);
      setSelectedDetection("main"); // Reset to main detection on new result

      if (data.error) {
        toast.warning(data.error);
      } else {
        toast.success("Biển số xe đã được xử lý thành công");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi gửi yêu cầu đến server"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get current detection to display based on selection
  const getCurrentDetection = (): ProcessedDetection | null => {
    if (!result || !result.detections || result.detections.length === 0) {
      return null;
    }

    let detection: Detection;

    if (selectedDetection === "main") {
      // Lấy detection đầu tiên nếu là main
      detection = result.detections[0];
    } else {
      // Lấy detection theo index
      const index = parseInt(selectedDetection, 10);
      detection = result.detections[index] || result.detections[0];
    }

    // Trả về đối tượng với các thuộc tính cần thiết
    return {
      plate_number: detection.plate_number,
      confidence_detection: detection.confidence_detection * 100,
      plate_analysis: detection.plate_analysis,
      detections: result.detections,
      processed_image_url: result.processed_image_url,
      error: result.error,
    };
  };

  const currentDetection = getCurrentDetection();

  const translateColor = (color: string | null): string => {
    if (!color) return "Không xác định";

    switch (color) {
      case "white":
        return "Trắng";
      case "yellow":
        return "Vàng";
      case "blue":
        return "Xanh dương";
      case "red":
        return "Đỏ";
      default:
        return "Không xác định";
    }
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-2 border-muted/30">
        <CardHeader className="bg-muted/20">
          <CardTitle className="text-xl">Tải lên ảnh biển số</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
              <Button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Nhận dạng biển số"
                )}
              </Button>
            </div>

            {result?.processed_image_url ? (
              <div className="space-y-4">
                <div>
                  <Label>Kết quả nhận dạng</Label>
                  <div className="mt-2 rounded-lg overflow-hidden border-2 border-primary/30 bg-primary/5">
                    <img
                      src={result.processed_image_url}
                      alt="Kết quả nhận dạng"
                      className="w-full object-contain max-h-[300px]"
                    />
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : (
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
            )}
          </div>
        </CardContent>
      </Card>

      {result?.detections && result.detections.length > 0 && (
        <Card className="border-2 border-muted/30">
          <CardHeader className="bg-muted/20">
            <CardTitle className="text-xl flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Kết quả phân tích biển số
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Tabs */}
              <Tabs defaultValue="plates" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="plates">Biển số</TabsTrigger>
                  <TabsTrigger value="details">Chi tiết</TabsTrigger>
                  <TabsTrigger value="analysis">Phân tích</TabsTrigger>
                </TabsList>

                {/* Danh sách biển số */}
                <TabsContent value="plates" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.detections.map((detection, index) => (
                      <Card
                        key={index}
                        className={`overflow-hidden cursor-pointer transition-all ${
                          selectedDetection ===
                          (index === 0 ? "main" : index.toString())
                            ? "border-2 border-primary shadow-sm"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() =>
                          setSelectedDetection(
                            index === 0 ? "main" : index.toString()
                          )
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold tracking-wider">
                                {detection.plate_number}
                              </p>
                              <div className="flex items-center mt-1 space-x-2">
                                <Badge variant="outline">
                                  {(
                                    detection.confidence_detection * 100
                                  ).toFixed(1)}
                                  %
                                </Badge>
                                {detection.plate_analysis?.plate_type && (
                                  <Badge className="bg-primary/20 text-primary border-primary/20">
                                    {detection.plate_analysis.plate_type_info
                                      ?.name || "Không xác định"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Chi tiết biển số */}
                <TabsContent value="details" className="space-y-4">
                  {currentDetection && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">
                          {currentDetection.plate_number}
                        </h3>
                        <Badge variant="outline" className="text-sm">
                          Độ tin cậy:{" "}
                          {currentDetection.confidence_detection.toFixed(1)}%
                        </Badge>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">
                              Thông tin biển số
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Biển số gốc
                                </p>
                                <p className="font-mono font-medium">
                                  {currentDetection.plate_analysis?.original ||
                                    "N/A"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Biển số chuẩn hóa
                                </p>
                                <p className="font-mono font-medium">
                                  {currentDetection.plate_analysis?.normalized ||
                                    "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {currentDetection.plate_analysis?.province_code && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                Thông tin địa phương
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Mã tỉnh/TP
                                  </p>
                                  <p className="font-medium">
                                    {
                                      currentDetection.plate_analysis
                                        .province_code
                                    }
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Tỉnh/Thành phố
                                  </p>
                                  <p className="font-medium">
                                    {currentDetection.plate_analysis
                                      .province_name || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">
                              Đánh giá
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Độ tin cậy</span>
                                  <span>
                                    {currentDetection.confidence_detection.toFixed(
                                      1
                                    )}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  value={currentDetection.confidence_detection}
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>

                          {currentDetection.plate_analysis && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                Phân loại
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Loại biển số
                                  </p>
                                  <Badge className="bg-primary/20 text-primary border-primary/20">
                                    {currentDetection.plate_analysis
                                      .plate_type_info?.name || "Không xác định"}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Định dạng
                                  </p>
                                  <p className="font-medium">
                                    {currentDetection.plate_analysis
                                      .format_description || "Không xác định"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Phân tích kỹ thuật */}
                <TabsContent value="analysis" className="space-y-4">
                  {currentDetection && (
                    <div className="space-y-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">
                              Thuộc tính
                            </TableHead>
                            <TableHead>Giá trị</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              Biển số
                            </TableCell>
                            <TableCell>
                              {currentDetection.plate_number}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Biển số gốc
                            </TableCell>
                            <TableCell>
                              {currentDetection.plate_analysis?.original ||
                                "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Biển số chuẩn hóa
                            </TableCell>
                            <TableCell>
                              {currentDetection.plate_analysis?.normalized ||
                                "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Độ tin cậy
                            </TableCell>
                            <TableCell>
                              {currentDetection.confidence_detection.toFixed(4)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Bounding Box
                            </TableCell>
                            <TableCell>
                              {currentDetection.detections
                                .find(
                                  (d) =>
                                    d.plate_number ===
                                    currentDetection.plate_number
                                )
                                ?.bounding_box.join(", ") || "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Mã tỉnh/TP
                            </TableCell>
                            <TableCell>
                              {currentDetection.plate_analysis?.province_code ||
                                "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Tỉnh/TP
                            </TableCell>
                            <TableCell>
                              {currentDetection.plate_analysis?.province_name ||
                                "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Loại biển số
                            </TableCell>
                            <TableCell>
                              {currentDetection.plate_analysis?.plate_type_info
                                ?.name || "N/A"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
