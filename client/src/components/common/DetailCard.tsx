//import React from 'react';

interface DetailCardProps {
    label: string;
    value: string | number;
}

const DetailCard = ({ label, value }: DetailCardProps) => {
    return (
        <div className="detail-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle glass effect
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {value}
            </span>
        </div>
    );
};

export default DetailCard;