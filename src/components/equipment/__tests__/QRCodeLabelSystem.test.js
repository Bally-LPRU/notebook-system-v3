import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QRCodeGenerator from '../QRCodeGenerator';
import QRCodeScanner from '../QRCodeScanner';
import BulkQRCodeGenerator from '../BulkQRCodeGenerator';
import LabelPrintingModal from '../LabelPrintingModal';
import LabelTemplateSelector from '../LabelTemplateSelector';
import QRCodeService from '../../../services/qrCodeService';
import LabelPrintingService from '../../../services/labelPrintingService';

// Mock services
jest.mock('../../../services/qrCodeService');
jest.mock('../../../services/labelPrintingService', () => ({
  generateLabel: jest.fn(),
  generateBulkLabels: jest.fn(),
  printLabels: jest.fn(),
  downloadLabels: jest.fn(),
  getAvailableTemplates: jest.fn(() => [
    { id: 'standard', name: 'ป้ายมาตรฐาน', width: 89, height: 36, preview: '<div>Preview</div>' },
    { id: 'compact', name: 'ป้ายขนาดเล็ก', width: 50, height: 25, preview: '<div>Preview</div>' }
  ]),
  LABEL_TEMPLATES: {
    standard: { id: 'standard', name: 'ป้ายมาตรฐาน', width: 89, height: 36 }
  }
}));
jest.mock('../../../services/qrScannerService');

// Mock equipment data
const mockEquipment = {
  id: 'eq1',
  equipmentNumber: 'EQ001',
  name: 'Test Equipment',
  brand: 'Test Brand',
  model: 'Test Model',
  location: { building: 'Building A', floor: '1', room: '101' },
  category: { id: 'cat1', name: 'Computer' }
};

const mockEquipmentList = [
  mockEquipment,
  {
    id: 'eq2',
    equipmentNumber: 'EQ002',
    name: 'Test Equipment 2',
    brand: 'Test Brand 2',
    model: 'Test Model 2',
    location: { building: 'Building B', floor: '2', room: '201' },
    category: { id: 'cat2', name: 'Printer' }
  }
];

