import { create } from "zustand";

export interface BackendPlateAnalysis {
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
    category?: string;
  } | null;
  detected_color: string | null;
  is_valid_format: boolean;
  format_description: string | null;
}

export interface BackendDetection {
  plate_number: string;
  confidence_detection: number;
  bounding_box: [number, number, number, number];
  plate_analysis: BackendPlateAnalysis | null;
  ocr_engine_used: string | null;
}

export interface ApiResponse {
  detections: BackendDetection[];
  processed_image_url: string | null;
  processing_time_ms?: number;
  error: string | null;
}

export interface ProcessedDetection extends BackendDetection {
  confidence_percent: number;
  processed_image_url: string | null;
}

type LicensePlateState = {
  selectedFile: File | null;
  previewUrl: string | null;
  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  result: ApiResponse | null;
  error: string | null;
  selectedDetection: string | null;
  imageUrl: string;
  inputMethod: "file" | "url";
};

type LicensePlateActions = {
  setSelectedFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setLoadingProgress: (progress: number | ((prev: number) => number)) => void;
  setResult: (result: ApiResponse | null) => void;
  setError: (error: string | null) => void;
  setSelectedDetection: (id: string | null) => void;
  setImageUrl: (url: string) => void;
  setInputMethod: (method: "file" | "url") => void;
  reset: () => void;
  getCurrentDetection: () => BackendDetection | undefined;
};

const initialState: LicensePlateState = {
  selectedFile: null,
  previewUrl: null,
  loading: false,
  loadingMessage: "",
  loadingProgress: 0,
  result: null,
  error: null,
  selectedDetection: null,
  imageUrl: "",
  inputMethod: "file",
};

export const useLicensePlateStore = create<
  LicensePlateState & LicensePlateActions
>((set, get) => ({
  ...initialState,

  setSelectedFile: (file) => set({ selectedFile: file }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setLoading: (loading) => set({ loading }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress as number }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setSelectedDetection: (id) => set({ selectedDetection: id }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setInputMethod: (method) => set({ inputMethod: method }),

  reset: () => set(initialState),

  getCurrentDetection: () => {
    const { result, selectedDetection } = get();
    if (!result?.detections || selectedDetection === null) {
      return undefined;
    }
    if (selectedDetection === "main") {
      return result.detections[0];
    }
    const index = parseInt(selectedDetection, 10);
    if (!isNaN(index) && index >= 0 && index < result.detections.length) {
      return result.detections[index];
    }
    return result.detections[0];
  },
}));

export const translateColor = (color: string | null): string => {
  if (!color) return "Không xác định";

  switch (color?.toLowerCase()) {
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
