
import React, { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Input } from '../shared/Input'; // Import Input component

interface LayoutProps {
  children: ReactNode;
  globalSearchQuery: string; 
  setGlobalSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export const Layout: React.FC<LayoutProps> = ({ children, globalSearchQuery, setGlobalSearchQuery }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          <div className="container mx-auto max-w-full">
            {/* Global Search Bar */}
            <div className="mb-6"> 
              <Input
                type="search"
                id="globalSearch"
                name="globalSearch"
                placeholder="Tìm kiếm văn bản toàn hệ thống..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full md:w-2/3 lg:w-1/2 shadow-sm py-2.5" 
                containerClassName="mb-0" // Remove default bottom margin from Input container
              />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
