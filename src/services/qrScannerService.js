class QRScannerService {
  static instance = null;
  static stream = null;
  static isScanning = false;

  /**
   * Get singleton instance
   * @returns {QRScannerService} Service instance
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new QRScannerService();
    }
    return this.instance;
  }

  /**
   * Check if camera is available
   * @returns {Promise<boolean>} Camera availability
   */
  static async isCameraAvailable() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }

  /**
   * Start QR code scanning
   * @param {HTMLVideoElement} videoElement - Video element for camera feed
   * @param {Function} onScan - Callback when QR code is detected
   * @param {Function} onError - Error callback
   * @param {Object} options - Scanner options
   * @returns {Promise<void>}
   */
  static async startScanning(videoElement, onScan, onError, options = {}) {
    try {
      if (this.isScanning) {
        throw new Error('Scanner is already running');
      }

      // Check camera availability
      const cameraAvailable = await this.isCameraAvailable();
      if (!cameraAvailable) {
        throw new Error('กล้องไม่พร้อมใช้งาน');
      }

      // Get camera stream
      const constraints = {
        video: {
          facingMode: options.facingMode || 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });

      await videoElement.play();
      this.isScanning = true;

      // Start scanning loop
      this.scanLoop(videoElement, onScan, onError, options);

    } catch (error) {
      console.error('Error starting QR scanner:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * Stop QR code scanning
   */
  static stopScanning() {
    try {
      this.isScanning = false;

      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
        });
        this.stream = null;
      }
    } catch (error) {
      console.error('Error stopping QR scanner:', error);
    }
  }

  /**
   * Scanning loop
   * @param {HTMLVideoElement} videoElement - Video element
   * @param {Function} onScan - Scan callback
   * @param {Function} onError - Error callback
   * @param {Object} options - Scanner options
   */
  static scanLoop(videoElement, onScan, onError, options = {}) {
    if (!this.isScanning) {
      return;
    }

    try {
      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw current video frame
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to detect QR code using jsQR (if available) or fallback method
      const qrCode = this.detectQRCode(imageData);
      
      if (qrCode) {
        // Parse QR code data
        const parsedData = this.parseQRCode(qrCode.data);
        if (parsedData) {
          onScan(parsedData, qrCode);
          return; // Stop scanning after successful detection
        }
      }

    } catch (error) {
      console.error('Error in scan loop:', error);
      if (onError) {
        onError(error);
      }
    }

    // Continue scanning
    const scanInterval = options.scanInterval || 100; // Default 100ms
    setTimeout(() => {
      this.scanLoop(videoElement, onScan, onError, options);
    }, scanInterval);
  }

  /**
   * Detect QR code in image data
   * @param {ImageData} imageData - Image data from canvas
   * @returns {Object|null} QR code result
   */
  static detectQRCode(imageData) {
    try {
      // Try to use jsQR library if available
      if (window.jsQR) {
        return window.jsQR(imageData.data, imageData.width, imageData.height);
      }

      // Fallback: Use browser's built-in barcode detection if available
      if ('BarcodeDetector' in window) {
        return this.detectWithBarcodeDetector(imageData);
      }

      // If no QR detection library is available, return null
      console.warn('No QR code detection library available');
      return null;

    } catch (error) {
      console.error('Error detecting QR code:', error);
      return null;
    }
  }

  /**
   * Detect QR code using BarcodeDetector API
   * @param {ImageData} imageData - Image data
   * @returns {Promise<Object|null>} QR code result
   */
  static async detectWithBarcodeDetector(imageData) {
    try {
      // eslint-disable-next-line no-undef
      const barcodeDetector = new BarcodeDetector({
        formats: ['qr_code']
      });

      // Convert ImageData to ImageBitmap
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);

      const barcodes = await barcodeDetector.detect(canvas);
      
      if (barcodes.length > 0) {
        return {
          data: barcodes[0].rawValue,
          location: barcodes[0].boundingBox
        };
      }

      return null;
    } catch (error) {
      console.error('Error with BarcodeDetector:', error);
      return null;
    }
  }

  /**
   * Parse QR code data
   * @param {string} qrData - Raw QR code data
   * @returns {Object|null} Parsed data
   */
  static parseQRCode(qrData) {
    try {
      // Try to parse as JSON (our equipment QR codes)
      const jsonData = JSON.parse(qrData);
      if (jsonData.type === 'equipment') {
        return {
          type: 'equipment',
          data: jsonData,
          raw: qrData
        };
      }
    } catch (error) {
      // Not JSON, might be a simple URL or text
    }

    // Check if it's a URL
    try {
      const url = new URL(qrData);
      
      // Check if it's our equipment URL
      const equipmentMatch = url.pathname.match(/\/equipment\/(.+)$/);
      if (equipmentMatch) {
        return {
          type: 'equipment_url',
          data: {
            equipmentId: equipmentMatch[1],
            url: qrData
          },
          raw: qrData
        };
      }

      return {
        type: 'url',
        data: { url: qrData },
        raw: qrData
      };
    } catch (error) {
      // Not a URL
    }

    // Return as plain text
    return {
      type: 'text',
      data: { text: qrData },
      raw: qrData
    };
  }

  /**
   * Capture single frame for QR detection
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {Promise<Object|null>} QR code result
   */
  static async captureFrame(videoElement) {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = this.detectQRCode(imageData);
      
      if (qrCode) {
        return this.parseQRCode(qrCode.data);
      }

      return null;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  /**
   * Switch camera (front/back)
   * @param {HTMLVideoElement} videoElement - Video element
   * @param {string} facingMode - 'user' for front, 'environment' for back
   * @returns {Promise<void>}
   */
  static async switchCamera(videoElement, facingMode) {
    try {
      // Stop current stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      // Start new stream with different camera
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });

      await videoElement.play();
    } catch (error) {
      console.error('Error switching camera:', error);
      throw error;
    }
  }

  /**
   * Get available cameras
   * @returns {Promise<Array>} List of available cameras
   */
  static async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          facingMode: this.guessFacingMode(device.label)
        }));
    } catch (error) {
      console.error('Error getting available cameras:', error);
      return [];
    }
  }

  /**
   * Guess camera facing mode from label
   * @param {string} label - Camera label
   * @returns {string} Facing mode
   */
  static guessFacingMode(label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('back') || lowerLabel.includes('rear')) {
      return 'environment';
    } else if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
      return 'user';
    }
    return 'environment'; // Default to back camera
  }

  /**
   * Check if scanning is currently active
   * @returns {boolean} Is scanning
   */
  static isCurrentlyScanning() {
    return this.isScanning;
  }

  /**
   * Get current stream
   * @returns {MediaStream|null} Current stream
   */
  static getCurrentStream() {
    return this.stream;
  }
}

export default QRScannerService;