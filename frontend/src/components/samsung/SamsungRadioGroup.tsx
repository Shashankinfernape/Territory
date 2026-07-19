

interface SamsungRadioGroupProps {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export default function SamsungRadioGroup({ label, options, value, onChange, error, required: _required }: SamsungRadioGroupProps) {
  return (
    <div className="flex flex-col w-full mb-4">
      {label && (
        <label className="text-[17px] font-normal text-black" style={{ marginBottom: '20px' }}>
          {label}
        </label>
      )}
      
      <div className="flex flex-wrap" style={{ columnGap: '32px', rowGap: '16px' }}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label 
              key={opt.value} 
              className="flex items-center cursor-pointer group"
              onClick={() => onChange(opt.value)}
            >
              <div className="relative flex items-center justify-center mr-2">
                <input 
                  type="radio" 
                  checked={isSelected}
                  onChange={() => onChange(opt.value)}
                  style={{ width: '18px', height: '18px', accentColor: '#1259c3', cursor: 'pointer', margin: 0 }}
                />
              </div>
              
              <span className={`text-[15px] ${isSelected ? 'text-black font-bold' : 'text-black font-normal'}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      
      {error && (
        <span className="text-[11px] text-red-500 font-medium mt-2">
          {error}
        </span>
      )}
    </div>
  );
}
