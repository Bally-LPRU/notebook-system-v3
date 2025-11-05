/**
 * MobileCameraService - Service for mobile camera integration
 * Handles camera access, photo capture, and basic image editing
 */
class MobileCameraService {
  // Camera constraints
  static DEFAULT_CONSTRAINTS = {
    video: {
      facingMode: 'environment', // Back camera by default
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  // Supported facing modes
  static FACING_MODES = {
    FRONT: 'user',
    BACK: 'environment'
  };

  /**
   * Check if camera is supported
   * @returns {boolean} True if camera is supported
   */
  static isCameraSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile device
   */
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Request camera permission and get stream
   * @param {Object} constraints - Camera constraints
   * @returns {Promise<MediaStream>} Camera stream
   */
  static async getCameraStream(constraints = this.DEFAULT_CONSTRAINTS) {
    if (!this.isCameraSupported()) {
      throw new Error('กล้องไม่รองรับในเบราว์เซอร์นี้');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Camera access error:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('กรุณาอนุญาตการเข้าถึงกล้อง');
      } else if (error.name === 'NotFoundError') {
        throw new Error('ไม่พบกล้องในอุปกรณ์นี้');
      } else if (error.name === 'NotReadableError') {
        throw new Error('กล้องถูกใช้งานโดยแอปพลิเคชันอื่น');
      } else {
        throw new Error('ไม่สามารถเข้าถึงกล้องได้');
      }
    }
  }

  /**
   * Get available cameras
   * @returns {Promise<Object[]>} Array of camera devices
   */
  static async getAvailableCameras() {
    if (!this.isCameraSupported()) {
      return [];
    }

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
      console.error('Error getting cameras:', error);
      return [];
    }
  }

