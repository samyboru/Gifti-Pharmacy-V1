// File Location: client/src/components/common/PageHeader.tsx

import React from 'react';

// Using the new, more flexible props from our design system
interface PageHeaderProps {
  title: string;
  children?: React.ReactNode; // For description and action buttons
}

const PageHeader = ({ title, children }: PageHeaderProps) => {
  return (
    <div className="header">
      <h1>{title}</h1>
      <div className="header-actions">
        {children}
      </div>
    </div>
  );
};

export default PageHeader;