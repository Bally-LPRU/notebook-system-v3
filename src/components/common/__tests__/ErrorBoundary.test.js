import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock error logger
jest.mock('../../../utils/errorLogger', () => ({
  logError: () => {}
}));

// Test component that throws errors
const ThrowError = ({ errorType, shouldThrow = true }) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'firebase_config':
        throw new Error('Firebase configuration validation failed: Missing required environment variables');
      case 'firebase_init':
        throw new Error('Firebase app initialization failed');
      case 'firebase_auth':
        const authError = new Error('Authentication failed');
        authError.code = 'auth/popup-blocked';
        throw authError;
      case 'firebase_optional':
        throw new Error('Firebase Analytics initialization failed');
      case 'network':
        const networkError = new Error('Network request failed');
        networkError.code = 'unavailable';
        throw networkError;
      case 'react_component':
        throw new Error('Cannot read property of undefined');
      default:
        throw new Error('Unknown error occurred');
    }
  }
  return <div data-testid="success">Component rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  let consoleSpy;

  beforeEach(() => {
    // Mock console.error to avoid test output noise
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Error Analysis', () => {
    it('should analyze Firebase configuration errors correctly', () => {
      const error = new Error('Firebase configuration validation failed');
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('firebase_config');
      expect(analysis.isRecoverable).toBe(false);
      expect(analysis.category).toBe('configuration');
    });

    it('should analyze Firebase initialization errors correctly', () => {
      const error = new Error('Firebase app initialization failed');
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('firebase_init');
      expect(analysis.isRecoverable).toBe(true);
      expect(analysis.category).toBe('initialization');
    });

    it('should analyze Firebase authentication errors correctly', () => {
      const error = new Error('Authentication failed');
      error.code = 'auth/popup-blocked';
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('firebase_auth');
      expect(analysis.isRecoverable).toBe(true);
      expect(analysis.category).toBe('authentication');
    });

    it('should analyze Firebase optional service errors correctly', () => {
      const error = new Error('Firebase Analytics initialization failed');
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('firebase_optional');
      expect(analysis.isRecoverable).toBe(true);
      expect(analysis.category).toBe('optional_services');
    });

    it('should analyze network errors correctly', () => {
      const error = new Error('Network connection failed');
      error.code = 'unavailable';
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('network');
      expect(analysis.isRecoverable).toBe(true);
      expect(analysis.category).toBe('connectivity');
    });

    it('should analyze React component errors correctly', () => {
      const error = new Error('Cannot read property of undefined');
      error.stack = 'Error: Cannot read property\n    at React.Component.render';
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('react_component');
      expect(analysis.isRecoverable).toBe(true);
      expect(analysis.category).toBe('component');
    });

    it('should analyze unknown errors correctly', () => {
      const error = new Error('Some random error');
      const analysis = ErrorBoundary.analyzeError(error);
      
      expect(analysis.type).toBe('unknown');
      expect(analysis.isRecoverable).toBe(true);
      expect(analysis.category).toBe('general');
    });
  });

  describe('Error Boundary Behavior', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('should catch and display Firebase configuration errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_config" />
        </ErrorBoundary>
      );

      expect(screen.getByText('ปัญหาการตั้งค่าระบบ')).toBeInTheDocument();
      expect(screen.getByText(/ระบบไม่สามารถเชื่อมต่อกับฐานข้อมูลได้/)).toBeInTheDocument();
      expect(screen.queryByText('ลองใหม่')).not.toBeInTheDocument(); // Non-recoverable
    });

    it('should catch and display Firebase initialization errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_init" />
        </ErrorBoundary>
      );

      expect(screen.getByText('ปัญหาการเชื่อมต่อระบบ')).toBeInTheDocument();
      expect(screen.getByText(/ไม่สามารถเชื่อมต่อกับระบบฐานข้อมูลได้/)).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument(); // Recoverable
    });

    it('should catch and display Firebase authentication errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_auth" />
        </ErrorBoundary>
      );

      expect(screen.getByText('ปัญหาการเข้าสู่ระบบ')).toBeInTheDocument();
      expect(screen.getByText(/เกิดข้อผิดพลาดในระบบการเข้าสู่ระบบ/)).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument(); // Recoverable
    });

    it('should catch and display Firebase optional service errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_optional" />
        </ErrorBoundary>
      );

      expect(screen.getByText('บริการเสริมไม่พร้อมใช้งาน')).toBeInTheDocument();
      expect(screen.getByText(/บริการเสริมบางส่วนไม่สามารถใช้งานได้/)).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument(); // Recoverable
    });

    it('should catch and display network errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="network" />
        </ErrorBoundary>
      );

      expect(screen.getByText('ปัญหาการเชื่อมต่ออินเทอร์เน็ต')).toBeInTheDocument();
      expect(screen.getByText(/ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้/)).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument(); // Recoverable
    });

    it('should catch and display React component errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="react_component" />
        </ErrorBoundary>
      );

      expect(screen.getByText('ปัญหาการแสดงผล')).toBeInTheDocument();
      expect(screen.getByText(/เกิดข้อผิดพลาดในการแสดงผลหน้าเว็บ/)).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument(); // Recoverable
    });

    it('should catch and display unknown errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="unknown" />
        </ErrorBoundary>
      );

      expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
      expect(screen.getByText(/ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด/)).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument(); // Recoverable
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry for recoverable errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_init" />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('ลองใหม่');
      fireEvent.click(retryButton);

      // Re-render with no error to simulate successful retry
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('should show reload button for all error types', () => {
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_config" />
        </ErrorBoundary>
      );

      expect(screen.getByText('รีโหลดหน้า')).toBeInTheDocument();
    });

    it('should call onRetry prop when retry is clicked', () => {
      const mockOnRetry = jest.fn();
      
      render(
        <ErrorBoundary onRetry={mockOnRetry}>
          <ThrowError errorType="network" />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('ลองใหม่');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledWith(1);
    });

    it('should call onError prop when error occurs', () => {
      const mockOnError = jest.fn();
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError errorType="firebase_auth" />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalled();
    });
  });

  describe('Development Mode', () => {
    let originalNodeEnv;

    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_init" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development Mode):')).toBeInTheDocument();
      expect(screen.getByText(/Firebase app initialization failed/)).toBeInTheDocument();
    });

    it('should not show error details in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      render(
        <ErrorBoundary>
          <ThrowError errorType="firebase_init" />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development Mode):')).not.toBeInTheDocument();
    });
  });
});