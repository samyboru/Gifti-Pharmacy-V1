// File Location: client/src/components/common/SegmentedControl.tsx

// --- THIS LINE IS FIXED ---
import { JSX } from 'react';
import { LuTrendingUp, LuTable } from 'react-icons/lu';

interface SegmentedControlProps {
  options: { value: string; label: string; icon: JSX.Element }[];
  selectedValue: string;
  onChange: (value: string) => void;
}

const SegmentedControl = ({ options, selectedValue, onChange }: SegmentedControlProps) => {
  return (
    <div className="segmented-control">
      {options.map(option => (
        <button
          key={option.value}
          className={selectedValue === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export const ReportViewToggle = ({ view, setView }: { view: 'chart' | 'table', setView: (view: 'chart' | 'table') => void }) => {
    const options = [
        // --- THIS LINE IS FIXED ---
        { value: 'chart', label: 'Chart', icon: <LuTrendingUp size={16} /> },
        { value: 'table', label: 'Table', icon: <LuTable size={16} /> }
    ];
    return <SegmentedControl options={options} selectedValue={view} onChange={(val) => setView(val as 'chart' | 'table')} />;
};