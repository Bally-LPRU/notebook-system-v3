import ImageService from '../imageService';

// Mock Firebase Storage
jest.mock('../../config/firebase', () => ({
  storage: {}
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

// Mock serverTimestamp
jest.mock('firebase/firestore', () => ({
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' }))
}));

describe('ImageService', () => {
  // Mock file creation helper
  const createMockFile = (name, size, type) => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  // Mock image creation
  const createMockImage = (width = 800, height = 600) => {
    const img = {
      width,
      height,
      onload: null,
      onerror: null,
      src: ''
    };
    
    // Simulate image loading
    setTimeout(() => {
      if (img.onload) img.onload();
    }, 0);
    
    return img;
  };

  beforeEach(() => {
    // Mock Image constructor
    global.Image = jest.fn(() => createMockImage());
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock Canvas
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => ({
        drawImage: jest.fn(),
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      })),
      toBlob: jest.fn((callback) => {
        callback(new Blob(['mock-blob'], { type: 'image/jpeg' }));
      })
    };
    
    global.document.createElement = jest.fn((tagName) => {
      if (tagName === 'canvas') return mockCanvas;
      return {};
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImage', () => {
    test('should validate correct image file', () => {
      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      expect(() => ImageService.validateImage(file)).not.toThrow();
    });

    test('should throw error for missing file', () => {
      expect(() => ImageService.validateImage(null)).toThrow('ไม่พบไฟล์รูปภาพ');
    });

    test('should throw error for unsupported file type', () => {
      const file = createMockFile('test.gif', 1024, 'image/gif');
      expect(() => ImageService.validateImage(file)).toThrow('ประเภทไฟล์ไม่รองรับ');
    });

    test('should throw error for file too large', () => {
      const file = createMockFile('test.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB
      expect(() => ImageService.validateImage(file)).toThrow('ขนาดไฟล์เกิน');
    });
  });

  describe('validateImages', () => {
    test('should validate array of correct images', () => {
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.png', 2048, 'image/png')
      ];
      expect(() => ImageService.validateImages(files)).not.toThrow();
    });

    test('should throw error for non-array input', () => {
      expect(() => ImageService.validateImages('not-array')).toThrow('ข้อมูลรูปภาพไม่ถูกต้อง');
    });

    test('should throw error for too many images', () => {
      const files = Array(15).fill().map((_, i) => 
        createMockFile(`test${i}.jpg`, 1024, 'image/jpeg')
      );
      expect(() => ImageService.validateImages(files)).toThrow('สามารถอัปโหลดได้สูงสุด');
    });

    test('should throw error with file index for invalid file', () => {
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.gif', 1024, 'image/gif') // Invalid type
      ];
      expect(() => ImageService.validateImages(files)).toThrow('รูปที่ 2:');
    });
  });

  describe('generateImageId', () => {
    test('should generate unique image ID', () => {
      const id1 = ImageService.generateImageId();
      const id2 = ImageService.generateImageId();
      
      expect(id1).toMatch(/^img_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^img_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('calculateResizeDimensions', () => {
    test('should maintain aspect ratio when resizing', () => {
      const result = ImageService.calculateResizeDimensions(1600, 1200, 800);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    test('should not resize if already smaller', () => {
      const result = ImageService.calculateResizeDimensions(400, 300, 800);
      expect(result).toEqual({ width: 400, height: 300 });
    });

    test('should handle portrait orientation', () => {
      const result = ImageService.calculateResizeDimensions(600, 800, 400);
      expect(result).toEqual({ width: 300, height: 400 });
    });
  });

  describe('createCanvas', () => {
    test('should create canvas with correct dimensions', () => {
      const { canvas, ctx } = ImageService.createCanvas(800, 600);
      
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(ctx.imageSmoothingEnabled).toBe(true);
      expect(ctx.imageSmoothingQuality).toBe('high');
    });
  });

  describe('loadImage', () => {
    test('should load image from file', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const img = await ImageService.loadImage(file);
      
      expect(img).toBeDefined();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    test('should reject on image load error', async () => {
      // Mock image that fails to load
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          onload: null,
          onerror: null,
          src: ''
        };
        
        // Simulate image loading error
        setTimeout(() => {
          if (img.onerror) img.onerror();
        }, 0);
        
        return img;
      });

      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      await expect(ImageService.loadImage(file)).rejects.toThrow('ไม่สามารถโหลดรูปภาพได้');
    });
  });

  describe('getImageUrl', () => {
    const mockImageMetadata = {
      url: 'original-url',
      thumbnailUrl: 'thumbnail-url',
      mediumUrl: 'medium-url'
    };

    test('should return original URL by default', () => {
      const url = ImageService.getImageUrl(mockImageMetadata);
      expect(url).toBe('medium-url');
    });

    test('should return thumbnail URL when requested', () => {
      const url = ImageService.getImageUrl(mockImageMetadata, 'thumbnail');
      expect(url).toBe('thumbnail-url');
    });

    test('should return medium URL when requested', () => {
      const url = ImageService.getImageUrl(mockImageMetadata, 'medium');
      expect(url).toBe('medium-url');
    });

    test('should return original URL when requested', () => {
      const url = ImageService.getImageUrl(mockImageMetadata, 'original');
      expect(url).toBe('original-url');
    });

    test('should return null for null metadata', () => {
      const url = ImageService.getImageUrl(null);
      expect(url).toBeNull();
    });

    test('should fallback to original URL if specific size not available', () => {
      const metadata = { url: 'original-url' };
      const url = ImageService.getImageUrl(metadata, 'thumbnail');
      expect(url).toBe('original-url');
    });
  });

  describe('createPreviewUrl', () => {
    test('should create preview URL from file', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const url = ImageService.createPreviewUrl(file);
      
      expect(url).toBe('mock-url');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });
  });

  describe('revokePreviewUrl', () => {
    test('should revoke preview URL', () => {
      ImageService.revokePreviewUrl('mock-url');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });

  describe('Constants', () => {
    test('should have correct supported types', () => {
      expect(ImageService.SUPPORTED_TYPES).toEqual([
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ]);
    });

    test('should have correct size limits', () => {
      expect(ImageService.MAX_FILE_SIZE).toBe(5 * 1024 * 1024); // 5MB
      expect(ImageService.MAX_IMAGES_PER_EQUIPMENT).toBe(10);
    });

    test('should have correct image dimensions', () => {
      expect(ImageService.THUMBNAIL_SIZE).toBe(150);
      expect(ImageService.MEDIUM_SIZE).toBe(800);
      expect(ImageService.MAX_ORIGINAL_SIZE).toBe(1920);
    });

    test('should have correct compression quality', () => {
      expect(ImageService.COMPRESSION_QUALITY).toBe(0.8);
      expect(ImageService.THUMBNAIL_QUALITY).toBe(0.7);
    });
  });
});