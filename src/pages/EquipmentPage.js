import { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from '../components/layout';

// Dynamic import to force client-side only rendering
const EquipmentPageClient = lazy(() => import('./EquipmentPageClient'));

/**
 * Equipment Page Wrapper
 * Uses dynamic import to ensure client-side only rendering
 * This prevents hydration errors completely
 */
const EquipmentPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Layout>
      {mounted ? (
        <Suspense fallback={
          <div className="max-w-7xl mx-auto p-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">กำลังโหลด...</p>
            </div>
          </div>
        }>
          <EquipmentPageClient />
        </Suspense>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EquipmentPage;
