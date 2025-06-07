
import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon, actionButton }) => {
  return (
    <div className="text-center py-12 px-6 bg-white rounded-lg shadow">
      {icon && <div className="text-gray-400 w-16 h-16 mx-auto mb-4">{icon}</div>}
      <p className="text-lg text-gray-600 mb-4">{message}</p>
      {actionButton}
    </div>
  );
};
