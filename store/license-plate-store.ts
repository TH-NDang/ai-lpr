import { create } from 'zustand'

export interface PlateAnalysis {
  original: string
  normalized: string
  province_code: string | null
  province_name: string | null
  serial: string | null
  number: string | null
  plate_type: string
  plate_type_info: {
    name: string
    description: string
  } | null
  detected_color: string | null
  is_valid_format: boolean
  format_description: string | null
}

export interface Detection {
  plate_number: string
  confidence_detection: number
  bounding_box: [number, number, number, number]
  plate_analysis: PlateAnalysis | null
  ocr_engine_used: string | null
}

export interface ApiResponse {
  detections: Detection[]
  processed_image_url: string | null
  error: string | null
}

export interface ProcessedDetection extends Detection {
  confidence_percent: number
  processed_image_url: string | null
}

interface LicensePlateState {
  // File upload state
  selectedFile: File | null
  previewUrl: string | null
  imageUrl: string
  inputMethod: 'file' | 'url'

  // Loading state
  loading: boolean
  loadingMessage: string
  loadingProgress: number

  // Result state
  result: ApiResponse | null
  error: string | null
  selectedDetection: string

  // Actions
  setSelectedFile: (file: File | null) => void
  setPreviewUrl: (url: string | null) => void
  setImageUrl: (url: string) => void
  setInputMethod: (method: 'file' | 'url') => void
  setLoading: (isLoading: boolean) => void
  setLoadingMessage: (message: string) => void
  setLoadingProgress: (progress: number | ((prev: number) => number)) => void
  setResult: (result: ApiResponse | null) => void
  setError: (error: string | null) => void
  setSelectedDetection: (detection: string) => void
  reset: () => void

  // Computed
  getCurrentDetection: () => ProcessedDetection | null
}

export const useLicensePlateStore = create<LicensePlateState>()((set, get) => ({
  // Initial state
  selectedFile: null,
  previewUrl: null,
  imageUrl: '',
  inputMethod: 'file',
  loading: false,
  loadingMessage: 'Đang xử lý...',
  loadingProgress: 0,
  result: null,
  error: null,
  selectedDetection: 'main',

  // Actions
  setSelectedFile: (file) => set({ selectedFile: file }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setInputMethod: (method) => set({ inputMethod: method }),
  setLoading: (isLoading) => set({ loading: isLoading }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  setLoadingProgress: (progress) =>
    set((state) => ({
      loadingProgress:
        typeof progress === 'function'
          ? progress(state.loadingProgress)
          : progress,
    })),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setSelectedDetection: (detection) => set({ selectedDetection: detection }),
  reset: () =>
    set({
      selectedFile: null,
      previewUrl: null,
      result: null,
      error: null,
      loadingProgress: 0,
      loadingMessage: 'Đang xử lý...',
    }),

  getCurrentDetection: () => {
    const { result, selectedDetection } = get()

    if (!result || !result.detections || result.detections.length === 0) {
      return null
    }

    let detection: Detection

    if (selectedDetection === 'main') {
      // Lấy detection đầu tiên nếu là main
      detection = result.detections[0]
    } else {
      // Lấy detection theo index
      const index = Number.parseInt(selectedDetection, 10)
      detection = result.detections[index] || result.detections[0]
    }

    return {
      ...detection,
      confidence_percent: detection.confidence_detection * 100,
      processed_image_url: result.processed_image_url,
    }
  },
}))

// Helper function to translate color names
export const translateColor = (color: string | null): string => {
  if (!color) return 'Không xác định'

  switch (color) {
    case 'white':
      return 'Trắng'
    case 'yellow':
      return 'Vàng'
    case 'blue':
      return 'Xanh dương'
    case 'red':
      return 'Đỏ'
    default:
      return 'Không xác định'
  }
}
