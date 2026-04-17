import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../atoms/Input';
import { IconButton } from '../atoms/IconButton';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search size={18} />}
        rightIcon={value ? (
          <IconButton
            icon={<X size={14} />}
            size="xs"
            variant="ghost"
            onClick={() => onChange('')}
          />
        ) : null}
        className="pr-10"
      />
    </div>
  );
};
