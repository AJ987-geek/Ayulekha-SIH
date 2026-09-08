import React from 'react';
import './Card.css';

const Card = ({ title, children, className = '', isDataSurface = false }) => {
  return (
    <div className={`swiss-card ${isDataSurface ? 'card-data' : 'card-narrative'} ${className}`}>
      {title && (
        <div className="swiss-card-header">
          <h3 className="swiss-card-title">{title}</h3>
        </div>
      )}
      <div className="swiss-card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
