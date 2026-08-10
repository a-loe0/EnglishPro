import { useState, useRef, useEffect, useCallback } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (itemId: string) => void;
  align?: 'left' | 'right';
  width?: 'auto' | 'trigger' | number;
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  width = 'auto',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClickOutside, handleEscape]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect(item.id);
    setIsOpen(false);
  };

  const getWidthStyle = (): React.CSSProperties => {
    if (width === 'auto') return { minWidth: '160px' };
    if (width === 'trigger') {
      return { width: triggerRef.current?.offsetWidth || 'auto' };
    }
    return { width: `${width}px` };
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1
            bg-white rounded-card shadow-lg border border-gray-200
            py-1 overflow-hidden
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          style={getWidthStyle()}
          role="menu"
        >
          {items.map((item) => {
            if (item.divider) {
              return (
                <div
                  key={item.id}
                  className="my-1 border-t border-gray-100"
                  role="separator"
                />
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center gap-2 px-4 py-2 text-left text-sm
                  transition-colors duration-150
                  ${item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                role="menuitem"
              >
                {item.icon && (
                  <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple Select Dropdown
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const ChevronDown = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      selectRef.current &&
      !selectRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-card border
          text-left transition-colors duration-200
          ${disabled
            ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
            : 'bg-white hover:border-gray-400 cursor-pointer'
          }
          ${error
            ? 'border-red-500 focus:ring-red-500/30'
            : 'border-gray-300 focus:border-primary focus:ring-primary/30'
          }
          focus:outline-none focus:ring-2
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown />
      </button>

      {isOpen && (
        <div
          className="
            absolute z-50 w-full mt-1
            bg-white rounded-card shadow-lg border border-gray-200
            py-1 max-h-60 overflow-auto
          "
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              disabled={option.disabled}
              className={`
                w-full px-4 py-2 text-left text-sm
                transition-colors duration-150
                ${option.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : option.value === value
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default Dropdown;
