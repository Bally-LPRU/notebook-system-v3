import React, { useState, useEffect } from 'react';

const DraftManager = ({ 
  storageKey, 
  onLoadDraft, 
  onClearDraft,
  className = '' 
}) => {
  const [draftData, setDraftData] = useState(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  useEffect(() => {
    // Check for existing draft on mount
    const checkForDraft = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const draftAge = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (draftAge < maxAge) {
            setDraftData(parsed);
            setShowDraftPrompt(true);
          } else {
            // Remove old draft
            localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.warn('Failed to check for draft:', error);
      }
    };

    if (storageKey) {
      checkForDraft();
    }
  }, [storageKey]);

  const handleLoadDraft = () => {
    if (draftData && onLoadDraft) {
      onLoadDraft(draftData.data);
      setShowDraftPrompt(false);
    }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      if (onClearDraft) {
        onClearDraft();
      }
      setShowDraftPrompt(false);
      setDraftData(null);
    } catch (error) {
      console.warn('Failed to discard draft:', error);
    }
  };

  const formatDraftAge = (timestamp) => {
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(age / (1000 * 60 * 60));
    const days = Math.floor(age / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} วันที่แล้ว`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมงที่แล้ว`;
    } else if (minutes > 0) {
      return `${minutes} นาทีที่แล้ว`;
    } else {
      return 'เมื่อสักครู่';
    }
  };

  if (!showDraftPrompt || !draftData) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            พบข้อมูลที่บันทึกไว้
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>
              เราพบข้อมูลที่คุณกรอกไว้เมื่อ {formatDraftAge(draftData.timestamp)} 
              คุณต้องการโหลดข้อมูลเดิมหรือเริ่มใหม่?
            </p>
          </div>
          <div className="mt-3 flex space-x-3">
            <button
              type="button"
              onClick={handleLoadDraft}
              className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              โหลดข้อมูลเดิม
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="bg-white px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 border border-yellow-300 transition-colors"
            >
              เริ่มใหม่
            </button>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowDraftPrompt(false)}
            className="bg-yellow-50 rounded-md inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
          >
            <span className="sr-only">ปิด</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftManager;