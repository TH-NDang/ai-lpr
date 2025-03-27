import type { Metadata } from 'next'
import { LicensePlateUpload } from '@/components/license-plate-upload'

export const metadata: Metadata = {
  title: 'Nhận dạng biển số xe | AI-LPR',
  description: 'Hệ thống nhận dạng biển số xe thông minh sử dụng AI',
}

export default function LicensePlatePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Nhận dạng biển số xe
        </h1>
        <p className="text-muted-foreground mt-2">
          Tải lên hình ảnh để nhận dạng và phân tích biển số xe
        </p>
      </div>

      <LicensePlateUpload />
    </div>
  )
}
