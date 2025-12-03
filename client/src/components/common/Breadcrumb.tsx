// File Location: client/src/components/common/Breadcrumb.tsx

import { LuChevronRight } from 'react-icons/lu';

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {index > 0 && <LuChevronRight size={14} />}
          <button onClick={item.onClick} disabled={index === items.length - 1}>
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;