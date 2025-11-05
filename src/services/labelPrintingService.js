import QRCodeService from './qrCodeService';

class LabelPrintingService {
  static LABEL_TEMPLATES = {
    standard: {
      id: 'standard',
      name: 'ป้ายมาตรฐาน',
      width: 89, // mm
      height: 36, // mm
      elements: [
        { type: 'qr', x: 5, y: 5, size: 26 },
        { type: 'text', x: 35, y: 8, fontSize: 12, fontWeight: 'bold', field: 'equipmentNumber' },
        { type: 'text', x: 35, y: 18, fontSize: 10, field: 'name', maxLength: 25 },
        { type: 'text', x: 35, y: 28, fontSize: 8, field: 'location', color: '#666' }
      ]
    },
    compact: {
      id: 'compact',
      name: 'ป้ายขนาดเล็ก',
      width: 50, // mm
      height: 25, // mm
      elements: [
        { type: 'qr', x: 2, y: 2, size: 21 },
        { type: 'text', x: 25, y: 8, fontSize: 10, fontWeight: 'bold', field: 'equipmentNumber' },
        { type: 'text', x: 25, y: 18, fontSize: 8, field: 'name', maxLength: 15 }
      ]
    },
    detailed: {
      id: 'detailed',
      name: 'ป้ายรายละเอียด',
      width: 100, // mm
      height: 50, // mm
      elements: [
        { type: 'qr', x: 5, y: 5, size: 30 },
        { type: 'text', x: 40, y: 8, fontSize: 14, fontWeight: 'bold', field: 'equipmentNumber' },
        { type: 'text', x: 40, y: 18, fontSize: 11, field: 'name', maxLength: 30 },
        { type: 'text', x: 40, y: 28, fontSize: 9, field: 'brand', color: '#666' },
        { type: 'text', x: 40, y: 38, fontSize: 9, field: 'model', color: '#666' },
        { type: 'text', x: 5, y: 45, fontSize: 8, field: 'location', color: '#888' }
      ]
    },
    qrOnly: {
      id: 'qrOnly',
      name: 'QR Code เท่านั้น',
      width: 30, // mm
      height: 30, // mm
      elements: [
        { type: 'qr', x: 2, y: 2, size: 26 }
      ]
    }
  };

  static PAPER_SIZES = {
    a4: { width: 210, height: 297, name: 'A4' },
    letter: { width: 216, height: 279, name: 'Letter' },
    label: { width: 100, height: 150, name: 'Label Sheet' }
  };

  /**
   * Generate label for single equipment
   * @param {Object} equipment - Equipment data
   * @param {string} templateId - Template ID
   * @param {Object} options - Print options
   * @returns {Promise<string>} Label HTML
   */
  static async generateLabel(equipment, templateId = 'standard', options = {}) {
    try {
      const template = this.LABEL_TEMPLATES[templateId];
      if (!template) {
        throw new Error('ไม่พบเทมเพลตที่ระบุ');
      }

      // Generate QR code if needed
      let qrCodeDataUrl = null;
      const hasQRElement = template.elements.some(el => el.type === 'qr');
      
      if (hasQRElement) {
        if (equipment.qrCode?.dataUrl) {
          qrCodeDataUrl = equipment.qrCode.dataUrl;
        } else {
          // Generate QR code data
          const qrData = {
            type: 'equipment',
            id: equipment.id,
            equipmentNumber: equipment.equipmentNumber,
            name: equipment.name,
            url: `${window.location.origin}/equipment/${equipment.id}`,
            generatedAt: new Date().toISOString()
          };
          qrCodeDataUrl = await QRCodeService.generatePrintQRCode(qrData, {
            size: 256,
            margin: 1
          });
        }
      }

      // Generate label HTML
      const labelHtml = this.generateLabelHTML(equipment, template, qrCodeDataUrl, options);
      
      return labelHtml;
    } catch (error) {
      console.error('Error generating label:', error);
      throw error;
    }
  }

