import React, { useState, useEffect } from 'react';
import { QrCodeIcon, DownloadIcon, PrinterIcon, RefreshCwIcon } from 'lucide-react';
import QRCodeService from '../../services/qrCodeService';

const QRCodeGenerator = ({ 
  equipment, 
  onGenerated = null, 
  onError = null,
  showControls = true,
  size = 'medium' 
}) => {
  const [qrCode, setQrCode] = useState(equipment?.qrCode || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  useEffect(() => {
    if (equipment?.qrCode) {
      setQrCode(equipment.qrCode);
    }
  }, [equipment]);

  const handleGenerateQRCode = async () => {
    if (!equipment?.id) {
      setError('ไม่พบข้อมูลอุปกรณ์');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await QRCodeService.generateQRCode(equipment.id, equipment);
      setQrCode(result);
      
      if (onGenerated) {
        onGenerated(result);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateQRCode = async () => {
    if (!equipment?.id) {
      setError('ไม่พบข้อมูลอุปกรณ์');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await QRCodeService.regenerateQRCode(equipment.id, equipment);
      setQrCode(result);
      
      if (onGenerated) {
        onGenerated(result);
      }
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQRCode = async () => {
    if (!qrCode?.data) {
      setError('ไม่มี QR Code ให้ดาวน์โหลด');
      return;
    }

    try {
      const filename = `QR_${equipment.equipmentNumber}_${equipment.id}.png`;
      await QRCodeService.downloadQRCode(qrCode.data, filename);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setError('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const handlePrintQRCode = async () => {
    if (!qrCode?.data) {
      setError('ไม่มี QR Code ให้พิมพ์');
      return;
    }

    try {
      // Generate high-resolution QR code for printing
      const printQRCode = await QRCodeService.generatePrintQRCode(qrCode.data, {
        size: 512,
        margin: 4
      });

      // Create print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${equipment.equipmentNumber}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                text-align: center;
              }
              .qr-container {
                display: inline-block;
                border: 2px solid #000;
                padding: 20px;
                margin: 20px;
              }
              .qr-code {
                display: block;
                margin: 0 auto 10px;
              }
              .equipment-info {
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
              }
              .equipment-number {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .qr-container { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${printQRCode}" alt="QR Code" class="qr-code" />
              <div class="equipment-number">${equipment.equipmentNumber}</div>
              <div class="equipment-info">${equipment.name}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing QR code:', error);
      setError('ไม่สามารถพิมพ์ QR Code ได้');
    }
  };

  if (!equipment) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        <QrCodeIcon className="w-6 h-6 mr-2" />
        <span>ไม่พบข้อมูลอุปกรณ์</span>
      </div>
    );
  }

  return (
    <div className="qr-code-generator">
      {/* QR Code Display */}
      <div className="flex flex-col items-center space-y-4">
        {qrCode ? (
          <div className="qr-code-display">
            <div className={`${sizeClasses[size]} border-2 border-gray-200 rounded-lg overflow-hidden bg-white p-2`}>
              {qrCode.dataUrl ? (
                <img 
                  src={qrCode.dataUrl} 
                  alt={`QR Code for ${equipment.equipmentNumber}`}
                  className="w-full h-full object-contain"
                />
              ) : qrCode.url ? (
                <img 
                  src={qrCode.url} 
                  alt={`QR Code for ${equipment.equipmentNumber}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <QrCodeIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            
            {/* Equipment Info */}
            <div className="text-center mt-2">
              <div className="font-semibold text-sm">{equipment.equipmentNumber}</div>
              <div className="text-xs text-gray-600 truncate max-w-32">{equipment.name}</div>
            </div>
          </div>
        ) : (
          <div className={`${sizeClasses[size]} border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400`}>
            <QrCodeIcon className="w-8 h-8 mb-2" />
            <span className="text-xs text-center">ยังไม่มี QR Code</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex flex-wrap gap-2 justify-center">
            {!qrCode ? (
              <button
                onClick={handleGenerateQRCode}
                disabled={isGenerating}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? (
                  <RefreshCwIcon className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <QrCodeIcon className="w-4 h-4 mr-1" />
                )}
                สร้าง QR Code
              </button>
            ) : (
              <>
                <button
                  onClick={handleRegenerateQRCode}
                  disabled={isGenerating}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isGenerating ? (
                    <RefreshCwIcon className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="w-4 h-4 mr-1" />
                  )}
                  สร้างใหม่
                </button>
                
                <button
                  onClick={handleDownloadQRCode}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <DownloadIcon className="w-4 h-4 mr-1" />
                  ดาวน์โหลด
                </button>
                
                <button
                  onClick={handlePrintQRCode}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <PrinterIcon className="w-4 h-4 mr-1" />
                  พิมพ์
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeGenerator;