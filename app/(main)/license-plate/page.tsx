import type { Metadata } from 'next'
import { LicensePlateUpload } from '@/components/license-plate-upload'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Nhận dạng biển số xe | AI-LPR',
  description: 'Hệ thống nhận dạng biển số xe thông minh sử dụng AI',
}

export default function LicensePlatePage() {
  return (
    <div className="container mx-auto py-8">
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Nhận dạng biển số xe</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <LicensePlateUpload />
          </div>
        </div>
      </div>
    </div>
  )
}
