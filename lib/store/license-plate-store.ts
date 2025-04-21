import { create } from "zustand";
import { DetectionResult, ProcessImageResponse } from "@/lib/types"; // Assuming types are defined here

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

// --- State Interface ---
type LicensePlateState = {
  selectedFile: File | null;
  previewUrl: string | null;
  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  result: ProcessImageResponse | null;
  error: string | null;
  selectedDetection: string | null; // ID of the selected detection ('main' or index)
  imageUrl: string; // For URL input
  inputMethod: "file" | "url"; // 'file' or 'url'
};

// --- Actions Interface ---
type LicensePlateActions = {
  setSelectedFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setLoadingProgress: (progress: number | ((prev: number) => number)) => void;
  setResult: (result: ProcessImageResponse | null) => void;
  setError: (error: string | null) => void;
  setSelectedDetection: (id: string | null) => void;
  setImageUrl: (url: string) => void;
  setInputMethod: (method: "file" | "url") => void;
  reset: () => void;
  getCurrentDetection: () => DetectionResult | undefined;
};

// --- Initial State ---
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

// --- Store Definition ---
export const useLicensePlateStore = create<
  LicensePlateState & LicensePlateActions
>((set, get) => ({
  ...initialState,

  // --- Setters ---
  setSelectedFile: (file) => set({ selectedFile: file }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setLoading: (loading) => set({ loading }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setSelectedDetection: (id) => set({ selectedDetection: id }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setInputMethod: (method) => set({ inputMethod: method }),

  // --- Reset Action ---
  reset: () => set(initialState),

  // --- Getter for selected detection details ---
  getCurrentDetection: () => {
    const { result, selectedDetection } = get();
    if (!result?.detections || selectedDetection === null) {
      return undefined;
    }
    if (selectedDetection === "main") {
      return result.detections[0]; // Return the first one if 'main' is selected
    }
    const index = parseInt(selectedDetection, 10);
    if (!isNaN(index) && index >= 0 && index < result.detections.length) {
      return result.detections[index];
    }
    return result.detections[0]; // Fallback to first detection
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
