const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;