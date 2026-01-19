/**
 * ReturnProcessModal Component
 * Modal for processing equipment returns with condition assessment
 * Requirements: 5.2, 5.3
 */
import { useState, useEffect } from 'react';

// Equipment condition options
const EQUIPMENT_CONDITIONS = {
  GOOD: 'good',
  DAMAGED: 'damaged',
  MISSING_PARTS: 'missing_parts'
};

const CONDITION_LABELS = {
  [EQUIPMENT_CONDITIONS.GOOD]: 'สมบูรณ์ดี',
  [EQUIPMENT_CONDITIONS.DAMAGED]: 'มีความเสียหาย',
  [EQUIPMENT_CONDITIONS.MISSING_PARTS]: 'ขาดอุปกรณ์เสริม'
};

const CONDITION_DESCRIPTIONS = {
  [EQUIPMENT_CONDITIONS.GOOD]: 'อุปกรณ์อยู่ในสภาพดี พร้อมใช้งานต่อได้ทันที',
  [EQUIPMENT_CONDITIONS.DAMAGED]: 'อุปกรณ์มีความเสียหาย ต้องส่งซ่อมก่อนใช้งาน',
  [EQUIPMENT_CONDITIONS.MISSING_PARTS]: 'อุปกรณ์เสริมหรือชิ้นส่วนบางอย่างหายไป'
};

const ReturnProcessModal = ({ isOpen, loan, onConfirm, onClose, loading = false }) => {
  const [condition, setCondition] = useState(EQUIPMENT_CONDITIONS.GOOD);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCondition(EQUIPMENT_CONDITIONS.GOOD);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !loan) return null;

  // Helper functions
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateDaysOverdue = () => {
    if (!loan.expectedReturnDate) return 0;
    const returnDate = loan.expectedReturnDate.toDate ? loan.expectedReturnDate.toDate() : new Date(loan.expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - returnDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const equipmentName = loan.equipmentSnapshot?.name || loan.equipmentName || 'ไม่ทราบชื่ออุปกรณ์';
  const userName = loan.userSnapshot?.displayName || loan.userName || 'ไม่ทราบชื่อ';
  const equipmentImage = loan.equipmentSnapshot?.imageUrl || loan.equipmentSnapshot?.imageURL;
  const daysOverdue = calculateDaysOverdue();
  const isOverdue = daysOverdue > 0;

  const handleConfirm = async () => {
    // Validate notes for damaged/missing_parts conditions
    if (condition !== EQUIPMENT_CONDITIONS.GOOD && (!notes || notes.trim().length < 10)) {
      setError('กรุณาระบุรายละเอียดความเสียหายหรือชิ้นส่วนที่หายไป (อย่างน้อย 10 ตัวอักษร)');
      return;
    }

    setError('');
    
    const returnData = {
      condition,
      notes: notes.trim(),
      returnedAt: new Date()
    };

    await onConfirm(returnData);
  };

  const handleClose = () => {
    setCondition(EQUIPMENT_CONDITIONS.GOOD);
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">รับคืนอุปกรณ์</h3>
                <p className="text-sm text-gray-500">ตรวจสอบสภาพและบันทึกการคืน</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Loan Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              {equipmentImage ? (
                <img
                  src={equipmentImage}
                  alt={equipmentName}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{equipmentName}</p>
                  {isOverdue && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                      ค้างคืน {daysOverdue} วัน
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">ผู้ยืม: {userName}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>ยืม: {formatDate(loan.borrowDate)}</span>
                  <span className={isOverdue ? 'text-rose-600 font-medium' : ''}>
                    กำหนดคืน: {formatDate(loan.expectedReturnDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Condition Assessment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              สภาพอุปกรณ์ <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-3">
              {Object.entries(EQUIPMENT_CONDITIONS).map(([key, value]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    condition === value
                      ? value === EQUIPMENT_CONDITIONS.GOOD
                        ? 'border-emerald-500 bg-emerald-50'
                        : value === EQUIPMENT_CONDITIONS.DAMAGED
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={value}
                    checked={condition === value}
                    onChange={(e) => { setCondition(e.target.value); setError(''); }}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {value === EQUIPMENT_CONDITIONS.GOOD && (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {value === EQUIPMENT_CONDITIONS.DAMAGED && (
                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      {value === EQUIPMENT_CONDITIONS.MISSING_PARTS && (
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className={`font-medium ${
                        condition === value
                          ? value === EQUIPMENT_CONDITIONS.GOOD
                            ? 'text-emerald-700'
                            : value === EQUIPMENT_CONDITIONS.DAMAGED
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          : 'text-gray-900'
                      }`}>
                        {CONDITION_LABELS[value]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {CONDITION_DESCRIPTIONS[value]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div className="mb-6">
            <label htmlFor="returnNotes" className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ {condition !== EQUIPMENT_CONDITIONS.GOOD && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              id="returnNotes"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setError(''); }}
              rows={3}
              placeholder={
                condition === EQUIPMENT_CONDITIONS.GOOD
                  ? "หมายเหตุเพิ่มเติม (ถ้ามี)..."
                  : condition === EQUIPMENT_CONDITIONS.DAMAGED
                    ? "กรุณาระบุรายละเอียดความเสียหาย..."
                    : "กรุณาระบุชิ้นส่วนที่หายไป..."
              }
              className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all ${
                error ? 'border-rose-300 bg-rose-50' : 'border-gray-200'
              }`}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-2">
              {error ? (
                <p className="text-xs text-rose-600">{error}</p>
              ) : condition !== EQUIPMENT_CONDITIONS.GOOD ? (
                <p className="text-xs text-gray-500">ขั้นต่ำ 10 ตัวอักษร</p>
              ) : (
                <span></span>
              )}
              <p className="text-xs text-gray-400">{notes.length}/500</p>
            </div>
          </div>

          {/* Warning for damaged/missing */}
          {condition !== EQUIPMENT_CONDITIONS.GOOD && (
            <div className={`rounded-xl p-4 mb-6 ${
              condition === EQUIPMENT_CONDITIONS.DAMAGED
                ? 'bg-rose-50 border border-rose-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  condition === EQUIPMENT_CONDITIONS.DAMAGED ? 'text-rose-600' : 'text-amber-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className={`text-sm ${
                  condition === EQUIPMENT_CONDITIONS.DAMAGED ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  <p className="font-medium">
                    {condition === EQUIPMENT_CONDITIONS.DAMAGED
                      ? 'อุปกรณ์จะถูกส่งซ่อมบำรุง'
                      : 'จะมีการบันทึกชิ้นส่วนที่หายไป'}
                  </p>
                  <p className="mt-1 opacity-80">
                    {condition === EQUIPMENT_CONDITIONS.DAMAGED
                      ? 'ระบบจะสร้างรายงานความเสียหายและแจ้งผู้ดูแลระบบโดยอัตโนมัติ'
                      : 'ระบบจะบันทึกรายการชิ้นส่วนที่หายไปและแจ้งผู้ดูแลระบบ'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success message for good condition */}
          {condition === EQUIPMENT_CONDITIONS.GOOD && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-emerald-700">
                  <p className="font-medium">อุปกรณ์พร้อมใช้งาน</p>
                  <p className="mt-1 opacity-80">
                    อุปกรณ์จะถูกเปลี่ยนสถานะเป็น "พร้อมใช้งาน" และสามารถให้ยืมได้ทันที
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ยืนยันการรับคืน
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnProcessModal;
export { EQUIPMENT_CONDITIONS, CONDITION_LABELS };
