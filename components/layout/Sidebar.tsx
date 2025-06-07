
import React from 'react';
import { NavLinks, APP_NAME } from '../../constants';
import { NavItem } from './NavItem';
import { SparklesIcon } from '../../constants'; // Re-importing for specific use if needed

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex items-center justify-center h-20 border-b px-4">
          <SparklesIcon /> 
          <h1 className="text-xl font-bold text-blue-700 ml-2">{APP_NAME}</h1>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          <ul>
            {NavLinks.map(link => (
              <NavItem key={link.name} to={link.path} icon={link.icon} onCloseSidebar={onClose}>
                {link.name}
              </NavItem>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500 text-center">&copy; {new Date().getFullYear()} MyWorkPal</p>
        </div>
      </aside>
    </>
  );
};