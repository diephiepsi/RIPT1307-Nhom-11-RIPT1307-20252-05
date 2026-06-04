// src/components/layout/SidebarLeft.tsx
import React from 'react';
import './SidebarLeft.css';

export const SidebarLeft: React.FC = () => {
  return (
    <aside className="sidebar-left">
      <nav className="nav-menu">
        <div className="nav-item">Home</div>
        <div className="nav-heading">PUBLIC</div>
        <div className="nav-item active">⚙️ Questions</div>
        <div className="nav-item pl-6">Tags</div>
        <div className="nav-item pl-6">Users</div>
      </nav>
    </aside>
  );
};