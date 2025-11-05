import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class EquipmentExportService {
  static TEMPLATES_COLLECTION = 'equipmentExportTemplates';

  /**
   * Export equipment data to Excel format
   * @param {Array} equipment - Equipment data array
   * @param {Array} fields - Selected fields to export
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static async exportToExcel(equipment, fields, options = {}) {
    try {
      const { filename = 'equipment_export' } = options;
      
      // Prepare data for Excel
      const excelData = this.prepareDataForExport(equipment, fields);
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = this.calculateColumnWidths(excelData, fields);
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'อุปกรณ์');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}_${timestamp}.xlsx`;
      
      // Save file
      XLSX.writeFile(workbook, finalFilename);
      
      return { success: true, filename: finalFilename };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    }
  }

  /**
   * Export equipment data to PDF format
   * @param {Array} equipment - Equipment data array
   * @param {Array} fields - Selected fields to export
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static async exportToPDF(equipment, fields, options = {}) {
    try {
      const { 
        filename = 'equipment_export',
        includeImages = false,
        orientation = 'landscape'
      } = options;
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      // Add Thai font support (if available)
      this.setupPDFFont(doc);
      
      // Add header
      this.addPDFHeader(doc, equipment.length);
      
      // Prepare data for PDF table
      const tableData = this.prepareDataForPDF(equipment, fields);
      const headers = this.getFieldLabels(fields);
      
      // Add table
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: this.getPDFColumnStyles(fields),
        margin: { top: 10, right: 10, bottom: 10, left: 10 }
      });
      
      // Add images if requested
      if (includeImages) {
        await this.addImagesToPDF(doc, equipment);
      }
      
      // Add footer
      this.addPDFFooter(doc);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}_${timestamp}.pdf`;
      
      // Save file
      doc.save(finalFilename);
      
      return { success: true, filename: finalFilename };
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกไฟล์ PDF');
    }
  }

  /**
   * Export equipment data to CSV format
   * @param {Array} equipment - Equipment data array
   * @param {Array} fields - Selected fields to export
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  static async exportToCSV(equipment, fields, options = {}) {
    try {
      const { filename = 'equipment_export' } = options;
      
      // Prepare data for CSV
      const csvData = this.prepareDataForExport(equipment, fields);
      
      // Convert to CSV format
      const csvContent = this.convertToCSV(csvData);
      
      // Create and download file
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}_${timestamp}.csv`;
      
      this.downloadFile(csvContent, finalFilename, 'text/csv;charset=utf-8;');
      
      return { success: true, filename: finalFilename };
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
    }
  }

  /**
   * Prepare equipment data for export
   * @param {Array} equipment - Equipment data array
   * @param {Array} fields - Selected fields to export
   * @returns {Array} Prepared data array
   */
  static prepareDataForExport(equipment, fields) {
    return equipment.map(item => {
      const exportItem = {};
      
      fields.forEach(fieldKey => {
        const label = this.getFieldLabel(fieldKey);
        const value = this.getFieldValue(item, fieldKey);
        exportItem[label] = value;
      });
      
      return exportItem;
    });
  }

  /**
   * Prepare equipment data for PDF table
   * @param {Array} equipment - Equipment data array
   * @param {Array} fields - Selected fields to export
   * @returns {Array} Prepared data array for PDF table
   */
  static prepareDataForPDF(equipment, fields) {
    return equipment.map(item => {
      return fields.map(fieldKey => {
        const value = this.getFieldValue(item, fieldKey);
        return this.formatValueForPDF(value);
      });
    });
  }

  /**
   * Get field value from equipment object using dot notation
   * @param {Object} item - Equipment item
   * @param {string} fieldKey - Field key (supports dot notation)
   * @returns {any} Field value
   */
  static getFieldValue(item, fieldKey) {
    try {
      return fieldKey.split('.').reduce((obj, key) => obj?.[key], item) || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Get field label for display
   * @param {string} fieldKey - Field key
   * @returns {string} Field label
   */
  static getFieldLabel(fieldKey) {
    const fieldLabels = {
      'equipmentNumber': 'หมายเลขครุภัณฑ์',
      'name': 'ชื่ออุปกรณ์',
      'category.name': 'ประเภท',
      'brand': 'ยี่ห้อ',
      'model': 'รุ่น',
      'status': 'สถานะ',
      'location.building': 'อาคาร',
      'location.floor': 'ชั้น',
      'location.room': 'ห้อง',
      'location.description': 'รายละเอียดสถานที่',
      'purchaseDate': 'วันที่ซื้อ',
      'purchasePrice': 'ราคาซื้อ',
      'vendor': 'ผู้จำหน่าย',
      'warrantyExpiry': 'วันหมดประกัน',
      'responsiblePerson.name': 'ผู้รับผิดชอบ',
      'responsiblePerson.email': 'อีเมลผู้รับผิดชอบ',
      'responsiblePerson.department': 'สังกัดผู้รับผิดชอบ',
      'description': 'รายละเอียด',
      'notes': 'หมายเหตุ',
      'createdAt': 'วันที่สร้าง',
      'updatedAt': 'วันที่แก้ไขล่าสุด',
      'viewCount': 'จำนวนครั้งที่ดู'
    };
    
    return fieldLabels[fieldKey] || fieldKey;
  }

  /**
   * Get field labels array
   * @param {Array} fields - Field keys array
   * @returns {Array} Field labels array
   */
  static getFieldLabels(fields) {
    return fields.map(fieldKey => this.getFieldLabel(fieldKey));
  }

  /**
   * Format value for PDF display
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  static formatValueForPDF(value) {
    if (value === null || value === undefined) return '';
    
    if (value instanceof Date) {
      return value.toLocaleDateString('th-TH');
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('th-TH');
    }
    
    if (typeof value === 'object' && value.toDate) {
      // Firestore timestamp
      return value.toDate().toLocaleDateString('th-TH');
    }
    
    return String(value);
  }

  /**
   * Convert data array to CSV format
   * @param {Array} data - Data array
   * @returns {string} CSV content
   */
  static convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Calculate column widths for Excel
   * @param {Array} data - Data array
   * @param {Array} fields - Field keys
   * @returns {Array} Column width configuration
   */
  static calculateColumnWidths(data, fields) {
    return fields.map(fieldKey => {
      const label = this.getFieldLabel(fieldKey);
      let maxLength = label.length;
      
      data.forEach(row => {
        const value = String(row[label] || '');
        maxLength = Math.max(maxLength, value.length);
      });
      
      return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
  }

  /**
   * Get PDF column styles
   * @param {Array} fields - Field keys
   * @returns {Object} Column styles configuration
   */
  static getPDFColumnStyles(fields) {
    const styles = {};
    
    fields.forEach((fieldKey, index) => {
      if (fieldKey === 'purchasePrice') {
        styles[index] = { halign: 'right' };
      } else if (fieldKey.includes('Date')) {
        styles[index] = { halign: 'center' };
      }
    });
    
    return styles;
  }

  /**
   * Setup PDF font for Thai language support
   * @param {Object} doc - jsPDF document
   */
  static setupPDFFont(doc) {
    // This would require adding Thai font files
    // For now, we'll use the default font
    doc.setFont('helvetica');
  }

  /**
   * Add header to PDF
   * @param {Object} doc - jsPDF document
   * @param {number} totalItems - Total number of items
   */
  static addPDFHeader(doc, totalItems) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('รายงานข้อมูลอุปกรณ์', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 20, 30);
    doc.text(`จำนวนอุปกรณ์ทั้งหมด: ${totalItems.toLocaleString('th-TH')} รายการ`, 20, 35);
  }

  /**
   * Add footer to PDF
   * @param {Object} doc - jsPDF document
   */
  static addPDFFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `หน้า ${i} จาก ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
  }

  /**
   * Add images to PDF (placeholder implementation)
   * @param {Object} doc - jsPDF document
   * @param {Array} equipment - Equipment data with images
   */
  static async addImagesToPDF(doc, equipment) {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Load images from URLs
    // 2. Add new pages for images
    // 3. Resize and position images appropriately
    
    const equipmentWithImages = equipment.filter(item => 
      item.images && item.images.length > 0
    );
    
    if (equipmentWithImages.length === 0) return;
    
    // Add a new page for images
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('รูปภาพอุปกรณ์', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`พบรูปภาพจำนวน ${equipmentWithImages.length} อุปกรณ์`, 20, 30);
    doc.text('หมายเหตุ: การแสดงรูปภาพในรายงาน PDF ยังอยู่ในระหว่างการพัฒนา', 20, 40);
  }

  /**
   * Download file as blob
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Save export template
   * @param {Object} template - Template data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Saved template with ID
   */
  static async saveExportTemplate(template, userId) {
    try {
      const templateData = {
        name: template.name.trim(),
        description: template.description?.trim() || '',
        fields: template.fields,
        includeImages: template.includeImages || false,
        createdBy: userId,
        createdAt: serverTimestamp(),
        isPublic: false,
        usageCount: 0
      };

      const docRef = await addDoc(collection(db, this.TEMPLATES_COLLECTION), templateData);
      
      return {
        id: docRef.id,
        ...templateData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error saving export template:', error);
      throw new Error('เกิดข้อผิดพลาดในการบันทึก template');
    }
  }

  /**
   * Get export templates for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of templates
   */
  static async getExportTemplates(userId) {
    try {
      const templatesRef = collection(db, this.TEMPLATES_COLLECTION);
      const q = query(
        templatesRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return templates;
    } catch (error) {
      console.error('Error getting export templates:', error);
      throw new Error('เกิดข้อผิดพลาดในการโหลด templates');
    }
  }

  /**
   * Get public export templates
   * @returns {Promise<Array>} Array of public templates
   */
  static async getPublicExportTemplates() {
    try {
      const templatesRef = collection(db, this.TEMPLATES_COLLECTION);
      const q = query(
        templatesRef,
        where('isPublic', '==', true),
        orderBy('usageCount', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return templates;
    } catch (error) {
      console.error('Error getting public export templates:', error);
      return [];
    }
  }

  /**
   * Main export function that handles all formats
   * @param {Object} exportConfig - Export configuration
   * @returns {Promise<Object>} Export result
   */
  static async exportEquipment(exportConfig) {
    const {
      format,
      equipment,
      fields,
      includeImages = false,
      filename = 'equipment_export'
    } = exportConfig;

    const options = {
      filename,
      includeImages
    };

    switch (format.toLowerCase()) {
      case 'excel':
        return await this.exportToExcel(equipment, fields, options);
      
      case 'pdf':
        return await this.exportToPDF(equipment, fields, options);
      
      case 'csv':
        return await this.exportToCSV(equipment, fields, options);
      
      default:
        throw new Error(`รูปแบบการส่งออก "${format}" ไม่รองรับ`);
    }
  }
}

export default EquipmentExportService;