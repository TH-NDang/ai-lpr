"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Info,
} from "lucide-react";
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
  ocr_engine_used: string | null;
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
  ocr_engine_used: string | null;
  detections: Detection[];
  processed_image_url: string | null;
  error: string | null;
}

export function LicensePlateUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Đang xử lý...");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<string>("main");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<"file" | "url">("file");

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
    setLoadingMessage("Đang kết nối đến server...");
    setLoadingProgress(10);
    setError(null);

    try {
      let response;

      // Loading progress simulation
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });

        if (loadingProgress > 30 && loadingProgress < 60) {
          setLoadingMessage("Đang xử lý hình ảnh...");
        } else if (loadingProgress >= 60) {
          setLoadingMessage("Đang phân tích biển số...");
        }
      }, 500);

      if (inputMethod === "file") {
        const formData = new FormData();
        formData.append("file", selectedFile!);

        // Thêm timeout và xử lý CORS
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/process-image`,
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
            mode: "cors",
          }
        ).finally(() => clearTimeout(timeoutId));
      } else {
        // Xử lý URL
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/process-image-url`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: imageUrl }),
            signal: controller.signal,
            mode: "cors",
          }
        ).finally(() => clearTimeout(timeoutId));
      }

      if (!response.ok) {
        throw new Error(`Lỗi: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("Hoàn tất!");
      setResult(data);
      setSelectedDetection("main"); // Reset to main detection on new result

      if (data.error) {
        toast.warning(data.error);
      } else {
        toast.success("Biển số xe đã được xử lý thành công");
      }
    } catch (err) {
      console.error("API Error:", err);

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Yêu cầu bị hủy do quá thời gian chờ. Vui lòng thử lại sau.");
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("Network Error")
        ) {
          setError(
            "Không thể kết nối đến server API. Vui lòng kiểm tra kết nối mạng hoặc xác nhận rằng server đang hoạt động."
          );
        } else {
          setError(`Lỗi: ${err.message}`);
        }
      } else {
        setError("Lỗi không xác định khi gửi yêu cầu đến server");
      }

      toast.error("Không thể xử lý hình ảnh. Vui lòng thử lại sau.");
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
      const index = Number.parseInt(selectedDetection, 10);
      detection = result.detections[index] || result.detections[0];
    }

    // Trả về đối tượng với các thuộc tính cần thiết
    return {
      plate_number: detection.plate_number,
      confidence_detection: detection.confidence_detection * 100,
      plate_analysis: detection.plate_analysis,
      ocr_engine_used: detection.ocr_engine_used,
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
      {/* Phần Upload ảnh */}
      <Card className="overflow-hidden border-2 border-muted/30">
        <CardHeader className="bg-muted/20">
          <CardTitle className="text-xl">Nhận dạng biển số xe</CardTitle>
          <CardDescription>
            Tải lên hình ảnh để nhận dạng và phân tích biển số xe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="file"
            value={inputMethod}
            onValueChange={(value) => setInputMethod(value as "file" | "url")}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="file">Tải lên ảnh</TabsTrigger>
              <TabsTrigger value="url">URL ảnh</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
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
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingMessage}
                      </>
                    ) : (
                      "Nhận dạng biển số"
                    )}
                  </Button>
                  {loading && (
                    <div className="mt-2">
                      <Progress value={loadingProgress} className="h-2" />
                    </div>
                  )}
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
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Nhập URL ảnh biển số</Label>
                    <div className="relative">
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setResult(null);
                          setError(null);
                        }}
                        className="pl-10"
                      />
                      <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <LinkIcon size={16} />
                      </div>
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="relative border-2 border-dashed rounded-lg transition-colors flex items-center justify-center min-h-[160px] border-primary/30 bg-primary/5">
                      <div className="w-full h-full p-2">
                        <img
                          src={imageUrl}
                          alt="Preview from URL"
                          className="mx-auto max-h-[240px] object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            setError(
                              "Không thể tải ảnh từ URL này. Vui lòng kiểm tra lại URL."
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleUpload}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingMessage}
                      </>
                    ) : (
                      "Nhận dạng biển số"
                    )}
                  </Button>
                  {loading && (
                    <div className="mt-2">
                      <Progress value={loadingProgress} className="h-2" />
                    </div>
                  )}
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
                      <LinkIcon className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                      <p>Nhập URL ảnh biển số để nhận dạng</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ví dụ: https://example.com/car.jpg
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Phần hiển thị kết quả */}
      {result?.detections && result.detections.length > 0 && (
        <Card className="border-2 border-muted/30">
          <CardHeader className="bg-muted/20">
            <CardTitle className="text-xl flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Kết quả nhận dạng
              {result.detections.length > 1 && (
                <Badge variant="secondary" className="ml-2">
                  {result.detections.length} biển số
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Danh sách biển số (hiển thị nếu có nhiều biển số) */}
              {result.detections.length > 1 && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Danh sách biển số
                  </Label>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {result.detections.map((detection, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md cursor-pointer transition-all ${
                          selectedDetection ===
                          (index === 0 ? "main" : index.toString())
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setSelectedDetection(
                            index === 0 ? "main" : index.toString()
                          )
                        }
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {detection.plate_number}
                          </span>
                          <Badge
                            variant={
                              selectedDetection ===
                              (index === 0 ? "main" : index.toString())
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
              )}

              {/* Chi tiết biển số đang chọn */}
              <div
                className={
                  result.detections.length > 1
                    ? "md:col-span-2"
                    : "md:col-span-3"
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hình ảnh */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">
                      Hình ảnh đã xử lý
                    </Label>
                    {result.processed_image_url && (
                      <div className="rounded-lg overflow-hidden border border-muted">
                        <img
                          src={result.processed_image_url}
                          alt="Ảnh đã xử lý"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Thông tin biển số */}
                  {currentDetection && (
                    <div>
                      <Label className="text-base font-medium mb-2 block">
                        Thông tin biển số
                      </Label>

                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className="px-3 py-1.5 text-xl font-bold">
                            {currentDetection.plate_number}
                          </Badge>
                          {currentDetection.ocr_engine_used && (
                            <Badge variant="outline" className="text-xs">
                              OCR: {currentDetection.ocr_engine_used}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            Độ tin cậy:
                          </span>
                          <Progress
                            value={currentDetection.confidence_detection}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm font-medium">
                            {currentDetection.confidence_detection.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {currentDetection.plate_analysis && (
                        <div className="space-y-3 border rounded-md p-3 bg-muted/10">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                Tỉnh/TP
                              </span>
                              <span className="font-medium">
                                {currentDetection.plate_analysis.province_name ||
                                  "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                Mã tỉnh
                              </span>
                              <span className="font-medium">
                                {currentDetection.plate_analysis.province_code ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                Loại biển
                              </span>
                              <span className="font-medium">
                                {currentDetection.plate_analysis.plate_type_info
                                  ?.name || "Không xác định"}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                Màu biển
                              </span>
                              <span className="font-medium">
                                {translateColor(
                                  currentDetection.plate_analysis.detected_color
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <span className="text-xs text-muted-foreground mr-2">
                              Định dạng hợp lệ:
                            </span>
                            {currentDetection.plate_analysis.is_valid_format ? (
                              <Badge
                                variant="default"
                                className="flex items-center gap-1 bg-green-500 text-white"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Hợp lệ
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" /> Không hợp lệ
                              </Badge>
                            )}
                          </div>

                          {currentDetection.plate_analysis
                            .format_description && (
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                Mô tả:
                              </span>
                              <span className="text-sm">
                                {
                                  currentDetection.plate_analysis
                                    .format_description
                                }
                              </span>
                            </div>
                          )}

                          <details className="text-sm">
                            <summary className="cursor-pointer text-primary font-medium flex items-center">
                              <Info className="h-3 w-3 mr-1" /> Thông tin chi
                              tiết
                            </summary>
                            <div className="mt-2 pl-2 border-l-2 border-muted space-y-1">
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Biển số gốc:
                                </span>
                                <span className="ml-1 font-mono">
                                  {currentDetection.plate_analysis.original}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Biển số chuẩn hóa:
                                </span>
                                <span className="ml-1 font-mono">
                                  {currentDetection.plate_analysis.normalized}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Seri:
                                </span>
                                <span className="ml-1">
                                  {currentDetection.plate_analysis.serial ||
                                    "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Số đăng ký:
                                </span>
                                <span className="ml-1">
                                  {currentDetection.plate_analysis.number ||
                                    "N/A"}
                                </span>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
