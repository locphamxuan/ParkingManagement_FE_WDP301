export interface LegacyModule {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  available: boolean;
}

export const mainFlowModules: LegacyModule[] = [
  {
    id: 'auth',
    title: 'Dang nhap / Dang ky',
    description: 'Vao he thong bang tai khoan ca nhan hoac tao tai khoan moi.',
    actionLabel: 'Mo form',
    available: true,
  },
  {
    id: 'profile',
    title: 'Ho so ca nhan',
    description: 'Xem thong tin tai khoan va trang thai dang nhap.',
    actionLabel: 'Xem ngay',
    available: true,
  },
  {
    id: 'wallet',
    title: 'Vi tien',
    description: 'Xem so du va lich su giao dich trong tuong lai.',
    actionLabel: 'Sap ra mat',
    available: false,
  },
  {
    id: 'buildings',
    title: 'Bai do / Toa nha',
    description: 'Danh sach bai dang hoat dong, tang va cho do xe.',
    actionLabel: 'Sap ra mat',
    available: false,
  },
  {
    id: 'reservations',
    title: 'Dat cho truoc',
    description: 'Dat truoc cho do theo nhu cau cua khach hang.',
    actionLabel: 'Sap ra mat',
    available: false,
  },
  {
    id: 'sessions',
    title: 'Phien gui xe',
    description: 'Theo doi xe vao, xe ra va lich su gui xe.',
    actionLabel: 'Sap ra mat',
    available: false,
  },
  {
    id: 'payments',
    title: 'Thanh toan',
    description: 'Thanh toan phi gui xe va cac goi dich vu.',
    actionLabel: 'Sap ra mat',
    available: false,
  },
  {
    id: 'notifications',
    title: 'Thong bao',
    description: 'Nhan thong bao va nhac viec tu he thong.',
    actionLabel: 'Sap ra mat',
    available: false,
  },
];
