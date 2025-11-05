import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileStatusDisplay from './ProfileStatusDisplay';

/**
 * Page component for users with pending approval status
 * Implements requirements 8.5, 2.4, 2.5
 */
const PendingApprovalPage = () => {
  const { userProfile } = useAuth();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ProfileStatusDisplay 
      profile={userProfile}
      onRetry={handleRetry}
      showActions={true}
    />
  );
};

export default PendingApprovalPage;