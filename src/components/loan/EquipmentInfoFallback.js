/**
 * Equipment Info Fallback Component
 * 
 * Displays equipment information with fallback handling when data is missing.
 * Provides retry mechanism and shows basic info from loan request.
 */

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import EquipmentService from '../../services/equipmentService';

/**
 * EquipmentInfoFallback Component
 * @param {Object} props - Component props
 * @param {Object} props.equipment - Equipment data (may be null)
 * @param {string} props.equipmentId - Equipment ID from loan request
 * @param {Function} props.onEquipmentLoaded - Callback when equipment is loaded
 * @param {boolean} props.showRetry - Show retry button (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const EquipmentInfoFallback = ({ 
  equipment, 
  equipmentId, 
  onEquipmentLoaded,
  showRetry = true,
  className = '' 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRetry = async () => {
    if (!equipmentId) return;

    setLoading(true);
    setError(null);

    try {
      const equipmentData = await EquipmentService.getEquipmentById(equipmentId);
      if (equipmentData && onEquipmentLoaded) {
        onEquipmentLoaded(equipmentData);
      } else {
        setError('ไม่พบข้อมูลอุปกรณ์');
      }
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // If equipment data exists, display it
  if (equipment) {
    return (
      <div className={`flex items-start space-x-3 ${className}`}>
        {equipment.imageURL || (equipment.images && equipment.images.length > 0) ? (
          <img
            src={equipment.imageURL || equipment.images[0].url || equipment.images[0]}
            alt={equipment.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = '/placeholder-equipment.png';
            }}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <InformationCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {equipment.name}
          </p>
          {equipment.brand && (
            <p className="text-sm text-gray-500">
              {equipment.brand} {equipment.model && `- ${equipment.model}`}
            </p>
          )}
          {equipment.serialNumber && (
            <p className="text-xs text-gray-400 mt-1">
              S/N: {equipment.serialNumber}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback UI when equipment data is missing
  return (
    <div className={`rounded-lg border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'} p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {error ? (
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          ) : (
            <InformationCircleIcon className="w-6 h-6 text-yellow-600" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${error ? 'text-red-800' : 'text-yellow-800'}`}>
            {error || 'ไม่พบข้อมูลอุปกรณ์'}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            {equipmentId ? (
              <>
                <p className="mb-2">รหัสอุปกรณ์: <span className="font-mono text-xs">{equipmentId}</span></p>
                {showRetry && (
                  <button
                    onClick={handleRetry}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                        กำลังโหลด...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                        โหลดข้อมูลใหม่
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <p>ไม่มีรหัสอุปกรณ์</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentInfoFallback;
