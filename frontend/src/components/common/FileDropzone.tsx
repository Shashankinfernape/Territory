import { useState, useRef } from 'react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label: string;
  helperText?: string;
  isImageDropzone?: boolean;
}

export default function FileDropzone({
  onFilesSelected,
  multiple = false,
  accept = '*',
  label,
  helperText,
  isImageDropzone = false
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = '';
    }
  };

  const onContainerClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onContainerClick}
      style={{
        position: 'relative',
        border: '2.5px dashed #101010',
        borderRadius: '8px',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        background: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        minHeight: '150px',
        userSelect: 'none',
        overflow: 'hidden',
        boxShadow: 'rgba(16, 16, 16, 0.02) 0px 4px 12px 0px'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#fafafa';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'rgba(16, 16, 16, 0.05) 0px 6px 16px 0px';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#ffffff';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'rgba(16, 16, 16, 0.02) 0px 4px 12px 0px';
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* WhatsApp style dotted overlay when drag is active */}
      {isDragActive && (
        <div style={{
          position: 'absolute',
          inset: '8px',
          border: '2.5px dashed #101010',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          gap: '0.4rem'
        }}>
          <div style={{ color: '#101010' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#101010', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Drop files to upload
          </p>
        </div>
      )}

      {/* Child elements masked with pointer-events: none to prevent drag enter/leave flickering */}
      <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#101010',
          marginBottom: '0.2rem'
        }}>
          {isImageDropzone ? (
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          ) : (
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#101010', margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            {label}
          </p>
          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
            {helperText || 'Drag files here or click to upload'}
          </p>
        </div>
      </div>
    </div>
  );
}
