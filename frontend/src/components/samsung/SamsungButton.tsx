import React from 'react';

interface SamsungButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
}

export default function SamsungButton({ variant = 'primary', children, className = '', disabled, ...props }: SamsungButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        flex items-center justify-center font-medium transition-all duration-200
        rounded-full h-[52px] px-8 whitespace-nowrap
        ${isPrimary 
          ? 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-400' 
          : 'bg-white text-black border border-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400'
        }
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
