import QRCode from 'qrcode';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

class QRCodeService {
  static STORAGE_PATH = 'qr-codes';
  static QR_CODE_SIZE = 256;
  static QR_CODE_QUALITY = 0.9;

  /**
   * Generate QR code for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Object} equipmentData - Equipment data
   * @returns {Promise<Object>} QR code data
   */
  static async generateQRCode(equipmentId, equipmentData) {
    try {
      // Create QR code data
      const qrData = {
        type: 'equipment',
        id: equipmentId,
        equipmentNumber: equipmentData.equipmentNumber,
        name: equipmentData.name,
        url: `${window.location.origin}/equipment/${equipmentId}`,
        generatedAt: new Date().toISOString()
      };

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: this.QR_CODE_SIZE,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Convert data URL to blob
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const fileName = `${equipmentData.equipmentNumber}_${equipmentId}.png`;
      const storageRef = ref(storage, `${this.STORAGE_PATH}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // Update equipment document with QR code info
      const equipmentRef = doc(db, 'equipmentManagement', equipmentId);
      const qrCodeInfo = {
        url: downloadUrl,
        data: qrData,
        generatedAt: serverTimestamp()
      };

      await updateDoc(equipmentRef, {
        qrCode: qrCodeInfo,
        updatedAt: serverTimestamp()
      });

      return {
        ...qrCodeInfo,
        dataUrl: qrCodeDataUrl,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('ไม่สามารถสร้าง QR Code ได้');
    }
  }

  /**
   * Generate QR codes for multiple equipment (bulk operation)
   * @param {Array<Object>} equipmentList - List of equipment objects
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Array of QR code results
   */
  static async generateBulkQRCodes(equipmentList, onProgress = null) {
    try {
      const results = [];
      const total = equipmentList.length;

      for (let i = 0; i < equipmentList.length; i++) {
        const equipment = equipmentList[i];
        
        try {
          const qrCodeResult = await this.generateQRCode(equipment.id, equipment);
          results.push({
            equipmentId: equipment.id,
            equipmentNumber: equipment.equipmentNumber,
            success: true,
            qrCode: qrCodeResult
          });
        } catch (error) {
          console.error(`Error generating QR code for ${equipment.equipmentNumber}:`, error);
          results.push({
            equipmentId: equipment.id,
            equipmentNumber: equipment.equipmentNumber,
            success: false,
            error: error.message
          });
        }

        // Report progress
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100)
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk QR code generation:', error);
      throw error;
    }
  }

  /**
   * Regenerate QR code for equipment
   * @param {string} equipmentId - Equipment ID
   * @param {Object} equipmentData - Equipment data
   * @returns {Promise<Object>} New QR code data
   */
  static async regenerateQRCode(equipmentId, equipmentData) {
    try {
      // Delete old QR code if exists
      if (equipmentData.qrCode?.url) {
        await this.deleteQRCode(equipmentData.qrCode.url);
      }

      // Generate new QR code
      return await this.generateQRCode(equipmentId, equipmentData);
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      throw error;
    }
  }

  /**
   * Delete QR code from storage
   * @param {string} qrCodeUrl - QR code URL
   * @returns {Promise<boolean>} Success status
   */
  static async deleteQRCode(qrCodeUrl) {
    try {
      const storageRef = this.getStorageRefFromUrl(qrCodeUrl);
      if (storageRef) {
        const { deleteObject } = await import('firebase/storage');
        await deleteObject(storageRef);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting QR code:', error);
      return false;
    }
  }

  /**
   * Parse QR code data
   * @param {string} qrCodeData - QR code data string
   * @returns {Object|null} Parsed QR code data
   */
  static parseQRCodeData(qrCodeData) {
    try {
      const data = JSON.parse(qrCodeData);
      
      // Validate QR code structure
      if (data.type === 'equipment' && data.id && data.equipmentNumber) {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  /**
   * Validate QR code data
   * @param {Object} qrData - QR code data
   * @returns {boolean} Is valid
   */
  static validateQRCodeData(qrData) {
    return (
      qrData &&
      qrData.type === 'equipment' &&
      qrData.id &&
      qrData.equipmentNumber &&
      qrData.url
    );
  }

  /**
   * Get storage reference from URL
   * @param {string} url - Storage URL
   * @returns {Object|null} Storage reference
   */
  static getStorageRefFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) return null;
      
      const filePath = decodeURIComponent(pathMatch[1]);
      return ref(storage, filePath);
    } catch (error) {
      console.error('Error getting storage ref from URL:', error);
      return null;
    }
  }

  /**
   * Generate QR code as canvas element (for display purposes)
   * @param {Object} qrData - QR code data
   * @param {Object} options - QR code options
   * @returns {Promise<HTMLCanvasElement>} Canvas element
   */
  static async generateQRCodeCanvas(qrData, options = {}) {
    try {
      const canvas = document.createElement('canvas');
      
      await QRCode.toCanvas(canvas, JSON.stringify(qrData), {
        width: options.width || this.QR_CODE_SIZE,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      });

      return canvas;
    } catch (error) {
      console.error('Error generating QR code canvas:', error);
      throw error;
    }
  }

  /**
   * Download QR code as image
   * @param {Object} qrData - QR code data
   * @param {string} filename - Download filename
   * @param {Object} options - QR code options
   */
  static async downloadQRCode(qrData, filename, options = {}) {
    try {
      const canvas = await this.generateQRCodeCanvas(qrData, options);
      
      // Create download link
      const link = document.createElement('a');
      link.download = filename || `QR_${qrData.equipmentNumber}.png`;
      link.href = canvas.toDataURL('image/png', this.QR_CODE_QUALITY);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for printing (high resolution)
   * @param {Object} qrData - QR code data
   * @param {Object} options - Print options
   * @returns {Promise<string>} High resolution data URL
   */
  static async generatePrintQRCode(qrData, options = {}) {
    try {
      const printSize = options.size || 512; // Higher resolution for printing
      
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: printSize,
        margin: options.margin || 4,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction for printing
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating print QR code:', error);
      throw error;
    }
  }
}

export default QRCodeService;