  /**
   * Generate labels for multiple equipment
   * @param {Array<Object>} equipmentList - List of equipment
   * @param {string} templateId - Template ID
   * @param {Object} options - Print options
   * @returns {Promise<string>} Labels HTML
   */
  static async generateBulkLabels(equipmentList, templateId = 'standard', options = {}) {
    try {
      const template = this.LABEL_TEMPLATES[templateId];
      if (!template) {
        throw new Error('ไม่พบเทมเพลตที่ระบุ');
      }

      const {
        paperSize = 'a4',
        labelsPerRow = 3,
        labelSpacing = 5,
        pageMargin = 10
      } = options;

      const paper = this.PAPER_SIZES[paperSize];
      if (!paper) {
        throw new Error('ไม่พบขนาดกระดาษที่ระบุ');
      }

      // Calculate layout
      const availableWidth = paper.width - (pageMargin * 2);
      const availableHeight = paper.height - (pageMargin * 2);
      const labelWidth = template.width;
      const labelHeight = template.height;
      
      const actualLabelsPerRow = Math.min(labelsPerRow, Math.floor(availableWidth / (labelWidth + labelSpacing)));
      const labelsPerColumn = Math.floor(availableHeight / (labelHeight + labelSpacing));
      const labelsPerPage = actualLabelsPerRow * labelsPerColumn;

      // Generate labels
      const labelPromises = equipmentList.map(equipment => 
        this.generateLabel(equipment, templateId, options)
      );
      
      const labels = await Promise.all(labelPromises);

      // Create pages
      const pages = [];
      for (let i = 0; i < labels.length; i += labelsPerPage) {
        const pageLabels = labels.slice(i, i + labelsPerPage);
        const pageHtml = this.generatePageHTML(pageLabels, template, {
          ...options,
          paperSize: paper,
          labelsPerRow: actualLabelsPerRow,
          labelSpacing,
          pageMargin
        });
        pages.push(pageHtml);
      }

      return this.generateDocumentHTML(pages, options);
    } catch (error) {
      console.error('Error generating bulk labels:', error);
      throw error;
    }
  }

  /**
   * Generate label HTML for single equipment
   * @param {Object} equipment - Equipment data
   * @param {Object} template - Label template
   * @param {string} qrCodeDataUrl - QR code data URL
   * @param {Object} options - Options
   * @returns {string} Label HTML
   */
  static generateLabelHTML(equipment, template, qrCodeDataUrl, options = {}) {
    const { width, height, elements } = template;
    
    let elementsHtml = '';
    
    elements.forEach(element => {
      switch (element.type) {
        case 'qr':
          if (qrCodeDataUrl) {
            elementsHtml += `
              <img 
                src="${qrCodeDataUrl}" 
                style="
                  position: absolute;
                  left: ${element.x}mm;
                  top: ${element.y}mm;
                  width: ${element.size}mm;
                  height: ${element.size}mm;
                  object-fit: contain;
                "
                alt="QR Code"
              />
            `;
          }
          break;
          
        case 'text':
          const text = this.getFieldValue(equipment, element.field, element.maxLength);
          if (text) {
            elementsHtml += `
              <div style="
                position: absolute;
                left: ${element.x}mm;
                top: ${element.y}mm;
                font-size: ${element.fontSize || 10}px;
                font-weight: ${element.fontWeight || 'normal'};
                color: ${element.color || '#000'};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: ${width - element.x - 2}mm;
              ">
                ${this.escapeHtml(text)}
              </div>
            `;
          }
          break;
          
        case 'barcode':
          // Future implementation for barcode
          break;
      }
    });

    return `
      <div class="label" style="
        position: relative;
        width: ${width}mm;
        height: ${height}mm;
        border: 1px solid #ddd;
        background: white;
        page-break-inside: avoid;
        box-sizing: border-box;
      ">
        ${elementsHtml}
      </div>
    `;
  }

  /**
   * Generate page HTML with multiple labels
   * @param {Array<string>} labels - Array of label HTML strings
   * @param {Object} template - Label template
   * @param {Object} options - Layout options
   * @returns {string} Page HTML
   */
  static generatePageHTML(labels, template, options) {
    const {
      paperSize,
      labelsPerRow,
      labelSpacing,
      pageMargin
    } = options;

    let labelsHtml = '';
    let currentRow = '';
    
    labels.forEach((label, index) => {
      currentRow += `
        <div style="
          display: inline-block;
          margin-right: ${labelSpacing}mm;
          margin-bottom: ${labelSpacing}mm;
          vertical-align: top;
        ">
          ${label}
        </div>
      `;
      
      if ((index + 1) % labelsPerRow === 0 || index === labels.length - 1) {
        labelsHtml += `<div style="line-height: 0;">${currentRow}</div>`;
        currentRow = '';
      }
    });

    return `
      <div class="page" style="
        width: ${paperSize.width}mm;
        height: ${paperSize.height}mm;
        padding: ${pageMargin}mm;
        page-break-after: always;
        box-sizing: border-box;
      ">
        ${labelsHtml}
      </div>
    `;
  }

