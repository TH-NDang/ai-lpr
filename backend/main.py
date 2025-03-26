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
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("lpr-api")

# Initialize thread pool for async operations
executor = ThreadPoolExecutor()

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

# Ngưỡng tin cậy cho model
DETECTION_CONF_THRESHOLD = 0.4

# Monkey patch torch.load to use weights_only=False by default
original_torch_load = torch.load

def patched_torch_load(f, *args, **kwargs):
    # Override default weights_only to False for model loading
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return original_torch_load(f, *args, **kwargs)

# Replace the original torch.load with our patched version
torch.load = patched_torch_load

def preprocess_license_plate(license_plate_img):
    """
    Tiền xử lý ảnh biển số để cải thiện kết quả OCR
    """
    try:
        # Tạo một danh sách cho các ảnh đã xử lý
        processed_images = [license_plate_img]  # Luôn giữ ảnh gốc
        
        # 1. Chuyển sang ảnh xám
        gray_plate = cv2.cvtColor(license_plate_img, cv2.COLOR_BGR2GRAY)
        processed_images.append(gray_plate)
        
        # 2. Thay đổi kích thước nếu cần (đảm bảo ảnh đủ lớn)
        height, width = gray_plate.shape
        min_height, min_width = 50, 100
        if height < min_height or width < min_width:
            scale_factor = max(min_height/height, min_width/width)
            gray_plate = cv2.resize(gray_plate, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
            processed_images.append(gray_plate)
        
        # 3. Tăng cường độ tương phản bằng CLAHE với các tham số khác nhau
        clahe1 = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrast_plate1 = clahe1.apply(gray_plate)
        processed_images.append(contrast_plate1)
        
        clahe2 = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4,4))
        contrast_plate2 = clahe2.apply(gray_plate)
        processed_images.append(contrast_plate2)
        
        # 4. Nhị phân hóa ảnh sử dụng nhiều phương pháp
        # 4.1 Adaptive Thresholding (Gaussian)
        binary_plate1 = cv2.adaptiveThreshold(
            contrast_plate1, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        processed_images.append(binary_plate1)
        
        # 4.2 Adaptive Thresholding (Mean)
        binary_plate2 = cv2.adaptiveThreshold(
            contrast_plate1, 255, cv2.ADAPTIVE_THRESH_MEAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        processed_images.append(binary_plate2)
        
        # 4.3 Otsu's thresholding
        _, binary_plate3 = cv2.threshold(contrast_plate1, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_images.append(binary_plate3)
        
        # 5. Xử lý morphological để cải thiện chất lượng ảnh nhị phân
        # 5.1 Closing (đóng) - Giúp kết nối các thành phần gần nhau
        kernel = np.ones((2, 2), np.uint8)
        closing = cv2.morphologyEx(binary_plate1, cv2.MORPH_CLOSE, kernel)
        processed_images.append(closing)
        
        # 5.2 Opening (mở) - Giúp loại bỏ nhiễu nhỏ
        opening = cv2.morphologyEx(binary_plate1, cv2.MORPH_OPEN, kernel)
        processed_images.append(opening)
        
        # 6. Sắc nét hóa ảnh
        # 6.1 Unsharp masking
        gaussian_blur = cv2.GaussianBlur(gray_plate, (0, 0), 3)
        unsharp_mask = cv2.addWeighted(gray_plate, 1.5, gaussian_blur, -0.5, 0)
        processed_images.append(unsharp_mask)
        
        # 6.2 Sharpening kernel
        sharpen_kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(gray_plate, -1, sharpen_kernel)
        processed_images.append(sharpened)
        
        # 7. Phát hiện cạnh để làm nổi bật ký tự
        edges = cv2.Canny(gray_plate, 100, 200)
        # Mở rộng cạnh để các ký tự kết nối tốt hơn
        edges_dilated = cv2.dilate(edges, kernel, iterations=1)
        processed_images.append(255 - edges_dilated)  # Đảo ngược để ký tự là màu đen
        
        # 8. Thử nghiệm với độ sáng và độ tương phản khác nhau
        # 8.1 Tăng độ sáng
        brighter = cv2.convertScaleAbs(gray_plate, alpha=1.1, beta=30)
        processed_images.append(brighter)
        
        # 8.2 Tăng độ tương phản
        more_contrast = cv2.convertScaleAbs(gray_plate, alpha=1.3, beta=0)
        processed_images.append(more_contrast)
        
        return processed_images
    except Exception as e:
        logger.error(f"Error preprocessing license plate: {str(e)}")
        return [license_plate_img]  # Trả về ảnh gốc nếu xử lý thất bại

# Add these constants at the top of the file with the other constants
SPECIAL_FORMATS = {
    r'(\d{2})[-\s]*([A-Z]\d)[\s-]*(\d{3})[.,](\d{2})': '{0}-{1} {2}.{3}',  # 68-G1 668.86
    r'(\d{2})[-\s]*([A-Z])(\d)[\s-]*(\d{3})[.,](\d{2})': '{0}-{1}{2} {3}.{4}',  # 68-G1 668.86 alternative format
    r'(\d{2})[-\s]([A-Z]\d+)[\s-](\d+)': '{0}-{1} {2}',  # 68-G1 66886
    r'(\d{2})[-\s]([A-Z]{1,2})[-\s](\d+)': '{0}-{1} {2}',  # 68-AB 12345
}

# Replace the perform_ocr function with this improved version
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
            
        # Create multiple preprocessed versions of the image for better OCR
        processed_images = []
        
        # Original image
        processed_images.append(("original", image_array))
        
        # Convert to grayscale
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        processed_images.append(("gray", cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)))
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        clahe_img = clahe.apply(gray)
        processed_images.append(("clahe", cv2.cvtColor(clahe_img, cv2.COLOR_GRAY2RGB)))
        
        # Apply Gaussian blur to reduce noise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        processed_images.append(("blur", cv2.cvtColor(blur, cv2.COLOR_GRAY2RGB)))
        
        # Apply sharpening
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharp = cv2.filter2D(gray, -1, kernel)
        processed_images.append(("sharp", cv2.cvtColor(sharp, cv2.COLOR_GRAY2RGB)))
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        processed_images.append(("thresh", cv2.cvtColor(thresh, cv2.COLOR_GRAY2RGB)))
        
        # Apply Otsu's thresholding
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_images.append(("otsu", cv2.cvtColor(otsu, cv2.COLOR_GRAY2RGB)))
        
        # Increase contrast
        alpha = 1.5  # Contrast control
        beta = 0    # Brightness control
        contrast = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
        processed_images.append(("contrast", cv2.cvtColor(contrast, cv2.COLOR_GRAY2RGB)))
        
        # Run OCR on all processed images
        best_result = None
        best_score = 0
        all_results = []
        
        for name, img in processed_images:
            ocr_result = ocr.ocr(img, rec=True)
            text = ' '.join([result[1][0] for result in ocr_result[0]] if ocr_result[0] else "")
            confidence = np.mean([result[1][1] for result in ocr_result[0]]) if ocr_result[0] else 0
            
            if text and confidence > 0:
                all_results.append((text, confidence, name))
        
        # Sort results by confidence
        all_results.sort(key=lambda x: x[1], reverse=True)
        
        # First, try to find a result that matches special Vietnamese license plate formats
        for text, confidence, name in all_results:
            # Preserve original text before normalization for special format detection
            original_text = text
            
            # Check if the text matches any special format
            for pattern, format_str in SPECIAL_FORMATS.items():
                match = re.search(pattern, original_text)
                if match:
                    groups = match.groups()
                    formatted_text = format_str.format(*groups)
                    return formatted_text, confidence
            
            # Try with some light cleaning (remove spaces but keep special chars)
            cleaned = re.sub(r'\s+', '', original_text)
            for pattern, format_str in SPECIAL_FORMATS.items():
                match = re.search(pattern, cleaned)
                if match:
                    groups = match.groups()
                    formatted_text = format_str.format(*groups)
                    return formatted_text, confidence
        
        # If no special format match, return the highest confidence result
        if all_results:
            return all_results[0][0], all_results[0][1]
        
        return "Không đọc được biển số", 0
        
    except Exception as e:
        print(f"OCR error: {str(e)}")
        return "Không đọc được biển số", 0

# Nhận dạng màu sắc biển số
def detect_plate_color(plate_img):
    """
    Nhận dạng màu sắc chính của biển số để xác định loại biển
    """
    try:
        # Chuyển sang không gian màu HSV
        hsv_img = cv2.cvtColor(plate_img, cv2.COLOR_BGR2HSV)
        
        # Lấy histogram màu
        h_hist = cv2.calcHist([hsv_img], [0], None, [180], [0, 180])
        s_hist = cv2.calcHist([hsv_img], [1], None, [256], [0, 256])
        v_hist = cv2.calcHist([hsv_img], [2], None, [256], [0, 256])
        
        # Màu sắc chủ đạo
        dominant_h = np.argmax(h_hist)
        dominant_s = np.argmax(s_hist)
        dominant_v = np.argmax(v_hist)
        
        # Kiểm tra xem đây là biển trắng, vàng, xanh hay đỏ
        if dominant_s < 50:  # Độ bão hòa thấp
            return "personal"  # Biển trắng (cá nhân)
        elif 20 <= dominant_h <= 35 and dominant_s > 100:
            return "commercial"  # Biển vàng (kinh doanh)
        elif 100 <= dominant_h <= 130 and dominant_s > 100:
            return "government"  # Biển xanh (cơ quan nhà nước/công an)
        elif (0 <= dominant_h <= 10 or 170 <= dominant_h <= 180) and dominant_s > 100:
            return "military"  # Biển đỏ (quân đội)
        else:
            return "personal"  # Mặc định là biển cá nhân
    except Exception as e:
        logger.error(f"Error detecting plate color: {str(e)}")
        return "personal"  # Mặc định là biển cá nhân nếu có lỗi

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
    
    # Save the original text
    original_text = plate_text
    
    # Check for special formats first
    for pattern, _ in SPECIAL_FORMATS.items():
        match = re.search(pattern, original_text)
        if match:
            result["is_valid"] = True
            groups = match.groups()
            
            # For format like 68-G1 668.86
            if len(groups) == 4:
                result["province_code"] = groups[0]
                result["serial"] = groups[1]
                result["number"] = f"{groups[2]}.{groups[3]}"
                result["format"] = "2 số - 2 ký tự - 3 số - dấu chấm - 2 số"
            # For format like 68-G1 66886
            elif len(groups) == 3:
                result["province_code"] = groups[0]
                result["serial"] = groups[1]
                result["number"] = groups[2]
                result["format"] = "2 số - 2 ký tự - 5 số"
            # For format like 68-G1 668.86 alternative
            elif len(groups) == 5:
                result["province_code"] = groups[0]
                result["serial"] = f"{groups[1]}{groups[2]}"
                result["number"] = f"{groups[3]}.{groups[4]}"
                result["format"] = "2 số - 1 chữ - 1 số - 3 số - dấu chấm - 2 số"
            
            # Lấy tên tỉnh/thành phố
            result["province_name"] = PROVINCE_CODES.get(result["province_code"], "Không xác định")
            
            # Determine vehicle type based on serial
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
                elif first_char == "G":
                    result["vehicle_type"] = "Xe mô tô"
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
            
            # Set normalized form but preserve special characters
            result["normalized"] = original_text
            return result
    
    # If no special format matched, continue with regular processing
    # First, handle motorcycle plates which are usually just 5 digits
    if re.match(r'^\d{5}$', plate_text):
        result["is_valid"] = True
        result["number"] = plate_text
        result["format"] = "5 số (xe máy)"
        result["vehicle_type"] = "Xe máy"
        result["normalized"] = plate_text
        return result
    
    # For regular processing, we'll create a normalized version that preserves dashes and dots
    # but removes spaces for pattern matching
    normalized = re.sub(r'\s+', '', plate_text)
    result["normalized"] = normalized
    
    # Áp dụng các mẫu biển số khác nhau (regex)
    
    # Mẫu 1: 2 số - 1 chữ - 4 số (Ví dụ: 51A1234)
    pattern1 = r'^(\d{2})[-]?([A-Z])[-]?(\d{4,5})$'
    
    # Mẫu 2: 2 số - 2 chữ - 4 số (Ví dụ: 51AB1234)
    pattern2 = r'^(\d{2})[-]?([A-Z]{2})[-]?(\d{4,5})$'
    
    # Mẫu 3: 2 số - 1 chữ - 1 số - 4 số (Ví dụ: 51A61234)
    pattern3 = r'^(\d{2})[-]?([A-Z])[-]?(\d{1})[-]?(\d{4,5})$'
    
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
                elif first_char == "G":
                    result["vehicle_type"] = "Xe mô tô"
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
    
    # If we couldn't match any pattern, but there's a dash or dot in the original,
    # try to manually parse it
    if not result["is_valid"] and ('-' in original_text or '.' in original_text):
        # Try to manually parse based on common patterns
        parts = re.split(r'[-\s.]+', original_text)
        if len(parts) >= 2:
            result["is_valid"] = True
            result["province_code"] = parts[0][:2] if len(parts[0]) >= 2 else ""
            
            if len(parts) == 2:
                # Format like "68-G166886"
                if len(parts[0]) > 2:
                    result["serial"] = parts[0][2:]
                else:
                    result["serial"] = parts[1][:2]
                    result["number"] = parts[1][2:]
            elif len(parts) >= 3:
                # Format like "68-G1 668.86"
                result["serial"] = parts[1]
                result["number"] = '.'.join(parts[2:])
            
            result["province_name"] = PROVINCE_CODES.get(result["province_code"], "Không xác định")
            result["format"] = "Format đặc biệt"
    
    return result

# Load models
try:
    # For YOLOv11, you can use:
    # Option 1: Load a pretrained YOLOv11 model and your weights
    model_path = os.path.abspath("best.pt")
    logger.info(f"Looking for model at: {model_path}")
    
    if os.path.exists(model_path):
        logger.info(f"Loading custom model from: {model_path}")
        model = YOLO(model_path)
    else:
        logger.info("Custom model not found, using pretrained YOLOv8n")
        model = YOLO('yolov8n.pt')  # Use YOLOv8 as fallback
    
    logger.info("Model loaded successfully!")
    ocr = PaddleOCR(use_angle_cls=True, lang='latin')  # Changed to latin for better detection of alphanumeric
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
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
                "confidence_ocr": 0.0,
                "processedImage": processed_image,
                "plateAnalysis": None
            }
        
        all_detections = []
        
        for result in results:
            boxes = result.boxes.cpu().numpy()
            for box in boxes:
                xyxy = box.xyxy[0]
                conf = box.conf[0]
                
                # Kiểm tra ngưỡng tin cậy
                if conf < DETECTION_CONF_THRESHOLD:
                    continue
                
                # Đảm bảo tọa độ nằm trong phạm vi hình ảnh
                height, width = processed_image.shape[:2]
                x1, y1, x2, y2 = map(int, xyxy)
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(width-1, x2), min(height-1, y2)
                
                # Kiểm tra xem kích thước của biển số có hợp lý không
                if x2 <= x1 or y2 <= y1 or (x2-x1)*(y2-y1) < 100:  # Quá nhỏ
                    continue
                
                license_plate_img = image_array[y1:y2, x1:x2]
                
                # Sử dụng hàm perform_ocr cải tiến
                plate_text, ocr_confidence = perform_ocr(license_plate_img)
                
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
                
                all_detections.append({
                    "plateNumber": plate_text,
                    "confidence": float(conf),
                    "confidence_ocr": float(ocr_confidence),
                    "boundingBox": [x1, y1, x2, y2],
                    "plateAnalysis": plate_analysis
                })
        
        # Sort detections by confidence
        all_detections.sort(key=lambda x: (x["confidence"] + x["confidence_ocr"])/2, reverse=True)
        
        # If we have any detections, return the best one
        if all_detections:
            best_detection = all_detections[0]
            return {
                "plateNumber": best_detection["plateNumber"],
                "confidence": best_detection["confidence"],
                "confidence_ocr": best_detection["confidence_ocr"],
                "processedImage": processed_image,
                "plateAnalysis": best_detection["plateAnalysis"],
                "allDetections": all_detections
            }
        
        # Fallback nếu không có biển số nào được xử lý
        cv2.putText(processed_image, "Không tìm thấy biển số hợp lệ", (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        return {
            "plateNumber": "Không tìm thấy biển số hợp lệ",
            "confidence": 0.0,
            "confidence_ocr": 0.0,
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
            "confidence_ocr": 0.0,
            "processedImage": error_image,
            "plateAnalysis": None
        }

def encode_image(image):
    try:
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        logger.error(f"Error encoding image: {str(e)}")
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
                "confidence_ocr": 0.0,
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
                "confidence_ocr": 0.0,
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
            "confidence_ocr": result.get("confidence_ocr", 0.0),
            "processedImageUrl": f"data:image/jpeg;base64,{processed_image_base64}",
            "plateAnalysis": result["plateAnalysis"],
            "allDetections": result.get("allDetections", [])
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
            "confidence_ocr": 0.0,
            "processedImageUrl": f"data:image/jpeg;base64,{encoded_error}",
            "plateAnalysis": None
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info") 