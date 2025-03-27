'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Minus } from 'lucide-react'
import type { ColumnSchema } from '../../lib/table/schema'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { TextWithTooltip } from '@/components/data-table/custom/text-with-tooltip'
import { HoverCardTimestamp } from './hover-card-timestamp'
import { cn } from '@/lib/utils'
import { getLevelColor } from '@/lib/request/level'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { textContains } from '@/lib/table/filterfns'
import Image from 'next/image'

export const columns: ColumnDef<ColumnSchema>[] = [
  {
    accessorKey: 'level',
    header: '',
    cell: ({ row }) => {
      const value = row.getValue('level') as 'success' | 'warning' | 'error'
      return (
        <div className="flex items-center justify-center">
          <div
            className={cn('h-2.5 w-2.5 rounded-[2px]', getLevelColor(value).bg)}
          />
        </div>
      )
    },
    enableHiding: false,
    enableResizing: false,
    enableSorting: false,
    filterFn: 'equals',
    size: 27,
    minSize: 27,
    maxSize: 27,
    meta: {
      headerClassName:
        'w-[--header-level-size] max-w-[--header-level-size] min-w-[--header-level-size]',
      cellClassName:
        'w-[--col-level-size] max-w-[--col-level-size] min-w-[--col-level-size]',
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thời gian" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'))
      return <HoverCardTimestamp date={date} />
    },
    filterFn: (row, columnId, filterValue) => {
      const date = row.getValue(columnId) as Date
      const [start, end] = filterValue
      if (start && end) {
        return date >= start && date <= end
      }
      return true
    },
    enableResizing: false,
    size: 180,
    minSize: 180,
    meta: {
      headerClassName:
        'w-[--header-date-size] max-w-[--header-date-size] min-w-[--header-date-size]',
      cellClassName:
        'font-mono w-[--col-date-size] max-w-[--col-date-size] min-w-[--col-date-size]',
    },
  },
  {
    accessorKey: 'plateNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Biển số" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('plateNumber') as string
      return <div className="font-semibold">{value}</div>
    },
    filterFn: textContains,
    size: 130,
    minSize: 130,
    meta: {
      label: 'Biển số',
      cellClassName:
        'font-mono w-[--col-plate-size] max-w-[--col-plate-size] min-w-[--col-plate-size]',
      headerClassName:
        'min-w-[--header-plate-size] w-[--header-plate-size] max-w-[--header-plate-size]',
    },
  },
  {
    accessorKey: 'confidence',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Độ tin cậy" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('confidence') as number
      let colorClass = 'text-green-600'
      if (value < 75) colorClass = 'text-red-600'
      else if (value < 90) colorClass = 'text-yellow-600'

      return <div className={`font-semibold ${colorClass}`}>{value}%</div>
    },
    filterFn: 'inNumberRange',
    size: 110,
    minSize: 110,
    meta: {
      headerClassName:
        'w-[--header-confidence-size] max-w-[--header-confidence-size] min-w-[--header-confidence-size]',
      cellClassName:
        'font-mono w-[--col-confidence-size] max-w-[--col-confidence-size] min-w-[--col-confidence-size]',
    },
  },
  {
    accessorKey: 'provinceCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã tỉnh" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('provinceCode') as string
      return <div className="font-mono">{value || '-'}</div>
    },
    enableSorting: false,
    filterFn: textContains,
    size: 80,
    minSize: 80,
    meta: {
      headerClassName:
        'w-[--header-province-code-size] max-w-[--header-province-code-size] min-w-[--header-province-code-size]',
      cellClassName:
        'font-mono w-[--col-province-code-size] max-w-[--col-province-code-size] min-w-[--col-province-code-size]',
    },
  },
  {
    accessorKey: 'provinceName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tỉnh/Thành phố" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('provinceName') as string
      return <div>{value || '-'}</div>
    },
    enableSorting: false,
    filterFn: textContains,
    size: 150,
    minSize: 150,
    meta: {
      headerClassName:
        'w-[--header-province-name-size] max-w-[--header-province-name-size] min-w-[--header-province-name-size]',
      cellClassName:
        'w-[--col-province-name-size] max-w-[--col-province-name-size] min-w-[--col-province-name-size]',
    },
  },
  {
    accessorKey: 'vehicleType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loại xe" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('vehicleType') as string
      return <div>{value || '-'}</div>
    },
    enableSorting: false,
    filterFn: textContains,
    size: 120,
    minSize: 120,
    meta: {
      headerClassName:
        'w-[--header-vehicle-type-size] max-w-[--header-vehicle-type-size] min-w-[--header-vehicle-type-size]',
      cellClassName:
        'w-[--col-vehicle-type-size] max-w-[--col-vehicle-type-size] min-w-[--col-vehicle-type-size]',
    },
  },
  {
    accessorKey: 'plateType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kiểu biển" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('plateType') as string
      let badgeVariant = 'default'

      if (value?.includes('trắng')) badgeVariant = 'outline'
      else if (value?.includes('vàng')) badgeVariant = 'warning'
      else if (value?.includes('xanh')) badgeVariant = 'info'
      else if (value?.includes('đỏ')) badgeVariant = 'destructive'

      return value ? (
        <Badge variant={badgeVariant as any}>{value}</Badge>
      ) : (
        <div>-</div>
      )
    },
    enableSorting: false,
    filterFn: textContains,
    size: 130,
    minSize: 130,
    meta: {
      headerClassName:
        'w-[--header-plate-type-size] max-w-[--header-plate-type-size] min-w-[--header-plate-type-size]',
      cellClassName:
        'w-[--col-plate-type-size] max-w-[--col-plate-type-size] min-w-[--col-plate-type-size]',
    },
  },
  {
    accessorKey: 'plateFormat',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Định dạng" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('plateFormat') as string
      return <div>{value || '-'}</div>
    },
    enableSorting: false,
    filterFn: textContains,
    size: 100,
    minSize: 100,
    meta: {
      headerClassName:
        'w-[--header-plate-format-size] max-w-[--header-plate-format-size] min-w-[--header-plate-format-size]',
      cellClassName:
        'w-[--col-plate-format-size] max-w-[--col-plate-format-size] min-w-[--col-plate-format-size]',
    },
  },
  {
    accessorKey: 'imageSource',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nguồn ảnh" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('imageSource') as string
      return <div>{value || '-'}</div>
    },
    enableSorting: false,
    filterFn: textContains,
    size: 130,
    minSize: 130,
    meta: {
      headerClassName:
        'w-[--header-image-source-size] max-w-[--header-image-source-size] min-w-[--header-image-source-size]',
      cellClassName:
        'w-[--col-image-source-size] max-w-[--col-image-source-size] min-w-[--col-image-source-size]',
    },
  },
  {
    accessorKey: 'processingTime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thời gian xử lý" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('processingTime') as number

      // Color based on processing time (lower is better)
      let colorClass = 'text-green-600'
      if (value > 1000) colorClass = 'text-red-600'
      else if (value > 500) colorClass = 'text-yellow-600'

      return <div className={`font-mono ${colorClass}`}>{value}ms</div>
    },
    filterFn: 'inNumberRange',
    size: 140,
    minSize: 140,
    meta: {
      headerClassName:
        'w-[--header-processing-time-size] max-w-[--header-processing-time-size] min-w-[--header-processing-time-size]',
      cellClassName:
        'w-[--col-processing-time-size] max-w-[--col-processing-time-size] min-w-[--col-processing-time-size]',
    },
  },
  {
    accessorKey: 'imageUrl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ảnh gốc" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('imageUrl') as string
      if (!value) return <Minus className="h-4 w-4 text-muted-foreground/50" />

      return (
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer underline text-blue-600">
              Xem ảnh
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 h-fit">
            {value && (
              <div className="flex flex-col gap-2">
                <Image
                  src={value}
                  alt="Ảnh biển số gốc"
                  className="w-full h-auto rounded-md"
                />
                <span className="text-xs text-muted-foreground text-center">
                  Ảnh biển số gốc
                </span>
              </div>
            )}
          </HoverCardContent>
        </HoverCard>
      )
    },
    enableSorting: false,
    size: 100,
    minSize: 100,
    meta: {
      headerClassName:
        'w-[--header-image-url-size] max-w-[--header-image-url-size] min-w-[--header-image-url-size]',
      cellClassName:
        'w-[--col-image-url-size] max-w-[--col-image-url-size] min-w-[--col-image-url-size]',
    },
  },
  {
    accessorKey: 'processedImageUrl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ảnh đã xử lý" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('processedImageUrl') as string
      if (!value) return <Minus className="h-4 w-4 text-muted-foreground/50" />

      return (
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer underline text-blue-600">
              Xem ảnh
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 h-fit">
            {value && (
              <div className="flex flex-col gap-2">
                <Image
                  src={value}
                  alt="Ảnh biển số đã xử lý"
                  className="w-full h-auto rounded-md"
                />
                <span className="text-xs text-muted-foreground text-center">
                  Ảnh biển số đã xử lý
                </span>
              </div>
            )}
          </HoverCardContent>
        </HoverCard>
      )
    },
    enableSorting: false,
    size: 130,
    minSize: 130,
    meta: {
      headerClassName:
        'w-[--header-processed-image-url-size] max-w-[--header-processed-image-url-size] min-w-[--header-processed-image-url-size]',
      cellClassName:
        'w-[--col-processed-image-url-size] max-w-[--col-processed-image-url-size] min-w-[--col-processed-image-url-size]',
    },
  },
  {
    id: 'uuid',
    accessorKey: 'uuid',
    header: 'ID',
    cell: ({ row }) => {
      const value = row.getValue('uuid') as string
      return <TextWithTooltip text={value} />
    },
    enableSorting: false,
    size: 130,
    minSize: 130,
    meta: {
      label: 'ID',
      cellClassName:
        'font-mono w-[--col-uuid-size] max-w-[--col-uuid-size] min-w-[--col-uuid-size]',
      headerClassName:
        'min-w-[--header-uuid-size] w-[--header-uuid-size] max-w-[--header-uuid-size]',
    },
  },
]
