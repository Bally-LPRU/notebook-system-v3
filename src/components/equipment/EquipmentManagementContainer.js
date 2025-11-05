import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EquipmentListContainer from './EquipmentListContainer';
import EquipmentSearch from './EquipmentSearch';
import BulkActionBar from './BulkActionBar';
import BulkQRCodeGenerator from './BulkQRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';
import LabelPrintingModal from './LabelPrintingModal';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { useEquipmentSearch } from '../../hooks/useEquipmentSearch';
import EquipmentManagementService from '../../services/equipmentManagementService';
import { CameraIcon, QrCodeIcon, PlusIcon } from 'lucide-react';

const EquipmentManagementContainer = ({
  onAddEquipment,
  onEditEquipment,
  onViewEquipment,
  className = ''
}) => {
  const { isAdmin, user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // QR Code related states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBulkQRGenerator, setShowBulkQRGenerator] = useState(false);
  const [showLabelPrinting, setShowLabelPrinting] = useState(false);
  const [scannerError, setScannerError] = useState(null);

  // Search and filters
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    handleSearch,
    clearSearch
  } = useEquipmentSearch();

  const {
    selectedItems,
    isAllSelected,
    handleSelectItem,
    handleSelectAll,
    handleClearSelection,
    getSelectedEquipment
  } = useBulkSelection(equipment);

  // Load equipment data
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await EquipmentManagementService.getEquipmentList(filters);
      setEquipment(result.equipment);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadEquipment();
  };

  // QR Code Scanner handlers
  const handleOpenQRScanner = () => {
    setScannerError(null);
    setShowQRScanner(true);
  };

  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
    setScannerError(null);
  };

  const handleQRScan = async (scanResult) => {
    try {
      if (scanResult.type === 'equipment' || scanResult.type === 'equipment_url') {
        const equipmentId = scanResult.equipmentId || scanResult.data?.id;
        
        if (equipmentId) {
          // Find equipment in current list or load it
          let foundEquipment = equipment.find(eq => eq.id === equipmentId);
          
          if (!foundEquipment) {
            // Try to load equipment from service
            foundEquipment = await EquipmentManagementService.getEquipmentById(equipmentId);
          }
          
          if (foundEquipment) {
            onViewEquipment(foundEquipment);
          } else {
            setScannerError('ไม่พบอุปกรณ์ที่สแกน');
          }
        } else {
          setScannerError('QR Code ไม่ถูกต้อง');
        }
      } else {
        setScannerError('QR Code นี้ไม่ใช่ของอุปกรณ์');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setScannerError('เกิดข้อผิดพลาดในการประมวลผล QR Code');
    }
  };

  const handleQRScanError = (error) => {
    console.error('QR Scanner error:', error);
    setScannerError(error.message);
  };

  // Bulk QR Code Generation
  const handleOpenBulkQRGenerator = () => {
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกอุปกรณ์ที่ต้องการสร้าง QR Code');
      return;
    }
    setShowBulkQRGenerator(true);
  };

  const handleCloseBulkQRGenerator = () => {
    setShowBulkQRGenerator(false);
  };

  const handleBulkQRComplete = (results) => {
    console.log('Bulk QR generation completed:', results);
    
    // Update equipment list with new QR codes
    const successfulResults = results.filter(result => result.success);
    if (successfulResults.length > 0) {
      setEquipment(prevEquipment => 
        prevEquipment.map(eq => {
          const result = successfulResults.find(r => r.equipmentId === eq.id);
          if (result) {
            return {
              ...eq,
              qrCode: result.qrCode
            };
          }
          return eq;
        })
      );
    }
    
    // Clear selection after bulk operation
    handleClearSelection();
  };

  // Bulk Actions
  const handleBulkEdit = (selectedEquipment) => {
    console.log('Bulk edit:', selectedEquipment);
    // Implement bulk edit modal
  };

  const handleBulkDelete = (selectedEquipment) => {
    console.log('Bulk delete:', selectedEquipment);
    // Implement bulk delete confirmation
  };

  const handleBulkExport = (selectedEquipment) => {
    console.log('Bulk export:', selectedEquipment);
    // Implement bulk export functionality
  };

  const handleBulkStatusUpdate = (selectedEquipment) => {
    console.log('Bulk status update:', selectedEquipment);
    // Implement bulk status update modal
  };

  const handleBulkLocationUpdate = (selectedEquipment) => {
    console.log('Bulk location update:', selectedEquipment);
    // Implement bulk location update modal
  };

  const handlePrintLabels = (selectedEquipment) => {
    if (selectedEquipment.length === 0) {
      alert('กรุณาเลือกอุปกรณ์ที่ต้องการพิมพ์ป้าย');
      return;
    }
    setShowLabelPrinting(true);
  };

  const handleCloseLabelPrinting = () => {
    setShowLabelPrinting(false);
  };

  // Get current equipment list (search results or all equipment)
  const currentEquipment = searchQuery ? searchResults : equipment;
  const currentLoading = searchQuery ? isSearching : loading;
  const currentError = searchQuery ? searchError : error;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
          <p className="text-gray-600">จัดการข้อมูลอุปกรณ์และสร้าง QR Code</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* QR Scanner Button */}
          <button
            onClick={handleOpenQRScanner}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            สแกน QR Code
          </button>

          {/* Add Equipment Button */}
          {isAdmin && (
            <button
              onClick={onAddEquipment}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              เพิ่มอุปกรณ์
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <EquipmentSearch
        onSearch={handleSearch}
        onClear={clearSearch}
        loading={isSearching}
        placeholder="ค้นหาอุปกรณ์ด้วยชื่อ, ยี่ห้อ, รุ่น, หรือหมายเลขครุภัณฑ์"
      />

      {/* Bulk Action Bar */}
      {selectedItems.length > 0 && (
        <BulkActionBar
          selectedItems={selectedItems}
          totalItems={currentEquipment.length}
          onBulkEdit={() => handleBulkEdit(getSelectedEquipment())}
          onBulkDelete={() => handleBulkDelete(getSelectedEquipment())}
          onBulkExport={() => handleBulkExport(getSelectedEquipment())}
          onBulkStatusUpdate={() => handleBulkStatusUpdate(getSelectedEquipment())}
          onBulkLocationUpdate={() => handleBulkLocationUpdate(getSelectedEquipment())}
          onGenerateQRCodes={handleOpenBulkQRGenerator}
          onPrintLabels={() => handlePrintLabels(getSelectedEquipment())}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Equipment List */}
      <EquipmentListContainer
        equipment={currentEquipment}
        loading={currentLoading}
        error={currentError}
        pagination={pagination}
        onRefresh={handleRefresh}
        onEdit={onEditEquipment}
        onView={onViewEquipment}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        showBulkActions={isAdmin}
      />

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={handleCloseQRScanner}
        onScan={handleQRScan}
        onError={handleQRScanError}
        title="สแกน QR Code อุปกรณ์"
      />

      {/* Bulk QR Code Generator Modal */}
      <BulkQRCodeGenerator
        isOpen={showBulkQRGenerator}
        onClose={handleCloseBulkQRGenerator}
        selectedEquipment={getSelectedEquipment()}
        onComplete={handleBulkQRComplete}
      />

      {/* Label Printing Modal */}
      <LabelPrintingModal
        isOpen={showLabelPrinting}
        onClose={handleCloseLabelPrinting}
        selectedEquipment={getSelectedEquipment()}
        title="พิมพ์ป้ายอุปกรณ์"
      />

      {/* Scanner Error Display */}
      {scannerError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{scannerError}</span>
            <button
              onClick={() => setScannerError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagementContainer;