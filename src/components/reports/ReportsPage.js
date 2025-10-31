import { useState, useEffect } from 'react';
import { Layout } from '../layout';
import { useAuth } from '../../contexts/AuthContext';
import ReportService from '../../services/reportService';
import AdvancedSearchModal from '../search/AdvancedSearchModal';
import { useSavedSearches } from '../../hooks/useSavedSearches';

const ReportsPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [reportFilters, setReportFilters] = useState({});
  
  const {
    savedSearches,
    saveSearch,
    deleteSavedSearch
  } = useSavedSearches('reports');
  
  // Monthly report state
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Popular equipment state
  const [popularEquipment, setPopularEquipment] = useState([]);
  const [popularStartDate, setPopularStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [popularEndDate, setPopularEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Overdue users state
  const [overdueUsers, setOverdueUsers] = useState([]);
  
  // Utilization report state
  const [utilizationReport, setUtilizationReport] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    
    // Load initial data
    loadUtilizationReport();
    loadOverdueUsers();
  }, [isAdmin]);

  const loadMonthlyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await ReportService.generateMonthlyUsageReport(selectedYear, selectedMonth);
      setMonthlyReport(report);
    } catch (err) {
      console.error('Error loading monthly report:', err);
      setError('ไม่สามารถโหลดรายงานรายเดือนได้');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const startDate = new Date(popularStartDate);
      const endDate = new Date(popularEndDate);
      const equipment = await ReportService.generatePopularEquipmentReport(startDate, endDate);
      setPopularEquipment(equipment);
    } catch (err) {
      console.error('Error loading popular equipment:', err);
      setError('ไม่สามารถโหลดรายงานอุปกรณ์ยอดนิยมได้');
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await ReportService.generateOverdueUsersReport();
      setOverdueUsers(users);
    } catch (err) {
      console.error('Error loading overdue users:', err);
      setError('ไม่สามารถโหลดรายงานผู้ใช้คืนล่าช้าได้');
    } finally {
      setLoading(false);
    }
  };

  const loadUtilizationReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await ReportService.generateEquipmentUtilizationReport();
      setUtilizationReport(report);
    } catch (err) {
      console.error('Error loading utilization report:', err);
      setError('ไม่สามารถโหลดรายงานการใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const downloadMonthlyCSV = async () => {
    try {
      await ReportService.downloadMonthlyUsageCSV(selectedYear, selectedMonth);
    } catch (err) {
      console.error('Error downloading monthly CSV:', err);
      setError('ไม่สามารถดาวน์โหลดไฟล์ CSV ได้');
    }
  };

  const downloadPopularEquipmentCSV = async () => {
    try {
      const startDate = new Date(popularStartDate);
      const endDate = new Date(popularEndDate);
      await ReportService.downloadPopularEquipmentCSV(startDate, endDate);
    } catch (err) {
      console.error('Error downloading popular equipment CSV:', err);
      setError('ไม่สามารถดาวน์โหลดไฟล์ CSV ได้');
    }
  };

  const downloadOverdueUsersCSV = async () => {
    try {
      await ReportService.downloadOverdueUsersCSV();
    } catch (err) {
      console.error('Error downloading overdue users CSV:', err);
      setError('ไม่สามารถดาวน์โหลดไฟล์ CSV ได้');
    }
  };

  const handleAdvancedFilters = (filters) => {
    setReportFilters(filters);
    // Apply filters to current report
    switch (activeTab) {
      case 'monthly':
        if (filters.dateFrom) {
          const date = new Date(filters.dateFrom);
          setSelectedYear(date.getFullYear());
          setSelectedMonth(date.getMonth() + 1);
        }
        break;
      case 'popular':
        if (filters.dateFrom) setPopularStartDate(filters.dateFrom);
        if (filters.dateTo) setPopularEndDate(filters.dateTo);
        break;
      default:
        break;
    }
  };

  const handleSaveSearch = async (searchData) => {
    try {
      await saveSearch(searchData);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const handleLoadSearch = (savedSearch) => {
    const filters = savedSearch.filters;
    setReportFilters(filters);
    handleAdvancedFilters(filters);
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
            <p className="text-gray-500">คุณต้องเป็นผู้ดูแลระบบเพื่อดูรายงาน</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'monthly', name: 'รายงานรายเดือน', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'popular', name: 'อุปกรณ์ยอดนิยม', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'overdue', name: 'ผู้ใช้คืนล่าช้า', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' },
    { id: 'utilization', name: 'การใช้งานอุปกรณ์', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  const renderMonthlyReport = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">เลือกช่วงเวลา</h3>
        <div className="flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ปี</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleDateString('th-TH', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadMonthlyReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'สร้างรายงาน'}
          </button>
          {monthlyReport && (
            <button
              onClick={downloadMonthlyCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              ดาวน์โหลด CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {monthlyReport && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            รายงานการใช้งาน {monthlyReport.period.monthName} {monthlyReport.period.year}
          </h3>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{monthlyReport.stats.totalLoanRequests}</div>
              <div className="text-sm text-blue-800">คำขอยืมทั้งหมด</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{monthlyReport.stats.approvedLoans}</div>
              <div className="text-sm text-green-800">อนุมัติแล้ว</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{monthlyReport.stats.totalReservations}</div>
              <div className="text-sm text-yellow-800">การจองทั้งหมด</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{monthlyReport.stats.overdueLoans}</div>
              <div className="text-sm text-red-800">คืนล่าช้า</div>
            </div>
          </div>

          {/* Popular Equipment */}
          {monthlyReport.popularEquipment.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">อุปกรณ์ยอดนิยมในเดือนนี้</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อันดับ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่ออุปกรณ์</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การใช้งาน</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyReport.popularEquipment.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.equipment?.name || 'ไม่ระบุ'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.equipment?.category || 'ไม่ระบุ'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.totalUsage} ครั้ง
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPopularEquipment = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">เลือกช่วงเวลา</h3>
        <div className="flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={popularStartDate}
              onChange={(e) => setPopularStartDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={popularEndDate}
              onChange={(e) => setPopularEndDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadPopularEquipment}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'สร้างรายงาน'}
          </button>
          {popularEquipment.length > 0 && (
            <button
              onClick={downloadPopularEquipmentCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              ดาวน์โหลด CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {popularEquipment.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">อุปกรณ์ยอดนิยม</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อันดับ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่ออุปกรณ์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยี่ห้อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยืม</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จอง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รวม</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popularEquipment.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.equipment?.name || 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.equipment?.category || 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.equipment?.brand || 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.loanCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reservationCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.totalUsage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverdueUsers = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">ผู้ใช้ที่คืนอุปกรณ์ล่าช้า</h3>
          <div className="flex space-x-2">
            <button
              onClick={loadOverdueUsers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
            {overdueUsers.length > 0 && (
              <button
                onClick={downloadOverdueUsersCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                ดาวน์โหลด CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {overdueUsers.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ครบกำหนด</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เกิน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ติดต่อ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueUsers.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.user.firstName} {item.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{item.user.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.equipment.name}</div>
                      <div className="text-sm text-gray-500">{item.equipment.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.expectedReturnDate.toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.daysOverdue} วัน
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{item.user.email}</div>
                      <div>{item.user.phoneNumber}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 text-green-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">ไม่มีผู้ใช้ที่คืนอุปกรณ์ล่าช้า</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderUtilizationReport = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">รายงานการใช้งานอุปกรณ์</h3>
          <button
            onClick={loadUtilizationReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
      </div>

      {/* Results */}
      {utilizationReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equipment Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">สถิติอุปกรณ์</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อุปกรณ์ทั้งหมด</span>
                <span className="text-lg font-semibold text-gray-900">{utilizationReport.equipment.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ว่าง</span>
                <span className="text-lg font-semibold text-green-600">{utilizationReport.equipment.available}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ถูกยืม</span>
                <span className="text-lg font-semibold text-yellow-600">{utilizationReport.equipment.borrowed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ซ่อมบำรุง</span>
                <span className="text-lg font-semibold text-red-600">{utilizationReport.equipment.maintenance}</span>
              </div>
            </div>
          </div>

          {/* Utilization Rates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">อัตราการใช้งาน</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อัตราการใช้งาน</span>
                <span className="text-lg font-semibold text-blue-600">{utilizationReport.utilization.utilizationRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อัตราความพร้อมใช้งาน</span>
                <span className="text-lg font-semibold text-green-600">{utilizationReport.utilization.availabilityRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อัตราการซ่อมบำรุง</span>
                <span className="text-lg font-semibold text-red-600">{utilizationReport.utilization.maintenanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Loan Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">สถิติการยืม</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">คำขอทั้งหมด</span>
                <span className="text-lg font-semibold text-gray-900">{utilizationReport.loans.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">รอการอนุมัติ</span>
                <span className="text-lg font-semibold text-yellow-600">{utilizationReport.loans.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อนุมัติแล้ว</span>
                <span className="text-lg font-semibold text-green-600">{utilizationReport.loans.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">คืนล่าช้า</span>
                <span className="text-lg font-semibold text-red-600">{utilizationReport.loans.overdue}</span>
              </div>
            </div>
          </div>

          {/* Reservation Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">สถิติการจอง</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">การจองทั้งหมด</span>
                <span className="text-lg font-semibold text-gray-900">{utilizationReport.reservations.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">รอการอนุมัติ</span>
                <span className="text-lg font-semibold text-yellow-600">{utilizationReport.reservations.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">อนุมัติแล้ว</span>
                <span className="text-lg font-semibold text-green-600">{utilizationReport.reservations.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">เสร็จสิ้น</span>
                <span className="text-lg font-semibold text-blue-600">{utilizationReport.reservations.completed}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'monthly':
        return renderMonthlyReport();
      case 'popular':
        return renderPopularEquipment();
      case 'overdue':
        return renderOverdueUsers();
      case 'utilization':
        return renderUtilizationReport();
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายงานและสถิติ</h1>
              <p className="mt-2 text-gray-600">
                ดูรายงานการใช้งานระบบและสถิติต่างๆ
              </p>
            </div>
            
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              ตัวกรองขั้นสูง
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.name}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Advanced Filters Modal */}
        <AdvancedSearchModal
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onSearch={handleAdvancedFilters}
          searchType="reports"
          initialFilters={reportFilters}
          savedSearches={savedSearches}
          onSaveSearch={handleSaveSearch}
          onLoadSearch={handleLoadSearch}
          onDeleteSearch={deleteSavedSearch}
        />
      </div>
    </Layout>
  );
};

export default ReportsPage;