
import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 bg-white shadow-md lg:hidden">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Placeholder for App Name or Logo if needed on mobile header */}
        {/* <div className="text-lg font-bold text-blue-700">MyWorkPal</div> */}
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Chuyển đổi thanh bên"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <div>{/* User avatar/menu could go here */}</div>
      </div>
    </header>
  );
};