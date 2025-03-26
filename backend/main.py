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
import re

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dữ liệu biển số tỉnh/thành phố
PROVINCE_CODES = {
    "11": "Cao Bằng",
    "12": "Lạng Sơn",
    "14": "Quảng Ninh",
    "15": "Hải Phòng",
    "16": "Hải Phòng",
    "17": "Thái Bình",
    "18": "Nam Định",
    "19": "Phú Thọ",
    "20": "Thái Nguyên",
    "21": "Yên Bái",
    "22": "Tuyên Quang",
    "23": "Hà Giang",
    "24": "Lào Cai",
    "25": "Lai Châu",
    "26": "Sơn La",
    "27": "Điện Biên",
    "28": "Hòa Bình",
    "29": "Hà Nội",
    "30": "Hà Nội",
    "31": "Hà Nội",
    "32": "Hà Nội",
    "33": "Hà Nội",
    "34": "Hải Dương",
    "35": "Ninh Bình",
    "36": "Thanh Hóa",
    "37": "Nghệ An",
    "38": "Hà Tĩnh",
    "39": "Đồng Nai",
    "40": "Hà Nội",
    "41": "TP. Hồ Chí Minh",
    "43": "TP. Đà Nẵng",
    "47": "Đắk Lắk",
    "48": "Đắk Nông",
    "49": "Lâm Đồng",
    "50": "TP. Hồ Chí Minh",
    "51": "TP. Hồ Chí Minh",
    "52": "TP. Hồ Chí Minh",
    "53": "TP. Hồ Chí Minh",
    "54": "TP. Hồ Chí Minh",
    "55": "TP. Hồ Chí Minh",
    "56": "TP. Hồ Chí Minh",
    "57": "TP. Hồ Chí Minh",
    "58": "TP. Hồ Chí Minh",
    "59": "TP. Hồ Chí Minh",
    "60": "Đồng Nai",
    "61": "Bình Dương",
    "62": "Long An",
    "63": "Tiền Giang",
    "64": "Vĩnh Long",
    "65": "Cần Thơ",
    "66": "Đồng Tháp",
    "67": "An Giang",
    "68": "Kiên Giang",
    "69": "Cà Mau",
    "70": "Tây Ninh",
    "71": "Bến Tre",
    "72": "Bà Rịa - Vũng Tàu",
    "73": "Quảng Bình",
    "74": "Quảng Trị",
    "75": "Thừa Thiên Huế",
    "76": "Quảng Ngãi",
    "77": "Bình Định",
    "78": "Phú Yên",
    "79": "Khánh Hòa",
    "81": "Gia Lai",
    "82": "Kon Tum",
    "83": "Sóc Trăng",
    "84": "Trà Vinh",
    "85": "Ninh Thuận",
    "86": "Bình Thuận",
    "88": "Vĩnh Phúc",
    "89": "Hưng Yên",
    "90": "Hà Nam",
    "92": "Quảng Nam",
    "93": "Bình Phước",
    "94": "Bạc Liêu",
    "95": "Hậu Giang",
    "97": "Bắc Kạn",
    "98": "Bắc Giang",
    "99": "Bắc Ninh"
}

