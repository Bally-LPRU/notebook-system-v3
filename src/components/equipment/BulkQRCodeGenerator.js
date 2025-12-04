import React, { useState } from 'react';
import { 
  QrCodeIcon, 
  DownloadIcon, 
  PrinterIcon, 
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import QRCodeService from '../../services/qrCodeService';

const BulkQRCodeGenerator = ({ 
  isOpen, 
  onClose, 
  selectedEquipment = [], 
  onComplete = null 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [results, setResults] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateBulkQRCodes = async () => {
    if (selectedEquipment.length === 0) {
      setError('กรุณาเลือกอุปกรณ์ที่ต้องการสร้าง QR Code');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResults([]);
    setIsComplete(false);
    setProgress({ completed: 0, total: selectedEquipment.length, percentage: 0 });

    try {
      const results = await QRCodeService.generateBulkQRCodes(
        selectedEquipment,
        (progressInfo) => {
          setProgress(progressInfo);
        }
      );

      setResults(results);
      setIsComplete(true);

      if (onComplete) {
        onComplete(results);
      }
    } catch (error) {
      console.error('Error generating bulk QR codes:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = async () => {
    const successfulResults = results.filter(result => result.success);
    
    if (successfulResults.length === 0) {
      setError('ไม่มี QR Code ที่สร้างสำเร็จให้ดาวน์โหลด');
      return;
    }

    try {
      // Download each QR code individually
      for (const result of successfulResults) {
        if (result.qrCode?.data) {
          const filename = `QR_${result.equipmentNumber}.png`;
          await QRCodeService.downloadQRCode(result.qrCode.data, filename);
          
          // Add small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      setError('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const handlePrintAll = async () => {
    const successfulResults = results.filter(result => result.success);
    
    if (successfulResults.length === 0) {
      setError('ไม่มี QR Code ที่สร้างสำเร็จให้พิมพ์');
      return;
    }

    try {
      // Generate print-ready QR codes
      const printQRCodes = await Promise.all(
        successfulResults.map(async (result) => {
          if (result.qrCode?.data) {
            const printQRCode = await QRCodeService.generatePrintQRCode(result.qrCode.data, {
              size: 256,
              margin: 2
            });
            return {
              ...result,
              printQRCode
            };
          }
          return null;
        })
      );

      const validPrintQRCodes = printQRCodes.filter(Boolean);

      // Create print layout
      const printWindow = window.open('', '_blank');
      const qrCodesPerRow = 3;

      let printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Codes - Bulk Print</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .print-container {
                display: grid;
                grid-template-columns: repeat(${qrCodesPerRow}, 1fr);
                gap: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .qr-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                border: 1px solid #ccc;
                padding: 15px;
                page-break-inside: avoid;
              }
              .qr-code {
                width: 120px;
                height: 120px;
                margin-bottom: 10px;
              }
              .equipment-number {
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 5px;
              }
              .equipment-name {
                font-size: 10px;
                text-align: center;
                color: #666;
                word-wrap: break-word;
                max-width: 120px;
              }
              @media print {
                body { padding: 10px; }
                .print-container { gap: 15px; }
                .qr-item { border: 1px solid #000; padding: 10px; }
              }
              @page {
                margin: 1cm;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
      `;

      validPrintQRCodes.forEach((result) => {
        const equipment = selectedEquipment.find(eq => eq.id === result.equipmentId);
        printContent += `
          <div class="qr-item">
            <img src="${result.printQRCode}" alt="QR Code" class="qr-code" />
            <div class="equipment-number">${result.equipmentNumber}</div>
            <div class="equipment-name">${equipment?.name || ''}</div>
          </div>
        `;
      });

      printContent += `
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
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing QR codes:', error);
      setError('ไม่สามารถพิมพ์ QR Code ได้');
    }
  };

  const handleRetry = () => {
    setError(null);
    setResults([]);
    setIsComplete(false);
    setProgress({ completed: 0, total: 0, percentage: 0 });
  };

  const successCount = results.filter(result => result.success).length;
  const failureCount = results.filter(result => !result.success).length;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">สร้าง QR Code จำนวนมาก</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Equipment Count */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              <span>อุปกรณ์ที่เลือก:</span>{' '}
              <span className="font-semibold">{selectedEquipment.length}</span>{' '}
              <span>รายการ</span>
            </div>
            
            {selectedEquipment.length > 0 && (
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                  {selectedEquipment.map((equipment) => (
                    <div key={equipment.id} className="flex items-center">
                      <span className="font-mono text-xs bg-white px-2 py-1 rounded mr-2">
                        {equipment.equipmentNumber}
                      </span>
                      <span className="truncate">{equipment.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">กำลังสร้าง QR Code...</span>
                <span className="text-sm text-gray-600">
                  {progress.completed}/{progress.total} ({progress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results */}
          {isComplete && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-green-800">{successCount}</div>
                  <div className="text-sm text-green-600">สำเร็จ</div>
                </div>
                
                {failureCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <AlertCircleIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-red-800">{failureCount}</div>
                    <div className="text-sm text-red-600">ล้มเหลว</div>
                  </div>
                )}
              </div>

              {/* Failed Items */}
              {failureCount > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">รายการที่ล้มเหลว:</h4>
                  <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
                    {results
                      .filter(result => !result.success)
                      .map((result, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          <span className="font-mono">{result.equipmentNumber}</span>: {result.error}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            {!isGenerating && !isComplete && (
              <button
                onClick={handleGenerateBulkQRCodes}
                disabled={selectedEquipment.length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <QrCodeIcon className="w-4 h-4 mr-2" />
                สร้าง QR Code ทั้งหมด
              </button>
            )}

            {isGenerating && (
              <div className="flex items-center px-4 py-2 text-blue-600">
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                กำลังสร้าง...
              </div>
            )}

            {isComplete && successCount > 0 && (
              <>
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  ดาวน์โหลดทั้งหมด
                </button>
                
                <button
                  onClick={handlePrintAll}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  พิมพ์ทั้งหมด
                </button>
              </>
            )}

            {error && (
              <button
                onClick={handleRetry}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                ลองใหม่
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkQRCodeGenerator;