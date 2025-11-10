import React, { useState, useRef, useEffect } from 'react';
import { 
  CameraIcon, 
  XIcon, 
  SwitchCameraIcon, 
  SearchIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import QRScannerService from '../../services/qrScannerService';

const QRCodeScanner = ({ 
  isOpen, 
  onClose, 
  onScan, 
  onError = null,
  title = "สแกน QR Code อุปกรณ์"
}) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      loadAvailableCameras();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadAvailableCameras = async () => {
    try {
      const cameras = await QRScannerService.getAvailableCameras();
      setAvailableCameras(cameras);
    } catch (error) {
      console.error('Error loading cameras:', error);
    }
  };

  const initializeCamera = async () => {
    if (!videoRef.current) return;

    try {
      setCameraError(null);
      setIsProcessing(true);

      const cameraAvailable = await QRScannerService.isCameraAvailable();
      if (!cameraAvailable) {
        throw new Error('ไม่พบกล้องที่สามารถใช้งานได้');
      }

      await QRScannerService.startScanning(
        videoRef.current,
        handleScanSuccess,
        handleScanError,
        {
          facingMode,
          scanInterval: 100
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error('Error initializing camera:', error);
      setCameraError(error.message);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const stopScanning = () => {
    try {
      QRScannerService.stopScanning();
      setIsScanning(false);
      setScanResult(null);
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const handleScanSuccess = (result) => {
    try {
      setIsProcessing(true);
      setScanResult(result);

      // Process different types of QR codes
      if (result.type === 'equipment') {
        // Equipment QR code with full data
        onScan({
          type: 'equipment',
          equipmentId: result.data.id,
          equipmentNumber: result.data.equipmentNumber,
          data: result.data,
          raw: result.raw
        });
      } else if (result.type === 'equipment_url') {
        // Equipment URL QR code
        onScan({
          type: 'equipment_url',
          equipmentId: result.data.equipmentId,
          url: result.data.url,
          raw: result.raw
        });
      } else {
        // Other types of QR codes
        onScan({
          type: result.type,
          data: result.data,
          raw: result.raw
        });
      }

      // Close scanner after successful scan
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error processing scan result:', error);
      handleScanError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
    setCameraError(error.message);
    
    if (onError) {
      onError(error);
    }
  };

  const handleSwitchCamera = async () => {
    try {
      setIsProcessing(true);
      const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
      
      if (videoRef.current) {
        await QRScannerService.switchCamera(videoRef.current, newFacingMode);
        setFacingMode(newFacingMode);
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      setCameraError('ไม่สามารถเปลี่ยนกล้องได้');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setCameraError(null);
    setScanResult(null);
    initializeCamera();
  };

  const handleManualCapture = async () => {
    if (!videoRef.current || !isScanning) return;

    try {
      setIsProcessing(true);
      const result = await QRScannerService.captureFrame(videoRef.current);
      
      if (result) {
        handleScanSuccess(result);
      } else {
        setCameraError('ไม่พบ QR Code ในภาพ');
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
      setCameraError('ไม่สามารถจับภาพได้');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="relative">
          {/* Video Element */}
          <div className="relative aspect-square bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            {isScanning && !scanResult && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                </div>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <div>กำลังประมวลผล...</div>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scanResult && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                <div className="text-white text-center">
                  <CheckCircleIcon className="w-12 h-12 mx-auto mb-2" />
                  <div className="font-semibold">สแกนสำเร็จ!</div>
                  {scanResult.type === 'equipment' && (
                    <div className="text-sm mt-1">
                      {scanResult.data.equipmentNumber}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {cameraError && (
            <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
              <div className="text-white text-center p-4">
                <AlertCircleIcon className="w-12 h-12 mx-auto mb-2" />
                <div className="font-semibold mb-2">เกิดข้อผิดพลาด</div>
                <div className="text-sm mb-4">{cameraError}</div>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-white text-red-500 rounded-lg hover:bg-gray-100"
                >
                  ลองใหม่
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-center space-x-4">
            {/* Switch Camera */}
            {availableCameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                disabled={!isScanning || isProcessing}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SwitchCameraIcon className="w-4 h-4 mr-1" />
                เปลี่ยนกล้อง
              </button>
            )}

            {/* Manual Capture */}
            <button
              onClick={handleManualCapture}
              disabled={!isScanning || isProcessing}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CameraIcon className="w-4 h-4 mr-1" />
              จับภาพ
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <div className="flex items-center justify-center mb-1">
              <SearchIcon className="w-4 h-4 mr-1" />
              วาง QR Code ให้อยู่ในกรอบ
            </div>
            <div>หรือกดปุ่ม "จับภาพ" เพื่อสแกนด้วยตนเอง</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;