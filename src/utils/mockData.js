/**
 * Mock data for development and testing
 */

import { EQUIPMENT_STATUS, EQUIPMENT_CATEGORIES } from '../types/equipment';
import { RESERVATION_STATUS } from '../types/reservation';

// Mock equipment data
export const mockEquipment = [
  {
    id: 'eq1',
    name: 'MacBook Pro 16"',
    category: EQUIPMENT_CATEGORIES.LAPTOP,
    brand: 'Apple',
    model: 'MacBook Pro',
    serialNumber: 'MBP001',
    description: 'MacBook Pro 16 นิ้ว สำหรับงานกราฟิกและการพัฒนา',
    imageURL: null,
    status: EQUIPMENT_STATUS.AVAILABLE,
    location: 'ห้องคอมพิวเตอร์ A',
    purchaseDate: new Date('2023-01-15'),
    warrantyExpiry: new Date('2026-01-15'),
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    createdBy: 'admin'
  },
  {
    id: 'eq2',
    name: 'Dell XPS 13',
    category: EQUIPMENT_CATEGORIES.LAPTOP,
    brand: 'Dell',
    model: 'XPS 13',
    serialNumber: 'DELL001',
    description: 'Dell XPS 13 สำหรับงานทั่วไป',
    imageURL: null,
    status: EQUIPMENT_STATUS.AVAILABLE,
    location: 'ห้องคอมพิวเตอร์ B',
    purchaseDate: new Date('2023-02-10'),
    warrantyExpiry: new Date('2026-02-10'),
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-02-10'),
    createdBy: 'admin'
  },
  {
    id: 'eq3',
    name: 'iPad Pro 12.9"',
    category: EQUIPMENT_CATEGORIES.TABLET,
    brand: 'Apple',
    model: 'iPad Pro',
    serialNumber: 'IPAD001',
    description: 'iPad Pro สำหรับงานออกแบบและนำเสนอ',
    imageURL: null,
    status: EQUIPMENT_STATUS.BORROWED,
    location: 'ห้องประชุม A',
    purchaseDate: new Date('2023-03-05'),
    warrantyExpiry: new Date('2026-03-05'),
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-05'),
    createdBy: 'admin'
  },
  {
    id: 'eq4',
    name: 'Canon EOS R5',
    category: EQUIPMENT_CATEGORIES.CAMERA,
    brand: 'Canon',
    model: 'EOS R5',
    serialNumber: 'CAM001',
    description: 'กล้อง Canon EOS R5 สำหรับงานถ่ายภาพ',
    imageURL: null,
    status: EQUIPMENT_STATUS.AVAILABLE,
    location: 'ห้องสื่อ',
    purchaseDate: new Date('2023-04-20'),
    warrantyExpiry: new Date('2026-04-20'),
    createdAt: new Date('2023-04-20'),
    updatedAt: new Date('2023-04-20'),
    createdBy: 'admin'
  },
  {
    id: 'eq5',
    name: 'Epson Projector',
    category: EQUIPMENT_CATEGORIES.PROJECTOR,
    brand: 'Epson',
    model: 'EB-X41',
    serialNumber: 'PROJ001',
    description: 'โปรเจคเตอร์ Epson สำหรับการนำเสนอ',
    imageURL: null,
    status: EQUIPMENT_STATUS.AVAILABLE,
    location: 'ห้องประชุม B',
    purchaseDate: new Date('2023-05-15'),
    warrantyExpiry: new Date('2026-05-15'),
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-05-15'),
    createdBy: 'admin'
  }
];

// Mock user data
export const mockUsers = [
  {
    uid: 'user1',
    email: 'john.doe@example.com',
    displayName: 'John Doe',
    photoURL: null,
    role: 'user',
    department: 'IT',
    position: 'Developer',
    phone: '081-234-5678',
    isApproved: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    uid: 'admin1',
    email: 'admin@example.com',
    displayName: 'Admin User',
    photoURL: null,
    role: 'admin',
    department: 'IT',
    position: 'System Administrator',
    phone: '081-987-6543',
    isApproved: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
];

// Mock reservations data
export const mockReservations = [
  {
    id: 'res1',
    equipmentId: 'eq1',
    userId: 'user1',
    reservationDate: new Date(),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(11, 0, 0, 0)),
    purpose: 'ใช้สำหรับการพัฒนาแอปพลิเคชัน',
    notes: 'ต้องการใช้ในห้องประชุม A',
    status: RESERVATION_STATUS.APPROVED,
    approvedBy: 'admin1',
    approvedAt: new Date(),
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'res2',
    equipmentId: 'eq4',
    userId: 'user1',
    reservationDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    startTime: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(14, 0, 0, 0),
    endTime: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(16, 0, 0, 0),
    purpose: 'ถ่ายภาพงานกิจกรรม',
    notes: 'ต้องการเลนส์เพิ่มเติม',
    status: RESERVATION_STATUS.PENDING,
    approvedBy: null,
    approvedAt: null,
    notificationSent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Initialize mock data in development mode
 */
export const initializeMockData = async () => {
  if (process.env.NODE_ENV !== 'development' || process.env.REACT_APP_USE_EMULATOR !== 'true') {
    return;
  }

  try {
    // This would typically seed the emulator with mock data
    // For now, we'll just log that mock data is available
    console.log('🎭 Mock data initialized:', {
      equipment: mockEquipment.length,
      users: mockUsers.length,
      reservations: mockReservations.length
    });
  } catch (error) {
    console.error('Failed to initialize mock data:', error);
  }
};

const mockData = {
  mockEquipment,
  mockUsers,
  mockReservations,
  initializeMockData
};

export default mockData;