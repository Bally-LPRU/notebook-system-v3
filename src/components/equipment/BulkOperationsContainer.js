import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BulkEditModal from './BulkEditModal';
import BulkDeleteModal from './BulkDeleteModal';
import BulkOperationsService from '../../services/bulkOperationsService';
import { useNotification } from '../../contexts/NotificationContext';

const BulkOperationsContainer = ({
  selectedEquipment = [],
  onOperationComplete,
  children
}) => {
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();
  
  const [modals, setModals] = useState({
    bulkEdit: false,
    bulkDelete: false,
    bulkExport: false
  });
  
  const [loading, setLoading] = useState({
    bulkEdit: false,
    bulkDelete: false,
    bulkExport: false
  });

  // Memoize modal control functions
  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const setModalLoading = useCallback((modalName, isLoading) => {
    setLoading(prev => ({ ...prev, [modalName]: isLoading }));
  }, []);

  // Memoize bulk operation handlers
  const handleBulkEdit = useCallback(async (equipmentList, updateData, progressCallback) => {
    setModalLoading('bulkEdit', true);
    
    try {
      const result = await BulkOperationsService.bulkUpdateEquipment(
        equipmentList, 
        updateData, 
        progressCallback
      );
      
      showNotification({
        type: 'success',
        title: 'อัปเดตสำเร็จ',
        message: `อัปเดตอุปกรณ์สำเร็จ ${result.updated} รายการ`
      });
      
      if (onOperationComplete) {
        onOperationComplete('bulkEdit', result);
      }
      
    } catch (error) {
      console.error('Bulk edit error:', error);
      showNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: error.message
      });
      throw error;
    } finally {
      setModalLoading('bulkEdit', false);
    }
  }, [showNotification, onOperationComplete, setModalLoading]);

  const handleBulkDelete = useCallback(async (equipmentList, progressCallback) => {
    setModalLoading('bulkDelete', true);
    
    try {
      const result = await BulkOperationsService.bulkDeleteEquipment(
        equipmentList, 
        progressCallback
      );
      
      showNotification({
        type: 'success',
        title: 'ลบสำเร็จ',
        message: `ลบอุปกรณ์สำเร็จ ${result.deleted} รายการ`
      });
      
      if (onOperationComplete) {
        onOperationComplete('bulkDelete', result);
      }
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      showNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: error.message
      });
      throw error;
    } finally {
      setModalLoading('bulkDelete', false);
    }
  }, [showNotification, onOperationComplete, setModalLoading]);

  const handleBulkStatusUpdate = useCallback((equipmentList) => {
    // For now, open the bulk edit modal with status pre-selected
    // In a more advanced implementation, this could be a separate modal
    openModal('bulkEdit');
  }, [openModal]);

  const handleBulkLocationUpdate = useCallback((equipmentList) => {
    // For now, open the bulk edit modal with location pre-selected
    // In a more advanced implementation, this could be a separate modal
    openModal('bulkEdit');
  }, [openModal]);

  const handleBulkExport = useCallback(async (equipmentList) => {
    setModalLoading('bulkExport', true);
    
    try {
      const result = await BulkOperationsService.exportEquipmentData(
        equipmentList, 
        'excel'
      );
      
      // In a real implementation, this would trigger a file download
      console.log('Export data:', result);
      
      showNotification({
        type: 'success',
        title: 'ส่งออกสำเร็จ',
        message: `ส่งออกข้อมูลอุปกรณ์ ${result.count} รายการ`
      });
      
      if (onOperationComplete) {
        onOperationComplete('bulkExport', result);
      }
      
    } catch (error) {
      console.error('Bulk export error:', error);
      showNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: error.message || 'ไม่สามารถส่งออกข้อมูลได้'
      });
    } finally {
      setModalLoading('bulkExport', false);
    }
  }, [showNotification, onOperationComplete, setModalLoading]);

  const handleGenerateQRCodes = useCallback(async (equipmentList) => {
    try {
      const result = await BulkOperationsService.generateBulkQRCodes(equipmentList);
      
      // In a real implementation, this would generate and download QR codes
      console.log('QR Codes data:', result);
      
      showNotification({
        type: 'success',
        title: 'สร้าง QR Code สำเร็จ',
        message: `สร้าง QR Code สำหรับอุปกรณ์ ${result.length} รายการ`
      });
      
      if (onOperationComplete) {
        onOperationComplete('generateQRCodes', result);
      }
      
    } catch (error) {
      console.error('Generate QR codes error:', error);
      showNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: error.message || 'ไม่สามารถสร้าง QR Code ได้'
      });
    }
  }, [showNotification, onOperationComplete]);

  const handlePrintLabels = useCallback(async (equipmentList) => {
    try {
      // In a real implementation, this would generate printable labels
      const labelData = equipmentList.map(equipment => ({
        id: equipment.id,
        name: equipment.name,
        equipmentNumber: equipment.equipmentNumber,
        location: equipment.location,
        qrCode: equipment.qrCode || `QR-${equipment.id}`
      }));
      
      console.log('Label data:', labelData);
      
      showNotification({
        type: 'success',
        title: 'เตรียมพิมพ์ป้ายชื่อ',
        message: `เตรียมป้ายชื่อสำหรับอุปกรณ์ ${labelData.length} รายการ`
      });
      
      if (onOperationComplete) {
        onOperationComplete('printLabels', labelData);
      }
      
    } catch (error) {
      console.error('Print labels error:', error);
      showNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: error.message || 'ไม่สามารถเตรียมป้ายชื่อได้'
      });
    }
  }, [showNotification, onOperationComplete]);

  // Memoize children with props to avoid unnecessary re-renders
  const childrenWithProps = useMemo(() => children({
    onBulkEdit: isAdmin ? () => openModal('bulkEdit') : null,
    onBulkDelete: isAdmin ? () => openModal('bulkDelete') : null,
    onBulkExport: handleBulkExport,
    onBulkStatusUpdate: isAdmin ? handleBulkStatusUpdate : null,
    onBulkLocationUpdate: isAdmin ? handleBulkLocationUpdate : null,
    onGenerateQRCodes: handleGenerateQRCodes,
    onPrintLabels: handlePrintLabels
  }), [children, isAdmin, openModal, handleBulkExport, handleBulkStatusUpdate, handleBulkLocationUpdate, handleGenerateQRCodes, handlePrintLabels]);

  return (
    <>
      {childrenWithProps}
      
      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={modals.bulkEdit}
        onClose={() => closeModal('bulkEdit')}
        selectedEquipment={selectedEquipment}
        onSave={handleBulkEdit}
        loading={loading.bulkEdit}
      />
      
      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={modals.bulkDelete}
        onClose={() => closeModal('bulkDelete')}
        selectedEquipment={selectedEquipment}
        onConfirm={handleBulkDelete}
        loading={loading.bulkDelete}
      />
    </>
  );
};

export default BulkOperationsContainer;