# Phân loại loại biển số
LICENSE_PLATE_TYPES = {
    "personal": {
        "name": "Xe cá nhân",
        "description": "Biển trắng, chữ đen"
    },
    "commercial": {
        "name": "Xe kinh doanh vận tải",
        "description": "Biển vàng, chữ đen"
    },
    "government": {
        "name": "Xe cơ quan nhà nước",
        "description": "Biển xanh dương, chữ trắng"
    },
    "military": {
        "name": "Xe quân đội",
        "description": "Biển đỏ, chữ trắng"
    },
    "police": {
        "name": "Xe công an",
        "description": "Biển xanh dương, chữ trắng"
    },
    "diplomatic": {
        "name": "Xe ngoại giao",
        "description": "Biển trắng, chữ đen, ký hiệu NG"
    },
    "international": {
        "name": "Xe quốc tế",
        "description": "Biển trắng, chữ đen, ký hiệu QT"
    }
}

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
    
    try:
        # Đảm bảo hình ảnh đủ lớn để OCR có thể hoạt động tốt
        min_height, min_width = 50, 50
        current_height, current_width = image_array.shape[:2]
        
        # Nếu ảnh quá nhỏ, resize lên
        if current_height < min_height or current_width < min_width:
            scale_factor = max(min_height/current_height, min_width/current_width)
            image_array = cv2.resize(image_array, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
        
        # Đảm bảo ảnh có 3 kênh màu (RGB)
        if len(image_array.shape) == 2:  # Grayscale
            image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
        elif image_array.shape[2] == 4:  # RGBA
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
            
        results = ocr.ocr(image_array, rec=True)
        return ' '.join([result[1][0] for result in results[0]] if results[0] else "Không đọc được biển số")
    except Exception as e:
        print(f"OCR error: {str(e)}")
        return "Không đọc được biển số"

# Phân tích biển số xe
def analyze_license_plate(plate_text):
    """
    Phân tích biển số xe để xác định:
    - Tỉnh/thành phố đăng ký
    - Loại biển số (cá nhân, kinh doanh, etc.)
    - Seri đăng ký
    - Số đăng ký

    Trả về thông tin chi tiết dưới dạng dictionary.
    """
    result = {
        "original": plate_text,
        "normalized": "",
        "province_code": "",
        "province_name": "",
        "serial": "",
        "number": "",
        "vehicle_type": "",
        "plate_type": "personal",  # Mặc định là xe cá nhân
        "is_valid": False,
        "format": ""
    }
    
    # Loại bỏ ký tự đặc biệt và khoảng trắng
    normalized = re.sub(r'[^A-Z0-9]', '', plate_text.upper())
    result["normalized"] = normalized
    
    # Xử lý biển số xe quốc tế hoặc ngoại giao
    if "NG" in normalized:
        result["plate_type"] = "diplomatic"
    elif "QT" in normalized:
        result["plate_type"] = "international"
    
    # Áp dụng các mẫu biển số khác nhau (regex)
    
    # Mẫu 1: 2 số - 1 chữ - 4 số (Ví dụ: 51A1234)
    pattern1 = r'^(\d{2})([A-Z])(\d{4,5})$'
    
    # Mẫu 2: 2 số - 2 chữ - 4 số (Ví dụ: 51AB1234)
    pattern2 = r'^(\d{2})([A-Z]{2})(\d{4,5})$'
    
    # Mẫu 3: 2 số - 1 chữ - 1 số - 4 số (Ví dụ: 51A61234)
    pattern3 = r'^(\d{2})([A-Z])(\d{1})(\d{4,5})$'
    
    for pattern, format_name in [
        (pattern1, "2 số - 1 chữ - 4/5 số"),
        (pattern2, "2 số - 2 chữ - 4/5 số"),
        (pattern3, "2 số - 1 chữ - 1 số - 4/5 số")
    ]:
        match = re.match(pattern, normalized)
        if match:
            result["is_valid"] = True
            result["format"] = format_name
            
            if pattern == pattern1:
                result["province_code"] = match.group(1)
                result["serial"] = match.group(2)
                result["number"] = match.group(3)
                
            elif pattern == pattern2:
                result["province_code"] = match.group(1)
                result["serial"] = match.group(2)
                result["number"] = match.group(3)
                
            elif pattern == pattern3:
                result["province_code"] = match.group(1)
                result["serial"] = match.group(2) + match.group(3)
                result["number"] = match.group(4)
            
            # Lấy tên tỉnh/thành phố
            result["province_name"] = PROVINCE_CODES.get(result["province_code"], "Không xác định")
            
            # Xác định loại xe dựa trên serial
            if result["serial"]:
                first_char = result["serial"][0]
                if first_char == "A":
                    result["vehicle_type"] = "Xe con"
                elif first_char == "B":
                    result["vehicle_type"] = "Xe tải"
                elif first_char == "C":
                    result["vehicle_type"] = "Xe khách"
                elif first_char == "D":
                    result["vehicle_type"] = "Xe chuyên dùng"
                elif first_char == "E":
                    result["vehicle_type"] = "Xe máy kéo"
                elif first_char == "F":
                    result["vehicle_type"] = "Xe nông nghiệp"
                elif first_char == "K":
                    result["vehicle_type"] = "Xe gắn máy"
                elif first_char == "L":
                    result["vehicle_type"] = "Xe rơ-moóc"
                elif first_char == "M":
                    result["vehicle_type"] = "Xe máy"
                elif first_char == "R":
                    result["vehicle_type"] = "Xe ba bánh"
                elif first_char == "S":
                    result["vehicle_type"] = "Xe bán tải"
                elif first_char == "T":
                    result["vehicle_type"] = "Xe công trình"
                elif first_char == "V":
                    result["vehicle_type"] = "Xe du lịch"
                else:
                    result["vehicle_type"] = "Khác"
            break
    
    return result

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
        model = YOLO('yolov11n.pt')  # Use YOLOv11 (latest)
    
    print("Model loaded successfully!")
    ocr = PaddleOCR(use_angle_cls=True, lang='en')
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise

def process_image(image_array):
    try:
        # Đảm bảo hình ảnh đầu vào là hợp lệ
        if image_array is None or image_array.size == 0:
            raise ValueError("Invalid image input")
            
        # Đảm bảo hình ảnh có 3 kênh màu (RGB) cho YOLO
        if len(image_array.shape) == 2:  # Grayscale
            image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
        elif image_array.shape[2] == 4:  # RGBA
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
        
        results = model(image_array)
        processed_image = image_array.copy()
        
        # Nếu không phát hiện được biển số
        if len(results[0].boxes) == 0:
            cv2.putText(processed_image, "Không phát hiện được biển số", (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return {
                "plateNumber": "Không phát hiện được biển số",
                "confidence": 0.0,
                "processedImage": processed_image,
                "plateAnalysis": None
            }
        
        for result in results:
            boxes = result.boxes.cpu().numpy()
            for box in boxes:
                xyxy = box.xyxy[0]
                conf = box.conf[0]
                
                # Đảm bảo tọa độ nằm trong phạm vi hình ảnh
                height, width = processed_image.shape[:2]
                x1, y1, x2, y2 = map(int, xyxy)
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(width-1, x2), min(height-1, y2)
                
                # Kiểm tra xem kích thước của biển số có hợp lý không
                if x2 <= x1 or y2 <= y1 or (x2-x1)*(y2-y1) < 100:  # Quá nhỏ
                    continue
                
                license_plate_img = image_array[y1:y2, x1:x2]
                
                # Sử dụng hàm perform_ocr từ npr.py
                plate_text = perform_ocr(license_plate_img)
                
                # Phân tích biển số
                plate_analysis = None
                if plate_text != "Không đọc được biển số":
                    plate_analysis = analyze_license_plate(plate_text)
                
                # Kiểm tra nếu OCR không đọc được biển số
                if plate_text == "Không đọc được biển số":
                    # Vẽ khung biển số đã phát hiện
                    cv2.rectangle(processed_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    # Hiển thị thông báo không đọc được
                    cv2.putText(processed_image, plate_text, (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                else:
                    # Draw bounding box and text - chỉ hiển thị số biển số
                    cv2.rectangle(processed_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(processed_image, plate_text, (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    
                    # Không hiển thị thông tin phân tích lên ảnh
                    # Thông tin này sẽ được gửi cho frontend thông qua plateAnalysis
                
                return {
                    "plateNumber": plate_text,
                    "confidence": float(conf),
                    "processedImage": processed_image,
                    "plateAnalysis": plate_analysis
                }
        
        # Fallback nếu không có biển số nào được xử lý
        cv2.putText(processed_image, "Không tìm thấy biển số hợp lệ", (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        return {
            "plateNumber": "Không tìm thấy biển số hợp lệ",
            "confidence": 0.0,
            "processedImage": processed_image,
            "plateAnalysis": None
        }
    
    except Exception as e:
        print(f"Image processing error: {str(e)}")
        error_image = np.ones((400, 600, 3), dtype=np.uint8) * 255  # Tạo ảnh trắng
        error_message = f"Lỗi xử lý ảnh: {str(e)}"
        cv2.putText(error_image, error_message, (30, 200),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        return {
            "plateNumber": "Lỗi xử lý ảnh",
            "confidence": 0.0,
            "processedImage": error_image,
            "plateAnalysis": None
        }

def encode_image(image):
    try:
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {str(e)}")
        # Return a simple error image if encoding fails
        error_img = np.ones((100, 300, 3), dtype=np.uint8) * 255
        cv2.putText(error_img, "Error encoding image", (10, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        _, buffer = cv2.imencode('.jpg', error_img)
        return base64.b64encode(buffer).decode('utf-8')

@app.post("/process-image")
async def process_image_endpoint(file: UploadFile = File(...)):
    try:
        # Kiểm tra loại file
        if not file.content_type.startswith('image/'):
            return {
                "plateNumber": "Định dạng file không được hỗ trợ",
                "confidence": 0.0,
                "processedImageUrl": "",
                "plateAnalysis": None
            }
            
        # Read the uploaded file
        contents = await file.read()
        
        try:
            image = Image.open(io.BytesIO(contents))
            image_array = np.array(image)
        except Exception as e:
            print(f"Error opening image: {str(e)}")
            error_image = np.ones((400, 600, 3), dtype=np.uint8) * 255
            cv2.putText(error_image, "Không thể mở file ảnh", (50, 200),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            encoded_error = encode_image(error_image)
            return {
                "plateNumber": "Không thể mở file ảnh",
                "confidence": 0.0,
                "processedImageUrl": f"data:image/jpeg;base64,{encoded_error}",
                "plateAnalysis": None
            }
        
        # Process the image
        result = process_image(image_array)
        
        # Encode the processed image
        processed_image_base64 = encode_image(result["processedImage"])
        
        return {
            "plateNumber": result["plateNumber"],
            "confidence": result["confidence"],
            "processedImageUrl": f"data:image/jpeg;base64,{processed_image_base64}",
            "plateAnalysis": result["plateAnalysis"]
        }
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        error_image = np.ones((400, 600, 3), dtype=np.uint8) * 255
        cv2.putText(error_image, f"Lỗi xử lý: {str(e)}", (30, 200),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        encoded_error = encode_image(error_image)
        
        return {
            "plateNumber": f"Lỗi: {str(e)}",
            "confidence": 0.0,
            "processedImageUrl": f"data:image/jpeg;base64,{encoded_error}",
            "plateAnalysis": None
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info") 