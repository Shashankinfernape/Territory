import React, { useState, useRef, useEffect } from 'react';

interface SamsungDropdownFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
}

export default function SamsungDropdownField({ label, options, error, className = '', required, value, onChange, ...props }: SamsungDropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isError = Boolean(error);
  
  // Colors based on state
  const labelColor = isError ? 'text-red-500' : (focused || isOpen) ? 'text-[#2189FF]' : 'text-[#7A7A7A]';
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`flex flex-col relative w-full ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 50 : 1 }}>
      <label 
        className={`text-[13px] font-normal tracking-wide transition-colors duration-200 ${labelColor}`}
        style={{ marginBottom: '6px' }}
      >
        {label}
      </label>
      
      <div className="relative w-full">
        {/* Hidden select for form submission / accessibility if needed */}
        <select 
          value={value} 
          onChange={() => {}} 
          className="hidden" 
          name={props.name}
        >
          <option value="" disabled>Select {label}</option>
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        {/* Custom trigger */}
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            setFocused(true);
          }}
          className={`
            w-full text-[17px] font-normal bg-transparent 
            outline-none border-none p-0 pr-[24px]
            cursor-pointer select-none
            ${value ? 'text-black' : 'text-[#7A7A7A]'}
          `}
          style={{ paddingBottom: '8px' }}
        >
          {selectedOption ? selectedOption.label : `Select ${label.replace('*', '')}`}
        </div>
        
        {/* Custom arrow indicator */}
        <div className={`absolute right-2 top-[30%] pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </div>
      
      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 w-full shadow-xl rounded-[12px] mt-1 z-50 overflow-hidden" 
          style={{ top: 'calc(100% - 10px)', border: '1px solid #ECECEC', backgroundColor: '#ffffff', zIndex: 100 }}
        >
          <div className="max-h-[250px] overflow-y-auto py-2">
            {options.map((opt) => (
              <div 
                key={opt.value}
                className={`px-4 py-3 text-[16px] cursor-pointer transition-colors ${value === opt.value ? 'bg-blue-50 text-[#2189FF] font-medium' : 'text-gray-800 hover:bg-gray-50'}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onChange) {
                    onChange({ target: { value: opt.value, name: props.name } });
                  }
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Underline container */}
      <div className="w-full h-[1px] bg-[#BDBDBD] relative mt-[1px]">
        {/* Animated focus/error underline */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-full transition-transform duration-200 ease-out origin-left ${isError ? 'bg-red-500' : 'bg-[#2189FF]'}`}
          style={{ transform: (focused || isOpen) || isError ? 'scaleX(1)' : 'scaleX(0)' }}
        />
      </div>
      
      {isError && (
        <span className="text-[11px] text-red-500 font-medium mt-[3px]">
          {error}
        </span>
      )}
    </div>
  );
}