  /**
   * Generate complete document HTML
   * @param {Array<string>} pages - Array of page HTML strings
   * @param {Object} options - Document options
   * @returns {string} Complete HTML document
   */
  static generateDocumentHTML(pages, options = {}) {
    const { title = 'Equipment Labels' } = options;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0;
              size: ${options.paperSize?.name || 'A4'};
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .page:last-child {
              page-break-after: avoid;
            }
            
            @media print {
              body { margin: 0; }
              .page { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${pages.join('')}
        </body>
      </html>
    `;
  }

  /**
   * Print labels
   * @param {string} labelHtml - Label HTML content
   * @param {Object} options - Print options
   */
  static printLabels(labelHtml, options = {}) {
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต popup');
      }

      printWindow.document.write(labelHtml);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          
          // Close window after printing (optional)
          if (options.autoClose !== false) {
            printWindow.onafterprint = () => {
              printWindow.close();
            };
          }
        }, 500);
      };
    } catch (error) {
      console.error('Error printing labels:', error);
      throw error;
    }
  }

  /**
   * Download labels as HTML file
   * @param {string} labelHtml - Label HTML content
   * @param {string} filename - Download filename
   */
  static downloadLabels(labelHtml, filename = 'equipment-labels.html') {
    try {
      const blob = new Blob([labelHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading labels:', error);
      throw error;
    }
  }

  /**
   * Get field value from equipment data
   * @param {Object} equipment - Equipment data
   * @param {string} field - Field name
   * @param {number} maxLength - Maximum length
   * @returns {string} Field value
   */
  static getFieldValue(equipment, field, maxLength) {
    let value = '';
    
    switch (field) {
      case 'equipmentNumber':
        value = equipment.equipmentNumber || '';
        break;
      case 'name':
        value = equipment.name || '';
        break;
      case 'brand':
        value = equipment.brand || '';
        break;
      case 'model':
        value = equipment.model || '';
        break;
      case 'location':
        if (equipment.location) {
          if (typeof equipment.location === 'string') {
            value = equipment.location;
          } else {
            value = [
              equipment.location.building,
              equipment.location.floor,
              equipment.location.room
            ].filter(Boolean).join(' ');
          }
        }
        break;
      case 'category':
        value = equipment.category?.name || equipment.category || '';
        break;
      case 'status':
        value = equipment.status || '';
        break;
      default:
        value = equipment[field] || '';
    }
    
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength - 3) + '...';
    }
    
    return value;
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get available templates
   * @returns {Array<Object>} Available templates
   */
  static getAvailableTemplates() {
    return Object.values(this.LABEL_TEMPLATES).map(template => ({
      id: template.id,
      name: template.name,
      width: template.width,
      height: template.height,
      preview: this.generateTemplatePreview(template)
    }));
  }

  /**
   * Generate template preview
   * @param {Object} template - Template data
   * @returns {string} Preview HTML
   */
  static generateTemplatePreview(template) {
    const scale = 0.5; // Scale down for preview
    const { width, height, elements } = template;
    
    let elementsHtml = '';
    
    elements.forEach(element => {
      switch (element.type) {
        case 'qr':
          elementsHtml += `
            <div style="
              position: absolute;
              left: ${element.x * scale}mm;
              top: ${element.y * scale}mm;
              width: ${element.size * scale}mm;
              height: ${element.size * scale}mm;
              background: #f0f0f0;
              border: 1px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: #666;
            ">
              QR
            </div>
          `;
          break;
          
        case 'text':
          elementsHtml += `
            <div style="
              position: absolute;
              left: ${element.x * scale}mm;
              top: ${element.y * scale}mm;
              font-size: ${(element.fontSize || 10) * scale}px;
              font-weight: ${element.fontWeight || 'normal'};
              color: ${element.color || '#000'};
              background: rgba(255,255,0,0.1);
              padding: 1px;
            ">
              ${element.field}
            </div>
          `;
          break;
      }
    });

    return `
      <div style="
        position: relative;
        width: ${width * scale}mm;
        height: ${height * scale}mm;
        border: 1px solid #ddd;
        background: white;
        margin: 5px;
      ">
        ${elementsHtml}
      </div>
    `;
  }
}

export default LabelPrintingService;