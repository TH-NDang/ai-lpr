from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import torch
from ultralytics import YOLO
from paddleocr import PaddleOCR
import io
import base64
from PIL import Image
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monkey patch torch.load to use weights_only=False by default
original_torch_load = torch.load

def patched_torch_load(f, *args, **kwargs):
    # Override default weights_only to False for model loading
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return original_torch_load(f, *args, **kwargs)

# Replace the original torch.load with our patched version
torch.load = patched_torch_load

# Hàm thực hiện OCR như trong file npr.py
def perform_ocr(image_array):
    """
    Thực hiện OCR trên ảnh được cung cấp và trả về chuỗi văn bản trích xuất được.
    """
    if image_array is None:
        raise ValueError("Ảnh đầu vào không được là None.")
    if not isinstance(image_array, np.ndarray):
        raise TypeError("Ảnh đầu vào phải là một mảng numpy.")
    
    results = ocr.ocr(image_array, rec=True)
    return ' '.join([result[1][0] for result in results[0]] if results[0] else "Không đọc được biển số")

# Load models
try:
    # For YOLOv11, you can use:
    # Option 1: Load a pretrained YOLOv11 model and your weights
    model_path = os.path.abspath("best.pt")
    print(f"Looking for model at: {model_path}")
    
    if os.path.exists(model_path):
        print(f"Loading custom model from: {model_path}")
        model = YOLO(model_path)
    else:
        print("Custom model not found, using pretrained YOLOv11")
        # Option 2: Use pretrained YOLOv11 model directly
        model = YOLO('yolov11n.pt')  # or yolov11s.pt, yolov11m.pt, yolov11l.pt, yolov11x.pt
    
    print("Model loaded successfully!")
    ocr = PaddleOCR(use_angle_cls=True, lang='en')
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise

def process_image(image_array):
    results = model(image_array)
    processed_image = image_array.copy()
    
    # Nếu không phát hiện được biển số
    if len(results[0].boxes) == 0:
        cv2.putText(processed_image, "Không phát hiện được biển số", (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        return {
            "plateNumber": "Không phát hiện được biển số",
            "confidence": 0.0,
            "processedImage": processed_image
        }
    
    for result in results:
        boxes = result.boxes.cpu().numpy()
        for box in boxes:
            xyxy = box.xyxy[0]
            conf = box.conf[0]
            
            x1, y1, x2, y2 = map(int, xyxy)
            license_plate_img = image_array[y1:y2, x1:x2]
            
            # Sử dụng hàm perform_ocr từ npr.py
            plate_text = perform_ocr(license_plate_img)
            
            # Kiểm tra nếu OCR không đọc được biển số
            if plate_text == "Không đọc được biển số":
                # Vẫn vẽ khung biển số đã phát hiện
                cv2.rectangle(processed_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                # Hiển thị thông báo không đọc được
                cv2.putText(processed_image, plate_text, (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            else:
                # Draw bounding box and text
                cv2.rectangle(processed_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(processed_image, plate_text, (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            return {
                "plateNumber": plate_text,
                "confidence": float(conf),
                "processedImage": processed_image
            }
    
    # Fallback nếu có lỗi trong quá trình xử lý
    cv2.putText(processed_image, "Lỗi xử lý biển số", (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    return {
        "plateNumber": "Lỗi xử lý biển số",
        "confidence": 0.0,
        "processedImage": processed_image
    }

def encode_image(image):
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

@app.post("/process-image")
async def process_image_endpoint(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image_array = np.array(image)
        
        # Process the image
        result = process_image(image_array)
        
        # Encode the processed image
        processed_image_base64 = encode_image(result["processedImage"])
        
        return {
            "plateNumber": result["plateNumber"],
            "confidence": result["confidence"],
            "processedImageUrl": f"data:image/jpeg;base64,{processed_image_base64}"
        }
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 