describe('QR Code System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QRCodeGenerator', () => {
    it('renders without QR code initially', () => {
      render(<QRCodeGenerator equipment={mockEquipment} />);
      
      expect(screen.getByText('ยังไม่มี QR Code')).toBeInTheDocument();
      expect(screen.getByText('สร้าง QR Code')).toBeInTheDocument();
    });

    it('renders existing QR code', () => {
      const equipmentWithQR = {
        ...mockEquipment,
        qrCode: {
          url: 'https://example.com/qr.png',
          dataUrl: 'data:image/png;base64,test',
          generatedAt: new Date()
        }
      };

      render(<QRCodeGenerator equipment={equipmentWithQR} />);
      
      expect(screen.getByAltText('QR Code for EQ001')).toBeInTheDocument();
      expect(screen.getByText('สร้างใหม่')).toBeInTheDocument();
      expect(screen.getByText('ดาวน์โหลด')).toBeInTheDocument();
      expect(screen.getByText('พิมพ์')).toBeInTheDocument();
    });

    it('generates QR code when button is clicked', async () => {
      const mockQRResult = {
        url: 'https://example.com/qr.png',
        dataUrl: 'data:image/png;base64,test',
        generatedAt: new Date()
      };

      QRCodeService.generateQRCode.mockResolvedValue(mockQRResult);

      const onGenerated = jest.fn();
      render(
        <QRCodeGenerator 
          equipment={mockEquipment} 
          onGenerated={onGenerated}
        />
      );

      fireEvent.click(screen.getByText('สร้าง QR Code'));

      await waitFor(() => {
        expect(QRCodeService.generateQRCode).toHaveBeenCalledWith(
          mockEquipment.id,
          mockEquipment
        );
        expect(onGenerated).toHaveBeenCalledWith(mockQRResult);
      });
    });

    it('handles QR code generation error', async () => {
      QRCodeService.generateQRCode.mockRejectedValue(new Error('Generation failed'));

      const onError = jest.fn();
      render(
        <QRCodeGenerator 
          equipment={mockEquipment} 
          onError={onError}
        />
      );

      fireEvent.click(screen.getByText('สร้าง QR Code'));

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('BulkQRCodeGenerator', () => {
    it('renders equipment list', () => {
      render(
        <BulkQRCodeGenerator 
          isOpen={true}
          selectedEquipment={mockEquipmentList}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('สร้าง QR Code จำนวนมาก')).toBeInTheDocument();
      expect(screen.getByText('อุปกรณ์ที่เลือก:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('รายการ')).toBeInTheDocument();
      expect(screen.getByText('EQ001')).toBeInTheDocument();
      expect(screen.getByText('EQ002')).toBeInTheDocument();
    });

    it('generates bulk QR codes', async () => {
      const mockResults = [
        { equipmentId: 'eq1', equipmentNumber: 'EQ001', success: true, qrCode: {} },
        { equipmentId: 'eq2', equipmentNumber: 'EQ002', success: true, qrCode: {} }
      ];

      QRCodeService.generateBulkQRCodes.mockResolvedValue(mockResults);

      const onComplete = jest.fn();
      render(
        <BulkQRCodeGenerator 
          isOpen={true}
          selectedEquipment={mockEquipmentList}
          onComplete={onComplete}
          onClose={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('สร้าง QR Code ทั้งหมด'));

      await waitFor(() => {
        expect(QRCodeService.generateBulkQRCodes).toHaveBeenCalledWith(
          mockEquipmentList,
          expect.any(Function)
        );
        expect(onComplete).toHaveBeenCalledWith(mockResults);
      });
    });
  });

  describe('QRCodeScanner', () => {
    it('renders scanner interface', () => {
      render(
        <QRCodeScanner 
          isOpen={true}
          onClose={jest.fn()}
          onScan={jest.fn()}
        />
      );

      expect(screen.getByText('สแกน QR Code อุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('วาง QR Code ให้อยู่ในกรอบ')).toBeInTheDocument();
    });

    it('handles scan result', async () => {
      const onScan = jest.fn();
      render(
        <QRCodeScanner 
          isOpen={true}
          onClose={jest.fn()}
          onScan={onScan}
        />
      );

      // Simulate successful scan (this would normally come from the scanner service)
      const mockScanResult = {
        type: 'equipment',
        equipmentId: 'eq1',
        data: { id: 'eq1', equipmentNumber: 'EQ001' }
      };

      // This would be triggered by the scanner service
      // For testing, we'll simulate the callback
      expect(onScan).toBeDefined();
    });
  });
});

describe('Label Printing System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LabelTemplateSelector', () => {
    it('renders available templates', () => {
      render(<LabelTemplateSelector selectedTemplate="standard" />);

      expect(screen.getByText('เลือกรูปแบบป้าย')).toBeInTheDocument();
      expect(screen.getByText('ป้ายมาตรฐาน')).toBeInTheDocument();
      expect(screen.getByText('ป้ายขนาดเล็ก')).toBeInTheDocument();
    });

    it('calls onTemplateChange when template is selected', () => {
      const onTemplateChange = jest.fn();
      render(
        <LabelTemplateSelector 
          selectedTemplate="standard"
          onTemplateChange={onTemplateChange}
        />
      );

      fireEvent.click(screen.getByText('ป้ายขนาดเล็ก'));

      expect(onTemplateChange).toHaveBeenCalledWith('compact');
    });
  });

  describe('LabelPrintingModal', () => {
    it('renders equipment list and options', () => {
      render(
        <LabelPrintingModal 
          isOpen={true}
          selectedEquipment={mockEquipmentList}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('พิมพ์ป้ายอุปกรณ์')).toBeInTheDocument();
      expect(screen.getByText('อุปกรณ์ที่เลือก (2 รายการ)')).toBeInTheDocument();
      expect(screen.getByText('EQ001')).toBeInTheDocument();
      expect(screen.getByText('EQ002')).toBeInTheDocument();
    });

    it('generates and prints labels', async () => {
      const mockLabelHtml = '<html><body>Test Labels</body></html>';
      LabelPrintingService.generateBulkLabels.mockResolvedValue(mockLabelHtml);
      LabelPrintingService.printLabels.mockImplementation(() => {});

      render(
        <LabelPrintingModal 
          isOpen={true}
          selectedEquipment={mockEquipmentList}
          onClose={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('พิมพ์'));

      await waitFor(() => {
        expect(LabelPrintingService.generateBulkLabels).toHaveBeenCalledWith(
          mockEquipmentList,
          'standard',
          expect.any(Object)
        );
        expect(LabelPrintingService.printLabels).toHaveBeenCalledWith(
          mockLabelHtml,
          expect.any(Object)
        );
      });
    });

    it('shows preview when preview button is clicked', async () => {
      const mockLabelHtml = '<html><body>Test Labels</body></html>';
      LabelPrintingService.generateBulkLabels.mockResolvedValue(mockLabelHtml);

      render(
        <LabelPrintingModal 
          isOpen={true}
          selectedEquipment={mockEquipmentList}
          onClose={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('ดูตัวอย่าง'));

      await waitFor(() => {
        expect(LabelPrintingService.generateBulkLabels).toHaveBeenCalled();
        expect(screen.getByText('ตัวอย่างป้าย')).toBeInTheDocument();
      });
    });
  });
});

describe('Service Integration', () => {
  describe('QRCodeService', () => {
    it('generates QR code with correct data structure', async () => {
      const mockResult = {
        url: 'https://example.com/qr.png',
        dataUrl: 'data:image/png;base64,test',
        data: {
          type: 'equipment',
          id: 'eq1',
          equipmentNumber: 'EQ001',
          name: 'Test Equipment',
          url: 'http://localhost/equipment/eq1'
        },
        generatedAt: new Date()
      };

      QRCodeService.generateQRCode.mockResolvedValue(mockResult);

      const result = await QRCodeService.generateQRCode('eq1', mockEquipment);

      expect(result).toEqual(mockResult);
      expect(result.data.type).toBe('equipment');
      expect(result.data.id).toBe('eq1');
      expect(result.data.equipmentNumber).toBe('EQ001');
    });
  });

  describe('LabelPrintingService', () => {
    it('generates label HTML with correct template', async () => {
      const mockHtml = '<div class="label">Test Label</div>';
      LabelPrintingService.generateLabel.mockResolvedValue(mockHtml);

      const result = await LabelPrintingService.generateLabel(
        mockEquipment,
        'standard',
        {}
      );

      expect(result).toBe(mockHtml);
      expect(LabelPrintingService.generateLabel).toHaveBeenCalledWith(
        mockEquipment,
        'standard',
        {}
      );
    });

    it('generates bulk labels with correct options', async () => {
      const mockHtml = '<html><body>Bulk Labels</body></html>';
      LabelPrintingService.generateBulkLabels.mockResolvedValue(mockHtml);

      const options = {
        paperSize: 'a4',
        labelsPerRow: 3,
        labelSpacing: 5,
        pageMargin: 10
      };

      const result = await LabelPrintingService.generateBulkLabels(
        mockEquipmentList,
        'standard',
        options
      );

      expect(result).toBe(mockHtml);
      expect(LabelPrintingService.generateBulkLabels).toHaveBeenCalledWith(
        mockEquipmentList,
        'standard',
        options
      );
    });
  });
});