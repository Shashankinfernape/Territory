import React, { useState } from 'react';

interface SamsungTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  onClear?: () => void;
  maxLength?: number;
}

export default function SamsungTextField({ label, error, onClear, className = '', required, maxLength, ...props }: SamsungTextFieldProps) {
  const [focused, setFocused] = useState(false);

  const isError = Boolean(error);
  
  // Colors based on state
  const labelColor = isError ? 'text-red-500' : focused ? 'text-[#2189FF]' : 'text-[#7A7A7A]';
  
  return (
    <div className={`flex flex-col relative w-full ${className}`}>
      <label 
        className={`text-[13px] font-normal tracking-wide transition-colors duration-200 ${labelColor}`}
        style={{ marginBottom: '6px' }}
      >
        {label}
      </label>
      
      <div className="relative w-full">
        <input
          {...props}
          maxLength={maxLength}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full text-[17px] font-normal text-black bg-transparent 
            outline-none border-none p-0 pr-[24px]
            caret-[#2189FF] placeholder-transparent
          `}
          style={{ paddingBottom: '8px', paddingRight: '36px' }}
        />
        
        {focused && props.value && onClear && (
          <button
            type="button"
            onMouseDown={(e) => {
               e.preventDefault();
               onClear();
            }}
            className="absolute right-0 bottom-[10px] flex items-center justify-center w-[16px] h-[16px] rounded-full bg-[#999999] hover:bg-[#777777] transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      
      {/* Underline container */}
      <div className="w-full h-[1px] bg-[#BDBDBD] relative">
        <div 
          className={`absolute left-0 top-0 bottom-0 w-full transition-transform duration-200 ease-out origin-left ${isError ? 'bg-red-500' : 'bg-[#2189FF]'}`}
          style={{ transform: focused || isError ? 'scaleX(1)' : 'scaleX(0)' }}
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
