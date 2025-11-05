import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportModal from '../ExportModal';
import ReportGenerator from '../ReportGenerator';
import EquipmentExportService from '../../../services/equipmentExportService';
import EquipmentReportService from '../../../services/equipmentReportService';

// Mock the services
jest.mock('../../../services/equipmentExportService');
jest.mock('../../../services/equipmentReportService');

// Mock the external libraries
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    internal: {
      getNumberOfPages: jest.fn(() => 1),
      pageSize: { width: 210, height: 297 }
    },
    setPage: jest.fn()
  }));
});

describe('Export and Report System', () => {
  const mockEquipment = [
    {
      id: '1',
      equipmentNumber: 'EQ001',
      name: 'Test Equipment 1',
      category: { name: 'Computer' },
      brand: 'Test Brand',
      model: 'Test Model',
      status: 'active',
      purchasePrice: 10000,
      purchaseDate: new Date('2023-01-01'),
      location: { building: 'Building A', room: 'Room 101' }
    },
    {
      id: '2',
      equipmentNumber: 'EQ002',
      name: 'Test Equipment 2',
      category: { name: 'Printer' },
      brand: 'Test Brand 2',
      model: 'Test Model 2',
      status: 'maintenance',
      purchasePrice: 5000,
      purchaseDate: new Date('2023-02-01'),
      location: { building: 'Building B', room: 'Room 201' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ExportModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      equipment: mockEquipment,
      onExport: jest.fn(),
      exportTemplates: []
    };

    test('renders export modal when open', () => {
      render(<ExportModal {...defaultProps} />);
      
      expect(screen.getByText('ส่งออกข้อมูลอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('รูปแบบการส่งออก')).toBeInTheDocument();
    });

    test('shows export format options', () => {
      render(<ExportModal {...defaultProps} />);
      
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });

    test('shows field selection options', () => {
      render(<ExportModal {...defaultProps} />);
      
      expect(screen.getByText('เลือกฟิลด์ที่ต้องการส่งออก')).toBeInTheDocument();
      expect(screen.getByText('หมายเลขครุภัณฑ์')).toBeInTheDocument();
      expect(screen.getByText('ชื่ออุปกรณ์')).toBeInTheDocument();
    });

    test('calls onExport when export button is clicked', async () => {
      const mockOnExport = jest.fn();
      render(<ExportModal {...defaultProps} onExport={mockOnExport} />);
      
      const exportButton = screen.getByText('ส่งออกข้อมูล');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'export',
            format: 'excel',
            equipment: mockEquipment
          })
        );
      });
    });

    test('shows equipment summary', () => {
      render(<ExportModal {...defaultProps} />);
      
      expect(screen.getByText('สรุปการส่งออก')).toBeInTheDocument();
      expect(screen.getByText('จำนวนอุปกรณ์: 2 รายการ')).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(<ExportModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('ส่งออกข้อมูลอุปกรณ์')).not.toBeInTheDocument();
    });
  });

  describe('ReportGenerator', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onGenerate: jest.fn()
    };

    beforeEach(() => {
      EquipmentReportService.getPredefinedTemplates.mockReturnValue([
        {
          id: 'inventory_summary',
          name: 'สรุปภาพรวมอุปกรณ์',
          description: 'รายงานสรุปจำนวนและมูลค่าอุปกรณ์ทั้งหมด',
          type: 'inventory'
        }
      ]);

      EquipmentReportService.getUserReportTemplates.mockResolvedValue([]);
    });

    test('renders report generator when open', () => {
      render(<ReportGenerator {...defaultProps} />);
      
      expect(screen.getByText('สร้างรายงานอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('เลือกประเภทรายงาน')).toBeInTheDocument();
    });

    test('shows predefined templates', () => {
      render(<ReportGenerator {...defaultProps} />);
      
      expect(screen.getByText('รายงานมาตรฐาน')).toBeInTheDocument();
      expect(screen.getByText('สรุปภาพรวมอุปกรณ์')).toBeInTheDocument();
    });

    test('shows custom report builder when toggled', () => {
      render(<ReportGenerator {...defaultProps} />);
      
      const customButton = screen.getByText('สร้างแบบกำหนดเอง');
      fireEvent.click(customButton);
      
      expect(screen.getByText('ชื่อรายงาน')).toBeInTheDocument();
      expect(screen.getByText('เลือกฟิลด์ที่ต้องการ')).toBeInTheDocument();
    });

    test('calls onGenerate when report is generated', async () => {
      const mockOnGenerate = jest.fn();
      const mockReport = {
        reportType: 'inventory',
        summary: { totalEquipment: 2 },
        equipment: mockEquipment
      };

      EquipmentReportService.generateInventoryReport.mockResolvedValue(mockReport);

      render(<ReportGenerator {...defaultProps} onGenerate={mockOnGenerate} />);
      
      // Select a template
      const templateRadio = screen.getByDisplayValue('inventory_summary');
      fireEvent.click(templateRadio);
      
      // Generate report
      const generateButton = screen.getByText('สร้างรายงาน');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(EquipmentReportService.generateInventoryReport).toHaveBeenCalled();
        expect(mockOnGenerate).toHaveBeenCalledWith(mockReport);
      });
    });

    test('does not render when closed', () => {
      render(<ReportGenerator {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('สร้างรายงานอุปกรณ์')).not.toBeInTheDocument();
    });
  });

  describe('Export Service', () => {
    test('prepares data for export correctly', () => {
      const fields = ['equipmentNumber', 'name', 'category.name'];
      const result = EquipmentExportService.prepareDataForExport(mockEquipment, fields);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('หมายเลขครุภัณฑ์', 'EQ001');
      expect(result[0]).toHaveProperty('ชื่ออุปกรณ์', 'Test Equipment 1');
      expect(result[0]).toHaveProperty('ประเภท', 'Computer');
    });

    test('gets field value using dot notation', () => {
      const item = mockEquipment[0];
      
      expect(EquipmentExportService.getFieldValue(item, 'name')).toBe('Test Equipment 1');
      expect(EquipmentExportService.getFieldValue(item, 'category.name')).toBe('Computer');
      expect(EquipmentExportService.getFieldValue(item, 'location.building')).toBe('Building A');
    });

    test('converts data to CSV format', () => {
      const data = [
        { 'Name': 'Test 1', 'Value': 100 },
        { 'Name': 'Test 2', 'Value': 200 }
      ];
      
      const csv = EquipmentExportService.convertToCSV(data);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Name,Value');
      expect(lines[1]).toBe('Test 1,100');
      expect(lines[2]).toBe('Test 2,200');
    });
  });

  describe('Report Service', () => {
    test('calculates inventory statistics correctly', () => {
      const stats = EquipmentReportService.calculateInventoryStats(mockEquipment);
      
      expect(stats.active).toBe(1);
      expect(stats.maintenance).toBe(1);
      expect(stats.retired).toBe(0);
      expect(stats.lost).toBe(0);
    });

    test('calculates value statistics correctly', () => {
      const stats = EquipmentReportService.calculateValueStats(mockEquipment);
      
      expect(stats.totalValue).toBe(15000);
      expect(stats.averageValue).toBe(7500);
      expect(stats.minValue).toBe(5000);
      expect(stats.maxValue).toBe(10000);
    });

    test('groups equipment by category', () => {
      const grouped = EquipmentReportService.groupEquipmentByCategory(mockEquipment);
      
      expect(grouped).toHaveProperty('Computer');
      expect(grouped).toHaveProperty('Printer');
      expect(grouped.Computer.count).toBe(1);
      expect(grouped.Printer.count).toBe(1);
    });

    test('gets predefined templates', () => {
      const templates = EquipmentReportService.getPredefinedTemplates();
      
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('type');
    });
  });
});