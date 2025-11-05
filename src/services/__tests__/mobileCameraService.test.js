import MobileCameraService from '../mobileCameraService';

describe('MobileCameraService', () => {
  // Mock MediaDevices
  const mockGetUserMedia = jest.fn();
  const mockEnumerateDevices = jest.fn();
  
  beforeEach(() => {
    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: mockEnumerateDevices
      },
      configurable: true
    });

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    });

    // Mock MediaStream
    const mockTrack = {
      stop: jest.fn()
    };
    
    const mockStream = {
      getTracks: jest.fn(() => [mockTrack])
    };

    mockGetUserMedia.mockResolvedValue(mockStream);
    
    // Mock DOM elements
    global.document.createElement = jest.fn((tagName) => {
      if (tagName === 'video') {
        return {
          srcObject: null,
          autoplay: false,
          playsInline: false,
          muted: false,
          width: 0,
          height: 0,
          videoWidth: 1920,
          videoHeight: 1080,
          readyState: 4,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
      }
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ({
            drawImage: jest.fn()
          })),
          toBlob: jest.fn((callback) => {
            callback(new Blob(['mock-image'], { type: 'image/jpeg' }));
          })
        };
      }
      if (tagName === 'input') {
        return {
          type: '',
          accept: '',
          multiple: false,
          capture: '',
          addEventListener: jest.fn(),
          click: jest.fn()
        };
      }
      return {};
    });

    // Mock Image constructor
    global.Image = jest.fn(() => ({
      onload: null,
      onerror: null,
      src: '',
      width: 1920,
      height: 1080
    }));

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isCameraSupported', () => {
    test('should return true when camera is supported', () => {
      expect(MobileCameraService.isCameraSupported()).toBe(true);
    });

    test('should return false when mediaDevices is not available', () => {
      delete navigator.mediaDevices;
      expect(MobileCameraService.isCameraSupported()).toBe(false);
    });

    test('should return false when getUserMedia is not available', () => {
      navigator.mediaDevices.getUserMedia = undefined;
      expect(MobileCameraService.isCameraSupported()).toBe(false);
    });
  });

  describe('isMobileDevice', () => {
    test('should return true for iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      expect(MobileCameraService.isMobileDevice()).toBe(true);
    });

    test('should return true for Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        configurable: true
      });
      expect(MobileCameraService.isMobileDevice()).toBe(true);
    });

    test('should return false for desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      });
      expect(MobileCameraService.isMobileDevice()).toBe(false);
    });
  });

  describe('getCameraStream', () => {
    test('should get camera stream with default constraints', async () => {
      const stream = await MobileCameraService.getCameraStream();
      
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      expect(stream).toBeDefined();
    });

    test('should get camera stream with custom constraints', async () => {
      const customConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      await MobileCameraService.getCameraStream(customConstraints);
      expect(mockGetUserMedia).toHaveBeenCalledWith(customConstraints);
    });

    test('should throw error when camera is not supported', async () => {
      delete navigator.mediaDevices;
      
      await expect(MobileCameraService.getCameraStream())
        .rejects.toThrow('กล้องไม่รองรับในเบราว์เซอร์นี้');
    });

    test('should throw appropriate error for NotAllowedError', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(MobileCameraService.getCameraStream())
        .rejects.toThrow('กรุณาอนุญาตการเข้าถึงกล้อง');
    });

    test('should throw appropriate error for NotFoundError', async () => {
      const error = new Error('No camera found');
      error.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(MobileCameraService.getCameraStream())
        .rejects.toThrow('ไม่พบกล้องในอุปกรณ์นี้');
    });

    test('should throw appropriate error for NotReadableError', async () => {
      const error = new Error('Camera in use');
      error.name = 'NotReadableError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(MobileCameraService.getCameraStream())
        .rejects.toThrow('กล้องถูกใช้งานโดยแอปพลิเคชันอื่น');
    });
  });

  describe('getAvailableCameras', () => {
    test('should return available cameras', async () => {
      const mockDevices = [
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Front Camera'
        },
        {
          deviceId: 'camera2',
          kind: 'videoinput',
          label: 'Back Camera'
        },
        {
          deviceId: 'mic1',
          kind: 'audioinput',
          label: 'Microphone'
        }
      ];

      mockEnumerateDevices.mockResolvedValue(mockDevices);

      const cameras = await MobileCameraService.getAvailableCameras();
      
      expect(cameras).toHaveLength(2);
      expect(cameras[0]).toEqual({
        deviceId: 'camera1',
        label: 'Front Camera',
        facingMode: 'user'
      });
      expect(cameras[1]).toEqual({
        deviceId: 'camera2',
        label: 'Back Camera',
        facingMode: 'environment'
      });
    });

    test('should return empty array when camera not supported', async () => {
      delete navigator.mediaDevices;
      const cameras = await MobileCameraService.getAvailableCameras();
      expect(cameras).toEqual([]);
    });

    test('should handle enumerate devices error', async () => {
      mockEnumerateDevices.mockRejectedValue(new Error('Access denied'));
      const cameras = await MobileCameraService.getAvailableCameras();
      expect(cameras).toEqual([]);
    });
  });

  describe('guessFacingMode', () => {
    test('should guess front camera from label', () => {
      expect(MobileCameraService.guessFacingMode('Front Camera')).toBe('user');
      expect(MobileCameraService.guessFacingMode('User Camera')).toBe('user');
    });

    test('should guess back camera from label', () => {
      expect(MobileCameraService.guessFacingMode('Back Camera')).toBe('environment');
      expect(MobileCameraService.guessFacingMode('Rear Camera')).toBe('environment');
      expect(MobileCameraService.guessFacingMode('Environment Camera')).toBe('environment');
    });

    test('should default to back camera for unknown labels', () => {
      expect(MobileCameraService.guessFacingMode('Unknown Camera')).toBe('environment');
      expect(MobileCameraService.guessFacingMode('')).toBe('environment');
    });
  });

  describe('createCameraInterface', () => {
    test('should create camera interface with video and canvas', () => {
      const mockStream = { getTracks: jest.fn(() => [{ stop: jest.fn() }]) };
      const cameraInterface = MobileCameraService.createCameraInterface(mockStream);

      expect(cameraInterface.video).toBeDefined();
      expect(cameraInterface.canvas).toBeDefined();
      expect(cameraInterface.context).toBeDefined();
      expect(cameraInterface.stream).toBe(mockStream);
      expect(cameraInterface.capturePhoto).toBeInstanceOf(Function);
      expect(cameraInterface.stop).toBeInstanceOf(Function);
      expect(cameraInterface.switchCamera).toBeInstanceOf(Function);
    });

    test('should configure video element correctly', () => {
      const mockStream = { getTracks: jest.fn(() => [{ stop: jest.fn() }]) };
      const cameraInterface = MobileCameraService.createCameraInterface(mockStream, {
        width: 1280,
        height: 720
      });

      expect(cameraInterface.video.srcObject).toBe(mockStream);
      expect(cameraInterface.video.autoplay).toBe(true);
      expect(cameraInterface.video.playsInline).toBe(true);
      expect(cameraInterface.video.muted).toBe(true);
      expect(cameraInterface.video.width).toBe(1280);
      expect(cameraInterface.video.height).toBe(720);
    });
  });

  describe('captureImage', () => {
    test('should capture image with default options', async () => {
      const result = await MobileCameraService.captureImage();

      expect(result.interface).toBeDefined();
      expect(result.capturePhoto).toBeInstanceOf(Function);
      expect(result.stop).toBeInstanceOf(Function);
      expect(result.switchCamera).toBeInstanceOf(Function);
      
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
    });

    test('should capture image with custom options', async () => {
      const options = {
        facingMode: 'user',
        width: 1280,
        height: 720
      };

      await MobileCameraService.captureImage(options);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    });
  });

  describe('createFileInputFallback', () => {
    test('should create file input for image selection', async () => {
      const mockInput = {
        type: '',
        accept: '',
        multiple: false,
        capture: '',
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            // Simulate file selection
            setTimeout(() => {
              callback({
                target: {
                  files: [new File([''], 'test.jpg', { type: 'image/jpeg' })]
                }
              });
            }, 0);
          }
        }),
        click: jest.fn()
      };

      global.document.createElement = jest.fn(() => mockInput);

      const promise = MobileCameraService.createFileInputFallback({ multiple: true });
      
      expect(mockInput.type).toBe('file');
      expect(mockInput.accept).toBe('image/*');
      expect(mockInput.multiple).toBe(true);
      expect(mockInput.click).toHaveBeenCalled();

      const files = await promise;
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.jpg');
    });

    test('should set capture attribute on mobile devices', async () => {
      const mockInput = {
        type: '',
        accept: '',
        multiple: false,
        capture: '',
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            setTimeout(() => callback({ target: { files: [] } }), 0);
          }
        }),
        click: jest.fn()
      };

      global.document.createElement = jest.fn(() => mockInput);

      await MobileCameraService.createFileInputFallback();
      expect(mockInput.capture).toBe('environment');
    });
  });

  describe('FACING_MODES', () => {
    test('should have correct facing mode constants', () => {
      expect(MobileCameraService.FACING_MODES.FRONT).toBe('user');
      expect(MobileCameraService.FACING_MODES.BACK).toBe('environment');
    });
  });

  describe('DEFAULT_CONSTRAINTS', () => {
    test('should have correct default constraints', () => {
      expect(MobileCameraService.DEFAULT_CONSTRAINTS).toEqual({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
    });
  });
});