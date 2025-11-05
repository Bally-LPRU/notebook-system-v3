import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionService from '../../services/permissionService';

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */
const PermissionGuard = ({ 
  permission, 
  permissions, 
  requireAll = false,
  role,
  fallback = null,
  children,
  showFallback = true 
}) => {
  const userPermissions = usePermissions();

  // Check if user has required permissions
  const hasAccess = React.useMemo(() => {
    // If specific role is required
    if (role) {
      return userPermissions.role === role || userPermissions.role === PermissionService.ROLES.ADMIN;
    }

    // If single permission is required
    if (permission) {
      return userPermissions.hasPermission(permission);
    }

    // If multiple permissions are required
    if (permissions && permissions.length > 0) {
      return requireAll 
        ? userPermissions.hasAllPermissions(permissions)
        : userPermissions.hasAnyPermission(permissions);
    }

    // No permission requirements specified
    return true;
  }, [userPermissions, permission, permissions, requireAll, role]);

  if (hasAccess) {
    return children;
  }

  if (showFallback && fallback) {
    return fallback;
  }

  return null;
};

/**
 * Equipment Permission Guard
 * Specialized guard for equipment operations
 */
export const EquipmentPermissionGuard = ({ 
  operation, 
  equipment = null, 
  fallback = null, 
  children,
  showFallback = true 
}) => {
  const userPermissions = usePermissions();

  const hasAccess = React.useMemo(() => {
    const validation = userPermissions.validateEquipmentAccess(operation, equipment);
    return validation.allowed;
  }, [userPermissions, operation, equipment]);

  if (hasAccess) {
    return children;
  }

  if (showFallback && fallback) {
    return fallback;
  }

  return null;
};

/**
 * Role Badge Component
 * Displays user role with appropriate styling
 */
export const RoleBadge = ({ role, size = 'sm', showIcon = true }) => {
  const roleInfo = PermissionService.getRoleDisplayInfo(role);

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-2.5 text-lg'
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const iconMap = {
    eye: '👁️',
    edit: '✏️',
    shield: '🛡️',
    user: '👤'
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${sizeClasses[size]} 
        ${colorClasses[roleInfo.color]}
      `}
      title={roleInfo.description}
    >
      {showIcon && (
        <span className="text-xs">
          {iconMap[roleInfo.icon]}
        </span>
      )}
      {roleInfo.name}
    </span>
  );
};

/**
 * Permission Denied Message Component
 */
export const PermissionDeniedMessage = ({ 
  message = 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้',
  requiredRole = null,
  showContactInfo = true,
  className = ''
}) => {
  const roleInfo = requiredRole ? PermissionService.getRoleDisplayInfo(requiredRole) : null;

  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ไม่มีสิทธิ์เข้าถึง
        </h3>
        <p className="text-gray-600 mb-4">
          {message}
        </p>
        
        {roleInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>สิทธิ์ที่ต้องการ:</strong> {roleInfo.name}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {roleInfo.description}
            </p>
          </div>
        )}

        {showContactInfo && (
          <p className="text-sm text-gray-500">
            หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Permission Status Indicator
 * Shows current user's permission status
 */
export const PermissionStatusIndicator = ({ className = '' }) => {
  const permissions = usePermissions();

  if (!permissions.role) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span className="text-sm">ไม่ได้เข้าสู่ระบบ</span>
      </div>
    );
  }

  const roleInfo = permissions.getRoleDisplayInfo();
  const statusColor = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${statusColor[roleInfo.color]}`}></span>
      <span className="text-sm font-medium">{roleInfo.name}</span>
    </div>
  );
};

export default PermissionGuard;