
import React from 'react';

interface PageTitleProps {
  title: string;
  actions?: React.ReactNode;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, actions }) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2 sm:mb-0">{title}</h1>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
};
