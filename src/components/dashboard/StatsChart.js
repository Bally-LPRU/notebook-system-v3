import { useState, useEffect } from 'react';
import EquipmentService from '../../services/equipmentService';

const StatsChart = () => {
  const [chartData, setChartData] = useState({
    equipmentByCategory: [],
    loanRequestsByMonth: [],
    equipmentUtilization: []
  });
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('category');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);

        // Get equipment by category
        const equipmentCategories = await EquipmentService.getEquipmentCategories();
        
        // Get equipment stats for utilization
        const equipmentStats = await EquipmentService.getEquipmentStats();
        
        // Calculate utilization data
        const utilizationData = [
          { name: 'ว่าง', value: equipmentStats.available, color: '#10B981' },
          { name: 'ถูกยืม', value: equipmentStats.borrowed, color: '#F59E0B' },
          { name: 'ซ่อมบำรุง', value: equipmentStats.maintenance, color: '#EF4444' },
          { name: 'เลิกใช้', value: equipmentStats.retired, color: '#6B7280' }
        ].filter(item => item.value > 0);

        setChartData({
          equipmentByCategory: equipmentCategories.map((cat, index) => ({
            ...cat,
            color: getColorByIndex(index)
          })),
          equipmentUtilization: utilizationData
        });

      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const getColorByIndex = (index) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
    ];
    return colors[index % colors.length];
  };

  const renderBarChart = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">ไม่มีข้อมูลแสดง</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.count || item.value));

    return (
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 truncate">
                {item.category || item.name}
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-4 relative">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{
                      width: `${((item.count || item.value) / maxValue) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
              <div className="w-8 text-sm font-medium text-gray-900 text-right">
                {item.count || item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">ไม่มีข้อมูลแสดง</p>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.count || item.value), 0);
    let currentAngle = 0;

    return (
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">{title}</h4>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              {data.map((item, index) => {
                const value = item.count || item.value;
                const percentage = (value / total) * 100;
                const angle = (percentage / 100) * 360;
                const radius = 80;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
                const strokeDashoffset = -((currentAngle / 360) * circumference);
                
                currentAngle += angle;

                return (
                  <circle
                    key={index}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-500">รวม</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 truncate">
                {item.category || item.name} ({item.count || item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-4"></div>
                </div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">สถิติและกราฟ</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveChart('category')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeChart === 'category'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ประเภทอุปกรณ์
          </button>
          <button
            onClick={() => setActiveChart('utilization')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeChart === 'utilization'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            การใช้งาน
          </button>
        </div>
      </div>

      {activeChart === 'category' && renderBarChart(
        chartData.equipmentByCategory,
        'จำนวนอุปกรณ์แยกตามประเภท'
      )}

      {activeChart === 'utilization' && renderPieChart(
        chartData.equipmentUtilization,
        'สถานะการใช้งานอุปกรณ์'
      )}
    </div>
  );
};

export default StatsChart;