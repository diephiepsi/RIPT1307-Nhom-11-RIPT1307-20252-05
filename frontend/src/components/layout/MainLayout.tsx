// src/components/layout/MainLayout.tsx
import React from 'react';
import { Header } from './Header';
import { SidebarLeft } from './SidebarLeft';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <Header />
      <div className="main-container">
        <SidebarLeft />
        <main className="content-render">
          {children}
        </main>
      </div>
    </div>
  );
};