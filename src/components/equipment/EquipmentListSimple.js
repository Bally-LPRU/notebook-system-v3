import { Layout } from '../layout';
import { useEquipment } from '../../hooks/useEquipment';

const EquipmentListSimple = () => {
  const { equipment, loading, error } = useEquipment({ limit: 12 });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">รายการอุปกรณ์</h1>
        
        {loading && <div className="text-center py-8">กำลังโหลด...</div>}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">เกิดข้อผิดพลาด: {error}</p>
          </div>
        )}
        
        {!loading && !error && equipment.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">ไม่พบอุปกรณ์</p>
          </div>
        )}
        
        {!loading && equipment.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm">{item.brand} {item.model}</p>
                <p className="text-gray-500 text-sm">Serial: {item.serialNumber}</p>
                <p className="text-gray-500 text-sm">สถานที่: {item.location}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                  item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-500">
          แสดง {equipment.length} รายการ
        </div>
      </div>
    </Layout>
  );
};

export default EquipmentListSimple;
