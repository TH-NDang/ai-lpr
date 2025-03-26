import { LicensePlateUpload } from "@/components/license-plate-upload";

export default function LicensePlatePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Nhận Dạng Biển Số Xe</h1>
          <p className="text-muted-foreground mt-2">
            Tải lên hình ảnh biển số xe để nhận dạng và phân tích thông tin chi
            tiết
          </p>
        </div>
        <LicensePlateUpload />
      </div>
    </div>
  );
}
