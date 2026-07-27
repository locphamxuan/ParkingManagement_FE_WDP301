// Danh sách loại xe chuẩn dùng chung cho Manager (tạo VehicleType) và User (gắn biển số).
// - `code`/`name`: dùng khi manager tạo VehicleType của tòa nhà.
// - `plateType`: giá trị enum lưu trên biển số user (khớp User.licensePlates.vehicleType).
export interface VehiclePreset {
  code: string;
  name: string;
  plateType: 'motorcycle' | 'car' | 'ebike' | 'emotorbike' | 'suv' | 'truck';
}

export const VEHICLE_PRESETS: VehiclePreset[] = [
  { code: 'MOTORCYCLE', name: 'Motorcycle', plateType: 'motorcycle' },
  { code: 'CAR', name: 'Car', plateType: 'car' },
  { code: 'EBIKE', name: 'E-bike', plateType: 'ebike' },
  { code: 'EMOTORBIKE', name: 'E-motorbike', plateType: 'emotorbike' },
  { code: 'SUV', name: 'SUV', plateType: 'suv' },
  { code: 'TRUCK', name: 'Truck', plateType: 'truck' },
];

// Nhãn tiếng Việt cho từng giá trị enum của biển số (gồm 'other' = Khác).
export const PLATE_TYPE_LABELS: Record<string, string> = {
  motorcycle: 'Motorcycle',
  car: 'Car',
  ebike: 'E-bike',
  emotorbike: 'E-motorbike',
  suv: 'SUV',
  truck: 'Truck',
  other: 'Other',
};
