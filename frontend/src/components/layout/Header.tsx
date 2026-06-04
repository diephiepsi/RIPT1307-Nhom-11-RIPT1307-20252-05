// src/components/layout/Header.tsx
import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="so-header">
      <div className="header-container">
        <div className="logo">
          stack<span className="logo-thin">overflow</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search missing concepts, errors..." />
        </div>
        <div className="auth-buttons">
          <button className="btn-login">Log in</button>
          <button className="btn-signup">Sign up</button>
        </div>
      </div>
    </header>
  );
};