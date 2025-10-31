import { useAuth } from '../../contexts/AuthContext';
import ResponsiveLayout from './ResponsiveLayout';
import ErrorBoundary from '../common/ErrorBoundary';

const Layout = ({ children }) => {
  const { isAdmin } = useAuth();

  return (
    <ErrorBoundary>
      <ResponsiveLayout showSidebar={isAdmin}>
        {children}
      </ResponsiveLayout>
    </ErrorBoundary>
  );
};

export default Layout;