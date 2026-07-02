// Danh sách loại xe chuẩn dùng chung cho Manager (tạo VehicleType) và User (gắn biển số).
// - `code`/`name`: dùng khi manager tạo VehicleType của tòa nhà.
// - `plateType`: giá trị enum lưu trên biển số user (khớp User.licensePlates.vehicleType).
export interface VehiclePreset {
  code: string;
  name: string;
  plateType: 'motorcycle' | 'car' | 'ebike' | 'emotorbike' | 'suv' | 'truck';
}

export const VEHICLE_PRESETS: VehiclePreset[] = [
  { code: 'MOTORCYCLE', name: 'Xe máy', plateType: 'motorcycle' },
  { code: 'CAR', name: 'Ô tô', plateType: 'car' },
  { code: 'EBIKE', name: 'Xe đạp điện', plateType: 'ebike' },
  { code: 'EMOTORBIKE', name: 'Xe máy điện', plateType: 'emotorbike' },
  { code: 'SUV', name: 'SUV', plateType: 'suv' },
  { code: 'TRUCK', name: 'Xe tải', plateType: 'truck' },
];

// Nhãn tiếng Việt cho từng giá trị enum của biển số (gồm 'other' = Khác).
export const PLATE_TYPE_LABELS: Record<string, string> = {
  motorcycle: 'Xe máy',
  car: 'Ô tô',
  ebike: 'Xe đạp điện',
  emotorbike: 'Xe máy điện',
  suv: 'SUV',
  truck: 'Xe tải',
  other: 'Khác',
};
