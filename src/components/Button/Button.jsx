import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClass =
    variant === 'primary' ? 'btn-primary' :
    variant === 'secondary' ? 'btn-secondary' :
    'btn-emergency';

  return (
    <button className={`swiss-btn ${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
