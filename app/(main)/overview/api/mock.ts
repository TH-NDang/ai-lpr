import type { METHODS } from "@/components/data-table/constants/method";
import type { ColumnSchema } from "../../../../lib/table/schema";
import { subMinutes, subHours, subDays } from "date-fns";
import type { REGIONS } from "@/components/data-table/constants/region";

const DAYS = 20;

// Dữ liệu biển số tỉnh/thành phố
const PROVINCE_CODES: Record<string, string> = {
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
  "99": "Bắc Ninh",
};

const VEHICLE_TYPES = [
  "Xe con",
  "Xe tải",
  "Xe khách",
  "Xe chuyên dùng",
  "Xe máy",
  "Xe buýt",
  "Xe cứu thương",
  "Xe cứu hỏa",
];

const PLATE_TYPES = [
  "Biển trắng",
  "Biển vàng",
  "Biển xanh",
  "Biển đỏ",
  "Biển ngoại giao",
];

const PLATE_FORMATS = ["1 dòng", "2 dòng", "Vuông"];

const IMAGE_SOURCES = [
  "Camera trước",
  "Camera sau",
  "Camera bên",
  "Ảnh tải lên",
  "Video",
  "Camera hành trình",
];

function getRandomProvinceCode() {
  const provinceCodes = Object.keys(PROVINCE_CODES);
  const randomIndex = Math.floor(Math.random() * provinceCodes.length);
  return provinceCodes[randomIndex];
}

function getRandomConfidence() {
  // Trả về giá trị từ 60 đến 100
  return Math.floor(Math.random() * 41) + 60;
}

function getRandomVehicleType() {
  return VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
}

function getRandomPlateType() {
  return PLATE_TYPES[Math.floor(Math.random() * PLATE_TYPES.length)];
}

function getRandomPlateFormat() {
  return PLATE_FORMATS[Math.floor(Math.random() * PLATE_FORMATS.length)];
}

function getRandomImageSource() {
  return IMAGE_SOURCES[Math.floor(Math.random() * IMAGE_SOURCES.length)];
}

function getLevel(confidence: number) {
  if (confidence >= 90) return "success";
  if (confidence >= 75) return "warning";
  return "error";
}

function getRandomAlphaNumeric(length: number) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateRandomLicensePlate(provinceCode: string) {
  // Tạo ra biển số ngẫu nhiên theo mẫu: 30A-12345
  const letters = "ABCDEFGHKLMNPRSTUVXYZ";
  const randomLetter = letters.charAt(
    Math.floor(Math.random() * letters.length)
  );
  const randomNumber = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");

  return `${provinceCode}${randomLetter}-${randomNumber}`;
}

function generateRandomProcessingTime() {
  // Return a random processing time between 50ms and 2000ms
  return Math.floor(Math.random() * 1950) + 50;
}

export function createMockData({
  minutes = 0,
}: {
  size?: number;
  minutes?: number;
}): ColumnSchema[] {
  // Distribute dates evenly across the specified minutes
  let date: Date;
  if (minutes < 60) {
    date = subMinutes(new Date(), minutes);
  } else if (minutes < 1440) {
    // Less than a day
    date = subHours(new Date(), Math.floor(minutes / 60));
  } else {
    date = subDays(new Date(), Math.floor(minutes / 1440));
  }

  const provinceCode = getRandomProvinceCode();
  const provinceName = PROVINCE_CODES[provinceCode];
  const vehicleType = getRandomVehicleType();
  const plateType = getRandomPlateType();
  const plateFormat = getRandomPlateFormat();
  const confidence = getRandomConfidence();
  const plateNumber = generateRandomLicensePlate(provinceCode);
  const imageSource = getRandomImageSource();
  const processingTime = generateRandomProcessingTime();

  // Generate a single license plate recognition record
  return [
    {
      uuid: crypto.randomUUID(),
      level: getLevel(confidence),
      date,
      plateNumber,
      confidence,
      provinceCode,
      provinceName,
      vehicleType,
      plateType,
      plateFormat,
      imageSource,
      processingTime,
      plateSerial: plateNumber.split("-")[0],
      registrationNumber: plateNumber.split("-")[1] || "",
      imageUrl: `/images/plate-${Math.floor(Math.random() * 10) + 1}.jpg`,
      processedImageUrl: `/images/processed-plate-${
        Math.floor(Math.random() * 10) + 1
      }.jpg`,
    },
  ];
}

// Generate mock data with random timestamps across the DAYS period
export const mock = Array.from({ length: DAYS * 24 * 3 }) // 3 entries per hour
  .map((_, i) => createMockData({ minutes: Math.floor(i * 20) }))
  .reduce((prev, curr) => prev.concat(curr), []) satisfies ColumnSchema[];
