function Card({ children, className = '', hover = false }) {
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-soft
        transition-all duration-200
        ${hover ? 'hover:shadow-soft-lg hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
