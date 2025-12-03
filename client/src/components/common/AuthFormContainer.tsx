// File Location: client/src/components/common/AuthFormContainer.tsx

import React from 'react';

interface AuthFormContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ title, subtitle, children }) => {
  // --- THIS IS THE FIX ---
  // The outer 'auth-page-fullscreen' div has been removed.
  // This component now only renders the central form container.
  return (
    <div className="auth-form-container">
      <div className="auth-header">
        <h1 className="auth-logo">Gifti Pharmacy</h1>
        <p className="auth-tagline">Pharmacy Management System</p>
      </div>
      <h2 className="auth-title">{title}</h2>
      <p className="auth-subtitle">{subtitle}</p>
      {children}
    </div>
  );
};

export default AuthFormContainer;