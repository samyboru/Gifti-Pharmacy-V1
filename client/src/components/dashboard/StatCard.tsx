import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode; // lowercase 'icon'
  color: string;
  onClick?: () => void;
  linkTo?: string;
}

const StatCard = ({ title, value, icon, color, onClick, linkTo }: StatCardProps) => {
  const content = (
    <div 
      className={`widget-card ${onClick || linkTo ? 'clickable' : ''}`} 
      onClick={onClick}
    >
      <div className={`widget-icon ${color}`}>
        {icon}
      </div>
      <div className="widget-info">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="widget-link">{content}</Link>;
  }

  return content;
};

export default StatCard;