  /**
   * Guess facing mode from device label
   * @param {string} label - Device label
   * @returns {string} Facing mode
   */
  static guessFacingMode(label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
      return this.FACING_MODES.FRONT;
    } else if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
      return this.FACING_MODES.BACK;
    }
    return this.FACING_MODES.BACK; // Default to back camera
  }

  /**
   * Create camera interface
   * @param {MediaStream} stream - Camera stream
   * @param {Object} options - Interface options
   * @returns {Object} Camera interface
   */
  static createCameraInterface(stream, options = {}) {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Configure video element
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true; // Important for iOS
    video.muted = true;

    // Set video dimensions
    if (options.width) video.width = options.width;
    if (options.height) video.height = options.height;

    const cameraInterface = {
      video,
      canvas,
      context,
      stream,

      /**
       * Capture photo from video stream
       * @param {Object} captureOptions - Capture options
       * @returns {Promise<Blob>} Captured image blob
       */
      capturePhoto: (captureOptions = {}) => {
        return new Promise((resolve) => {
          // Wait for video to be ready
          const capture = () => {
            const width = video.videoWidth || video.width || 640;
            const height = video.videoHeight || video.height || 480;

            canvas.width = width;
            canvas.height = height;

            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(resolve, captureOptions.format || 'image/jpeg', captureOptions.quality || 0.8);
          };

          if (video.readyState >= 2) {
            capture();
          } else {
            video.addEventListener('loadeddata', capture, { once: true });
          }
        });
      },

      /**
       * Stop camera stream
       */
      stop: () => {
        stream.getTracks().forEach(track => track.stop());
      },

      /**
       * Switch camera (if multiple available)
       * @param {string} facingMode - Facing mode or device ID
       * @returns {Promise<MediaStream>} New camera stream
       */
      switchCamera: async (facingMode) => {
        // Stop current stream
        cameraInterface.stop();

        // Get new stream
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        const newStream = await MobileCameraService.getCameraStream(constraints);
        video.srcObject = newStream;
        cameraInterface.stream = newStream;

        return newStream;
      }
    };

    return cameraInterface;
  }

  /**
   * Capture single image
   * @param {Object} options - Capture options
   * @returns {Promise<Object>} Capture result with image blob and interface
   */
  static async captureImage(options = {}) {
    const constraints = {
      video: {
        facingMode: options.facingMode || this.FACING_MODES.BACK,
        width: { ideal: options.width || 1920 },
        height: { ideal: options.height || 1080 }
      }
    };

    const stream = await this.getCameraStream(constraints);
    const cameraInterface = this.createCameraInterface(stream, options);

    return {
      interface: cameraInterface,
      capturePhoto: cameraInterface.capturePhoto,
      stop: cameraInterface.stop,
      switchCamera: cameraInterface.switchCamera
    };
  }

  /**
   * Create file input fallback for unsupported browsers
   * @param {Object} options - Input options
   * @returns {Promise<File[]>} Selected files
   */
  static createFileInputFallback(options = {}) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = options.multiple || false;
      
      if (this.isMobileDevice()) {
        input.capture = 'environment'; // Use camera on mobile
      }

      input.addEventListener('change', (event) => {
        const files = Array.from(event.target.files);
        resolve(files);
      });

      input.click();
    });
  }

  /**
   * Rotate image
   * @param {Blob} imageBlob - Image blob
   * @param {number} degrees - Rotation degrees (90, 180, 270)
   * @returns {Promise<Blob>} Rotated image blob
   */
  static async rotateImage(imageBlob, degrees) {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const { width, height } = img;

        // Set canvas dimensions based on rotation
        if (degrees === 90 || degrees === 270) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        // Apply rotation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2);

        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * Crop image
   * @param {Blob} imageBlob - Image blob
   * @param {Object} cropArea - Crop area {x, y, width, height}
   * @returns {Promise<Blob>} Cropped image blob
   */
  static async cropImage(imageBlob, cropArea) {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        );

        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * Apply basic image filters
   * @param {Blob} imageBlob - Image blob
   * @param {Object} filters - Filter options
   * @returns {Promise<Blob>} Filtered image blob
   */
  static async applyFilters(imageBlob, filters = {}) {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply filters using CSS filter property
        let filterString = '';
        
        if (filters.brightness) filterString += `brightness(${filters.brightness}%) `;
        if (filters.contrast) filterString += `contrast(${filters.contrast}%) `;
        if (filters.saturation) filterString += `saturate(${filters.saturation}%) `;
        if (filters.blur) filterString += `blur(${filters.blur}px) `;

        ctx.filter = filterString;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * Capture multiple photos with delay
   * @param {Object} options - Capture options
   * @returns {Promise<Object>} Multi-capture interface
   */
  static async createMultiCaptureInterface(options = {}) {
    const cameraInterface = await this.captureImage(options);
    const capturedImages = [];

    return {
      ...cameraInterface,
      capturedImages,

      /**
       * Capture photo and add to collection
       * @returns {Promise<Blob>} Captured image blob
       */
      captureAndAdd: async () => {
        const blob = await cameraInterface.capturePhoto();
        capturedImages.push({
          blob,
          timestamp: Date.now(),
          preview: URL.createObjectURL(blob)
        });
        return blob;
      },

      /**
       * Remove captured image
       * @param {number} index - Image index
       */
      removeImage: (index) => {
        if (capturedImages[index]) {
          URL.revokeObjectURL(capturedImages[index].preview);
          capturedImages.splice(index, 1);
        }
      },

      /**
       * Get all captured images
       * @returns {Object[]} Array of captured images
       */
      getAllImages: () => [...capturedImages],

      /**
       * Clear all captured images
       */
      clearAll: () => {
        capturedImages.forEach(img => URL.revokeObjectURL(img.preview));
        capturedImages.length = 0;
      },

      /**
       * Stop and cleanup
       */
      stop: () => {
        cameraInterface.stop();
        capturedImages.forEach(img => URL.revokeObjectURL(img.preview));
      }
    };
  }
}

export default MobileCameraService;