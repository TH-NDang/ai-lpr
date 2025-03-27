'use client'

import type { ColumnSchema } from '../../lib/table/schema'
import type {
  SheetField,
  FilterField,
  DateFilterOptions,
} from '@/components/data-table/types'
import { LEVELS } from './constants/levels'
import type { LogsMeta } from '../../lib/table/query-options'

export const dateFilterOptions: DateFilterOptions[] = [
  {
    label: 'Hôm nay',
    value: 'today',
  },
  {
    label: 'Hôm qua',
    value: 'yesterday',
  },
  {
    label: '7 ngày qua',
    value: '7days',
  },
  {
    label: '30 ngày qua',
    value: '30days',
  },
  {
    label: 'Tháng này',
    value: 'thisMonth',
  },
  {
    label: 'Tháng trước',
    value: 'lastMonth',
  },
  {
    label: 'Tùy chỉnh',
    value: 'custom',
  },
]

export const filterFields: FilterField[] = [
  {
    id: crypto.randomUUID(),
    label: 'Biển số',
    value: 'plateNumber',
    type: 'input',
    defaultOpen: true,
  },
  {
    id: crypto.randomUUID(),
    label: 'Ngày',
    value: 'date',
    type: 'date',
    defaultOpen: true,
  },
  {
    id: crypto.randomUUID(),
    label: 'Tình trạng',
    value: 'level',
    type: 'multi-select',
    defaultOpen: true,
    options: LEVELS.map((level) => ({
      label:
        level === 'success'
          ? 'Thành công'
          : level === 'warning'
            ? 'Cảnh báo'
            : 'Lỗi',
      value: level,
    })),
  },
  {
    id: crypto.randomUUID(),
    label: 'Độ tin cậy',
    value: 'confidence',
    type: 'slider',
    min: 0,
    max: 100,
    defaultOpen: true,
  },
  {
    id: crypto.randomUUID(),
    label: 'Loại xe',
    value: 'vehicleType',
    type: 'multi-select',
    defaultOpen: true,
    options: [
      { label: 'Xe con', value: 'Xe con' },
      { label: 'Xe tải', value: 'Xe tải' },
      { label: 'Xe khách', value: 'Xe khách' },
      { label: 'Xe máy', value: 'Xe máy' },
      { label: 'Xe buýt', value: 'Xe buýt' },
      { label: 'Xe chuyên dùng', value: 'Xe chuyên dùng' },
      { label: 'Xe cứu thương', value: 'Xe cứu thương' },
      { label: 'Xe cứu hỏa', value: 'Xe cứu hỏa' },
    ],
  },
  {
    id: crypto.randomUUID(),
    label: 'Kiểu biển',
    value: 'plateType',
    type: 'multi-select',
    defaultOpen: true,
    options: [
      { label: 'Biển trắng', value: 'Biển trắng' },
      { label: 'Biển vàng', value: 'Biển vàng' },
      { label: 'Biển xanh', value: 'Biển xanh' },
      { label: 'Biển đỏ', value: 'Biển đỏ' },
      { label: 'Biển ngoại giao', value: 'Biển ngoại giao' },
    ],
  },
  {
    id: crypto.randomUUID(),
    label: 'Mã tỉnh',
    value: 'provinceCode',
    type: 'input',
  },
  {
    id: crypto.randomUUID(),
    label: 'Tỉnh/Thành phố',
    value: 'provinceName',
    type: 'input',
  },
  {
    id: crypto.randomUUID(),
    label: 'Thời gian xử lý',
    value: 'processingTime',
    type: 'slider',
    min: 0,
    max: 2000,
  },
]

export const sheetFields: SheetField<ColumnSchema, LogsMeta>[] = [
  {
    id: 'plateNumber',
    label: 'Biển số xe',
    type: 'readonly',
  },
  {
    id: 'confidence',
    label: 'Độ tin cậy (%)',
    type: 'readonly',
  },
  {
    id: 'provinceCode',
    label: 'Mã tỉnh',
    type: 'readonly',
  },
  {
    id: 'provinceName',
    label: 'Tỉnh/Thành phố',
    type: 'readonly',
  },
  {
    id: 'vehicleType',
    label: 'Loại xe',
    type: 'readonly',
  },
  {
    id: 'plateType',
    label: 'Kiểu biển',
    type: 'readonly',
  },
  {
    id: 'plateFormat',
    label: 'Định dạng biển',
    type: 'readonly',
  },
  {
    id: 'imageSource',
    label: 'Nguồn ảnh',
    type: 'readonly',
  },
  {
    id: 'processingTime',
    label: 'Thời gian xử lý (ms)',
    type: 'readonly',
  },
  {
    id: 'date',
    label: 'Ngày giờ nhận diện',
    type: 'readonly',
  },
]
