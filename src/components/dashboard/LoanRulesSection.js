/**
 * LoanRulesSection Component
 * Updated with pastel colors and animations
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';

const formatTime = (time) => time || null;

const formatDateShort = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const getNextClosedDate = (closedDates) => {
  if (!closedDates || !Array.isArray(closedDates)) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const upcoming = closedDates
    .filter(item => {
      const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
      return date >= today && date <= thirtyDaysFromNow;
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    });
  
  return upcoming.length > 0 ? upcoming[0] : null;
};

const LoanRulesSection = ({ settings, closedDates = [], loading = false }) => {
  const nextClosedDate = useMemo(() => getNextClosedDate(closedDates), [closedDates]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded-full w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded-xl"></div>
            <div className="h-10 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const { loanReturnStartTime, loanReturnEndTime, lunchBreak } = settings || {};
  const hasReturnTimeRestriction = loanReturnStartTime && loanReturnEndTime;
  const hasLunchBreak = lunchBreak?.enabled && lunchBreak?.startTime && lunchBreak?.endTime;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
        กฎระเบียบการยืม
      </h3>

      <div className="space-y-3">
        {/* Return Time & Lunch Break */}
        <div className="flex flex-wrap gap-2">
          {hasReturnTimeRestriction && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                คืนได้ {formatTime(loanReturnStartTime)}-{formatTime(loanReturnEndTime)} น.
              </span>
            </div>
          )}
          {hasLunchBreak && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl border border-orange-100">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-orange-700">
                พักเที่ยง {formatTime(lunchBreak.startTime)}-{formatTime(lunchBreak.endTime)} น.
              </span>
            </div>
          )}
        </div>

        {/* Important Rules */}
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium text-amber-700">กรุณาคืนอุปกรณ์ตามกำหนด</span>
        </div>

        {/* Next Closed Date */}
        <div className="pt-3 border-t border-gray-100">
          {nextClosedDate ? (
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-800">วันปิดทำการถัดไป</p>
                <p className="text-sm text-rose-600">
                  {formatDateShort(nextClosedDate.date)}
                  {nextClosedDate.reason && ` - ${nextClosedDate.reason}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">เปิดให้บริการปกติ</p>
                <p className="text-sm text-emerald-600">ไม่มีวันปิดทำการใน 30 วันข้างหน้า</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

LoanRulesSection.propTypes = {
  settings: PropTypes.shape({
    maxAdvanceBookingDays: PropTypes.number,
    loanReturnStartTime: PropTypes.string,
    loanReturnEndTime: PropTypes.string,
    lunchBreak: PropTypes.shape({
      enabled: PropTypes.bool,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      message: PropTypes.string
    })
  }),
  closedDates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      reason: PropTypes.string
    })
  ),
  loading: PropTypes.bool
};

export default LoanRulesSection;
