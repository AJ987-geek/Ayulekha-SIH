import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', className = '', isMono = false, ...props }) => {
  return (
    <div className={`swiss-input-group ${className}`}>
      {label && <label className="swiss-input-label">{label}</label>}
      <input
        type={type}
        className={`swiss-input ${isMono ? 'font-mono' : ''}`}
        {...props}
      />
    </div>
  );
};

export default Input;
