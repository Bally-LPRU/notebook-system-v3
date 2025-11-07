import { useState, useEffect } from 'react';
import { Layout } from '../layout';
import EquipmentManagementContainer from '../equipment/EquipmentManagementContainer';

const AdminEquipmentManagement = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            จัดการอุปกรณ์
          </h1>
          <p className="text-gray-600">
            เพิ่ม แก้ไข และจัดการข้อมูลอุปกรณ์ในระบบ
          </p>
        </div>

        {/* Equipment Management Container */}
        <EquipmentManagementContainer />
      </div>
    </Layout>
  );
};

export default AdminEquipmentManagement;
