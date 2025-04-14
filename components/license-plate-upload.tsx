"use client";
import { useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import {
  useLicensePlateStore,
  translateColor,
} from "@/lib/store/license-plate-store";
import {
  processLicensePlateImage,
  processLicensePlateFromUrl,
} from "@/app/(main)/actions";

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

type ResultPreviewProps = {
  processedImageUrl: string | null | undefined;
  error: string | null;
};

type DetectionListProps = {
  detections: any[];
  selectedDetection: string;
  setSelectedDetection: (detection: string) => void;
};

type DetectionDetailsProps = {
  detection: any | null;
  processedImageUrl: string | null | undefined;
};

const FileUploadTab = ({
  previewUrl,
  loading,
  loadingMessage,
  loadingProgress,
  error,
  result,
  handleFileChange,
  handleUpload,
}: FileUploadTabProps) => (
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
      {loading && (
        <div className="mt-2">
          <Progress value={loadingProgress} className="h-2" />
        </div>
      )}
    </div>

    <ResultPreview
      processedImageUrl={result?.processed_image_url ?? undefined}
      error={error}
    />
  </div>
);

const UrlInputTab = ({
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
}: UrlInputTabProps) => (
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
      {loading && (
        <div className="mt-2">
          <Progress value={loadingProgress} className="h-2" />
        </div>
      )}
    </div>

    <ResultPreview
      processedImageUrl={result?.processed_image_url ?? undefined}
      error={error}
    />
  </div>
);

const ResultPreview = ({ processedImageUrl, error }: ResultPreviewProps) => {
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
};

const DetectionList = ({
  detections,
  selectedDetection,
  setSelectedDetection,
}: DetectionListProps) => (
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

const DetectionDetails = ({
  detection,
  processedImageUrl,
}: DetectionDetailsProps) => {
  if (!detection) return null;

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
            <Progress
              value={detection.confidence_percent}
              className="h-2 flex-1"
            />
            <span className="text-sm font-medium">
              {detection.confidence_percent.toFixed(1)}%
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
};

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
    setLoadingMessage("Đang kết nối đến server...");
    setLoadingProgress(10);
    setError(null);

    try {
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

      const data =
        inputMethod === "file"
          ? await processLicensePlateImage(selectedFile!)
          : await processLicensePlateFromUrl(imageUrl);

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("Hoàn tất!");
      setResult(data);
      setSelectedDetection("main");

      if (data.error) {
        toast.warning(`Thông báo: ${data.error}`);
      } else {
        toast.success("Biển số xe đã được xử lý và lưu tự động.");
      }
    } catch (err) {
      console.error("Processing Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định khi xử lý ảnh.";
      setError(errorMessage);
      toast.error(errorMessage);
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.detections.length > 1 && (
                <DetectionList
                  detections={result.detections}
                  selectedDetection={selectedDetection}
                  setSelectedDetection={setSelectedDetection}
                />
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
