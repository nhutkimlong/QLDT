
import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onCloseSidebar?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ to, icon, children, onCloseSidebar }) => {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onCloseSidebar}
        className={({ isActive }) =>
          `flex items-center p-3 my-1 rounded-lg text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-150 ${
            isActive ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : ''
          }`
        }
      >
        <span className="mr-3 w-6 h-6 flex items-center justify-center">{icon}</span>
        {children}
      </NavLink>
    </li>
  );
};
