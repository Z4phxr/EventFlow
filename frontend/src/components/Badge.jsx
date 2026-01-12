const variantStyles = {
  // Event status badges
  PLANNED: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  FINISHED: 'bg-gray-100 text-gray-700 border-gray-200',
  
  // Service health badges
  OK: 'bg-green-100 text-green-700 border-green-200',
  FAIL: 'bg-red-100 text-red-700 border-red-200',
  CONFIGURED: 'bg-blue-100 text-blue-700 border-blue-200',
  
  // Notification types
  EVENT_CREATED: 'bg-green-100 text-green-700 border-green-200',
  EVENT_UPDATED: 'bg-orange-100 text-orange-700 border-orange-200',
  EVENT_DELETED: 'bg-red-100 text-red-700 border-red-200',
  USER_REGISTERED: 'bg-blue-100 text-blue-700 border-blue-200',
  USER_UNREGISTERED: 'bg-gray-100 text-gray-700 border-gray-200',
  
  // Generic
  success: 'bg-green-100 text-green-700 border-green-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-orange-100 text-orange-700 border-orange-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

function Badge({ children, variant = 'default', className = '' }) {
  const style = variantStyles[variant] || variantStyles.default;
  
  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full 
        text-xs font-medium border
        ${style}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export default Badge;
