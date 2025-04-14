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
  error: string | null;
}

export interface ProcessedDetection extends BackendDetection {
  confidence_percent: number;
  processed_image_url: string | null;
}

interface LicensePlateState {
  selectedFile: File | null;
  previewUrl: string | null;
  imageUrl: string;
  inputMethod: "file" | "url";

  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;

  result: ApiResponse | null;
  error: string | null;
  selectedDetection: string;

  setSelectedFile: (file: File | null) => void;  setPreviewUrl: (url: string | null) => void;
  setImageUrl: (url: string) => void;
  setInputMethod: (method: "file" | "url") => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setLoadingProgress: (progress: number | ((prev: number) => number)) => void;
  setResult: (result: ApiResponse | null) => void;
  setError: (error: string | null) => void;
  setSelectedDetection: (detection: string) => void;
  reset: () => void;

  getCurrentDetection: () => ProcessedDetection | null;
}

export const useLicensePlateStore = create<LicensePlateState>()((set, get) => ({
  selectedFile: null,
  previewUrl: null,
  imageUrl: "",
  inputMethod: "file",
  loading: false,
  loadingMessage: "Đang xử lý...",
  loadingProgress: 0,
  result: null,
  error: null,
  selectedDetection: "main",

  setSelectedFile: (file) => set({ selectedFile: file }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setInputMethod: (method) => set({ inputMethod: method }),
  setLoading: (isLoading) => set({ loading: isLoading }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  setLoadingProgress: (progress) =>
    set((state) => ({
      loadingProgress:
        typeof progress === "function"
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
      imageUrl: "",
      result: null,
      error: null,
      loading: false,
      loadingProgress: 0,
      loadingMessage: "Đang xử lý...",
      selectedDetection: "main",
    }),

  getCurrentDetection: () => {
    const { result, selectedDetection } = get();

    if (!result || !result.detections || result.detections.length === 0) {
      return null;
    }

    let detection: BackendDetection | undefined;

    if (selectedDetection === "main") {
      detection = result.detections[0];
    } else {
      const index = Number.parseInt(selectedDetection, 10);
      if (
        !Number.isNaN(index) &&
        index >= 0 &&
        index < result.detections.length
      ) {
        detection = result.detections[index];
      } else {
        detection = result.detections[0];
      }
    }

    if (!detection) return null;

    return {
      ...detection,
      confidence_percent: detection.confidence_detection * 100,
      processed_image_url: result.processed_image_url,
    };
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
