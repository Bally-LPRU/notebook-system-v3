import { lazy, Suspense } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { SkeletonCard, SkeletonList, SkeletonTable, SkeletonStats } from '../common/SkeletonLoader';

// Lazy load components for code splitting
export const LazyDashboard = lazy(() => import('../Dashboard'));
export const LazyEquipmentList = lazy(() => import('../equipment/EquipmentList'));
export const LazyEquipmentManagement = lazy(() => import('../equipment/EquipmentManagement'));
export const LazyLoanRequestList = lazy(() => import('../admin/LoanRequestList'));
export const LazyBorrowedEquipmentList = lazy(() => import('../admin/BorrowedEquipmentList'));
export const LazyUserApprovalList = lazy(() => import('../admin/UserApprovalList'));
export const LazyReservationPage = lazy(() => import('../reservations/ReservationPage'));
export const LazyReservationManagement = lazy(() => import('../reservations/ReservationManagement'));
export const LazyMyRequests = lazy(() => import('../requests/MyRequests'));
export const LazyAdminDashboard = lazy(() => import('../admin/AdminDashboard'));

// Wrapper component with suspense and error boundary
export const LazyWrapper = ({ 
  children, 
  fallback = <LoadingSpinner size="lg" />,
  skeletonType = 'default',
  className = ''
}) => {
  const getSkeleton = () => {
    switch (skeletonType) {
      case 'card':
        return (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        );
      case 'list':
        return <SkeletonList items={5} className={className} />;
      case 'table':
        return <SkeletonTable rows={5} columns={4} className={className} />;
      case 'stats':
        return <SkeletonStats items={4} className={className} />;
      default:
        return (
          <div className={`flex justify-center items-center py-12 ${className}`}>
            {fallback}
          </div>
        );
    }
  };

  return (
    <Suspense fallback={getSkeleton()}>
      {children}
    </Suspense>
  );
};

// Pre-configured lazy components with appropriate skeletons
export const LazyDashboardWithSkeleton = () => (
  <LazyWrapper skeletonType="stats">
    <LazyDashboard />
  </LazyWrapper>
);

export const LazyEquipmentListWithSkeleton = () => (
  <LazyWrapper skeletonType="card">
    <LazyEquipmentList />
  </LazyWrapper>
);

export const LazyEquipmentManagementWithSkeleton = () => (
  <LazyWrapper skeletonType="table">
    <LazyEquipmentManagement />
  </LazyWrapper>
);

export const LazyLoanRequestListWithSkeleton = () => (
  <LazyWrapper skeletonType="list">
    <LazyLoanRequestList />
  </LazyWrapper>
);

export const LazyBorrowedEquipmentListWithSkeleton = () => (
  <LazyWrapper skeletonType="list">
    <LazyBorrowedEquipmentList />
  </LazyWrapper>
);

export const LazyUserApprovalListWithSkeleton = () => (
  <LazyWrapper skeletonType="list">
    <LazyUserApprovalList />
  </LazyWrapper>
);

export const LazyReservationPageWithSkeleton = () => (
  <LazyWrapper skeletonType="default">
    <LazyReservationPage />
  </LazyWrapper>
);

export const LazyReservationManagementWithSkeleton = () => (
  <LazyWrapper skeletonType="list">
    <LazyReservationManagement />
  </LazyWrapper>
);

export const LazyMyRequestsWithSkeleton = () => (
  <LazyWrapper skeletonType="list">
    <LazyMyRequests />
  </LazyWrapper>
);

export const LazyAdminDashboardWithSkeleton = () => (
  <LazyWrapper skeletonType="stats">
    <LazyAdminDashboard />
  </LazyWrapper>
);

// Preload function for critical routes
export const preloadCriticalComponents = () => {
  // Preload dashboard and equipment list as they are most commonly accessed
  LazyDashboard();
  LazyEquipmentList();
};

// Preload function for admin components
export const preloadAdminComponents = () => {
  LazyAdminDashboard();
  LazyLoanRequestList();
  LazyUserApprovalList();
  LazyEquipmentManagement();
};

// Hook for preloading components on user interaction
export const usePreloadComponents = () => {
  const preloadComponent = (componentName) => {
    switch (componentName) {
      case 'dashboard':
        LazyDashboard();
        break;
      case 'equipment':
        LazyEquipmentList();
        break;
      case 'equipment-management':
        LazyEquipmentManagement();
        break;
      case 'loan-requests':
        LazyLoanRequestList();
        break;
      case 'borrowed-equipment':
        LazyBorrowedEquipmentList();
        break;
      case 'user-approval':
        LazyUserApprovalList();
        break;
      case 'reservations':
        LazyReservationPage();
        break;
      case 'reservation-management':
        LazyReservationManagement();
        break;
      case 'my-requests':
        LazyMyRequests();
        break;
      case 'admin-dashboard':
        LazyAdminDashboard();
        break;
      default:
        console.warn(`Unknown component name for preloading: ${componentName}`);
    }
  };

  return { preloadComponent };
};

export default LazyWrapper;