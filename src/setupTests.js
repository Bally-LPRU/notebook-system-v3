// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import fc from 'fast-check';

// Polyfill setImmediate for environments where jsdom doesn't provide it (grpc-js relies on it)
if (typeof global.setImmediate !== 'function') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}

if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = timeoutId => clearTimeout(timeoutId);
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File constructor
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks;
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:image/jpeg;base64,mock-base64-data';
      if (this.onload) this.onload();
    }, 0);
  }
  
  readAsText() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload();
    }, 0);
  }
  
  abort() {
    this.readyState = 2;
    if (this.onabort) this.onabort();
  }
};

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@gmail.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  ...overrides
});

global.createMockEquipment = (overrides = {}) => ({
  id: 'test-equipment-id',
  name: 'Test Equipment',
  category: 'laptop',
  brand: 'Test Brand',
  model: 'Test Model',
  serialNumber: 'TEST001',
  status: 'available',
  location: 'Test Location',
  description: 'Test description',
  createdAt: { seconds: Date.now() / 1000 },
  updatedAt: { seconds: Date.now() / 1000 },
  ...overrides
});

global.createMockLoanRequest = (overrides = {}) => ({
  id: 'test-loan-request-id',
  equipmentId: 'test-equipment-id',
  userId: 'test-user-id',
  status: 'pending',
  borrowDate: { seconds: Date.now() / 1000 },
  expectedReturnDate: { seconds: (Date.now() + 86400000) / 1000 },
  purpose: 'Test purpose',
  createdAt: { seconds: Date.now() / 1000 },
  updatedAt: { seconds: Date.now() / 1000 },
  ...overrides
});

global.createMockNotification = (overrides = {}) => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'loan_approved',
  title: 'Test Notification',
  message: 'Test notification message',
  isRead: false,
  priority: 'medium',
  createdAt: { seconds: Date.now() / 1000 },
  ...overrides
});

// Suppress specific warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React Router Future Flag Warning') ||
     args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillUpdate'))
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

if (process.env.NODE_ENV === 'test') {
  const fastCheckRuns = Number(process.env.FAST_CHECK_NUM_RUNS);
  const fastCheckTimeLimit = Number(process.env.FAST_CHECK_TIME_LIMIT_MS);

  if (Number.isFinite(fastCheckRuns) || Number.isFinite(fastCheckTimeLimit)) {
    const config = {};
    if (Number.isFinite(fastCheckRuns)) {
      config.numRuns = fastCheckRuns;
    }
    if (Number.isFinite(fastCheckTimeLimit)) {
      config.interruptAfterTimeLimit = fastCheckTimeLimit;
    }
    fc.configureGlobal(config);
  }

  afterAll(async () => {
    try {
      const [{ db }, { terminate }] = await Promise.all([
        import('./config/firebase'),
        import('firebase/firestore')
      ]);

      if (db && typeof terminate === 'function') {
        await terminate(db);
      }
    } catch (error) {
      console.warn('⚠️ Firestore terminate warning (non-blocking):', error.message);
    }
  });
}