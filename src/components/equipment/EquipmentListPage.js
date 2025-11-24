import { Layout } from '../layout';
import EquipmentListContainer from './EquipmentListContainer';

/**
 * Equipment List Page for regular users
 * Wraps EquipmentListContainer with Layout
 */
const EquipmentListPage = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">รายการอุปกรณ์</h1>
          <p className="text-gray-600">ดูรายการอุปกรณ์ที่พร้อมให้บริการ</p>
        </div>
        
        <EquipmentListContainer />
      </div>
    </Layout>
  );
};

export default EquipmentListPage;
