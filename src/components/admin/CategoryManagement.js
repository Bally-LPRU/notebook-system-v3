import { useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../layout';

const CategoryManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const DEFAULT_CATEGORIES = [
    {
      name: 'คอมพิวเตอร์และอุปกรณ์',
      nameEn: 'Computers & Equipment',
      description: 'อุปกรณ์คอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
      icon: '💻',
      color: '#3B82F6',
      level: 0,
      sortOrder: 1
    },
    {
      name: 'อุปกรณ์โสตทัศนูปกรณ์',
      nameEn: 'Audio Visual Equipment',
      description: 'อุปกรณ์เสียงและภาพ',
      icon: '🎬',
      color: '#10B981',
      level: 0,
      sortOrder: 2
    },
    {
      name: 'เครื่องใช้สำนักงาน',
      nameEn: 'Office Equipment',
      description: 'อุปกรณ์สำนักงานทั่วไป',
      icon: '🖨️',
      color: '#F59E0B',
      level: 0,
      sortOrder: 3
    },
    {
      name: 'เครื่องมือและอุปกรณ์',
      nameEn: 'Tools & Equipment',
      description: 'เครื่องมือและอุปกรณ์ทั่วไป',
      icon: '🔧',
      color: '#8B5CF6',
      level: 0,
      sortOrder: 4
    },
    {
      name: 'เฟอร์นิเจอร์',
      nameEn: 'Furniture',
      description: 'เฟอร์นิเจอร์และอุปกรณ์ตกแต่ง',
      icon: '🪑',
      color: '#EF4444',
      level: 0,
      sortOrder: 5
    }
  ];

  const COMPUTER_SUBCATEGORIES = [
    { name: 'คอมพิวเตอร์ตั้งโต๊ะ', nameEn: 'Desktop Computers', icon: '🖥️', sortOrder: 1 },
    { name: 'โน็ตบุ๊ค', nameEn: 'Laptops', icon: '💻', sortOrder: 2 },
    { name: 'จอมอนิเตอร์', nameEn: 'Monitors', icon: '🖥️', sortOrder: 3 },
    { name: 'เครื่องพิมพ์', nameEn: 'Printers', icon: '🖨️', sortOrder: 4 }
  ];

  const AV_SUBCATEGORIES = [
    { name: 'โปรเจคเตอร์', nameEn: 'Projectors', icon: '📽️', sortOrder: 1 },
    { name: 'กล้องถ่ายรูป', nameEn: 'Cameras', icon: '📷', sortOrder: 2 },
    { name: 'อุปกรณ์เสียง', nameEn: 'Audio Equipment', icon: '🔊', sortOrder: 3 }
  ];

  const seedCategories = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      let output = '🌱 เริ่มต้นเพิ่มประเภทอุปกรณ์...\n\n';
      const categoriesRef = collection(db, 'equipmentCategories');
      const categoryMap = new Map();
      let addedCount = 0;
      let skippedCount = 0;

      // Add main categories
      output += '📁 กำลังเพิ่มประเภทหลัก...\n';
      for (const category of DEFAULT_CATEGORIES) {
        const q = query(categoriesRef, where('name', '==', category.name));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          const docRef = await addDoc(categoriesRef, {
            ...category,
            equipmentCount: 0,
            isActive: true,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
          });
          categoryMap.set(category.name, docRef.id);
          output += `  ✅ เพิ่ม: ${category.name}\n`;
          addedCount++;
        } else {
          categoryMap.set(category.name, snapshot.docs[0].id);
          output += `  ⏭️  มีอยู่แล้ว: ${category.name}\n`;
          skippedCount++;
        }
      }

      // Add computer sub-categories
      output += '\n💻 กำลังเพิ่มประเภทย่อย - คอมพิวเตอร์...\n';
      const computerParentId = categoryMap.get('คอมพิวเตอร์และอุปกรณ์');
      
      if (computerParentId) {
        for (const subCat of COMPUTER_SUBCATEGORIES) {
          const q = query(categoriesRef, where('name', '==', subCat.name));
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            await addDoc(categoriesRef, {
              ...subCat,
              description: `${subCat.nameEn}`,
              color: '#3B82F6',
              parentId: computerParentId,
              level: 1,
              equipmentCount: 0,
              isActive: true,
              createdAt: serverTimestamp(),
              createdBy: user.uid,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid
            });
            output += `  ✅ เพิ่ม: ${subCat.name}\n`;
            addedCount++;
          } else {
            output += `  ⏭️  มีอยู่แล้ว: ${subCat.name}\n`;
            skippedCount++;
          }
        }
      }

      // Add AV sub-categories
      output += '\n🎬 กำลังเพิ่มประเภทย่อย - โสตทัศนูปกรณ์...\n';
      const avParentId = categoryMap.get('อุปกรณ์โสตทัศนูปกรณ์');
      
      if (avParentId) {
        for (const subCat of AV_SUBCATEGORIES) {
          const q = query(categoriesRef, where('name', '==', subCat.name));
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            await addDoc(categoriesRef, {
              ...subCat,
              description: `${subCat.nameEn}`,
              color: '#10B981',
              parentId: avParentId,
              level: 1,
              equipmentCount: 0,
              isActive: true,
              createdAt: serverTimestamp(),
              createdBy: user.uid,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid
            });
            output += `  ✅ เพิ่ม: ${subCat.name}\n`;
            addedCount++;
          } else {
            output += `  ⏭️  มีอยู่แล้ว: ${subCat.name}\n`;
            skippedCount++;
          }
        }
      }

      // Summary
      output += '\n' + '='.repeat(50) + '\n';
      output += '📊 สรุปผลการเพิ่มประเภทอุปกรณ์:\n';
      output += `  ✅ เพิ่มใหม่: ${addedCount} รายการ\n`;
      output += `  ⏭️  มีอยู่แล้ว: ${skippedCount} รายการ\n`;
      output += `  📁 รวมทั้งหมด: ${addedCount + skippedCount} รายการ\n`;
      output += '='.repeat(50) + '\n';
      output += '\n✨ เสร็จสิ้น! ประเภทอุปกรณ์พร้อมใช้งานแล้ว';

      setResult(output);
    } catch (err) {
      console.error('Error seeding categories:', err);
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🌱 เพิ่มประเภทอุปกรณ์
          </h1>
          <p className="text-gray-600 mb-6">
            เพิ่มประเภทอุปกรณ์เริ่มต้นทั้งหมดลงในระบบ
          </p>

          <button
            onClick={seedCategories}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'กำลังเพิ่มประเภท...' : 'เริ่มเพิ่มประเภทอุปกรณ์'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <pre className="text-sm text-green-900 whitespace-pre-wrap font-mono">
                {result}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              📋 ประเภทอุปกรณ์ที่จะเพิ่ม:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-white rounded">
                💻 คอมพิวเตอร์และอุปกรณ์
                <div className="ml-4 mt-1 text-gray-600">
                  - คอมพิวเตอร์ตั้งโต๊ะ, โน็ตบุ๊ค, จอมอนิเตอร์, เครื่องพิมพ์
                </div>
              </div>
              <div className="p-2 bg-white rounded">
                🎬 อุปกรณ์โสตทัศนูปกรณ์
                <div className="ml-4 mt-1 text-gray-600">
                  - โปรเจคเตอร์, กล้องถ่ายรูป, อุปกรณ์เสียง
                </div>
              </div>
              <div className="p-2 bg-white rounded">🖨️ เครื่องใช้สำนักงาน</div>
              <div className="p-2 bg-white rounded">🔧 เครื่องมือและอุปกรณ์</div>
              <div className="p-2 bg-white rounded">🪑 เฟอร์นิเจอร์</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryManagement;
