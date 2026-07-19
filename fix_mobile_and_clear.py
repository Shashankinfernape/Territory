import re

# 1. Update SamsungTextField.tsx
with open('frontend/src/components/samsung/SamsungTextField.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add onClear to props
if 'onClear?: () => void;' not in text:
    text = text.replace('error?: string;', 'error?: string;\n  onClear?: () => void;')

# Add relative wrapper and clear button inside the input
input_orig = r'''      <input
        {...props}'''

input_new = r'''      <div className="relative w-full">
      <input
        {...props}'''
text = text.replace(input_orig, input_new)

# Add padding to input so text doesn't overlap clear button
text = text.replace('p-0 pb-[4px]', 'p-0 pb-[4px] pr-[24px]')

# Add clear button and close the div before underline container
underline_orig = r'''      {/* Underline container */}'''
clear_btn = r'''      {props.value && props.onClear && (
        <button
          type="button"
          onClick={(e) => {
             e.preventDefault();
             props.onClear?.();
          }}
          className="absolute right-0 bottom-[8px] flex items-center justify-center w-[16px] h-[16px] rounded-full bg-[#999999] hover:bg-[#777777] transition-colors"
        >
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      </div>
      
      {/* Underline container */}'''
text = text.replace(underline_orig, clear_btn)

with open('frontend/src/components/samsung/SamsungTextField.tsx', 'w', encoding='utf-8') as f:
    f.write(text)


# 2. Update SamsungAddressScreen.tsx to pass onClear
with open('frontend/src/pages/auth/SamsungAddressScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add onClear to all TextFields
def add_onclear(match):
    name_match = re.search(r'value=\{formData\.([a-zA-Z0-9_]+)\}', match.group(0))
    if name_match:
        name = name_match.group(1)
        return match.group(0) + f'\n            onClear={{() => handleChange(\'{name}\', \'\')}}'
    return match.group(0)

text = re.sub(r'<SamsungTextField[\s\S]*?onChange=\{.*?\}', add_onclear, text)

# Ensure container padding is friendly for mobile
text = text.replace('px-6 md:px-12', 'px-0 sm:px-4 md:px-8')

with open('frontend/src/pages/auth/SamsungAddressScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)


# 3. Update Login.tsx to fix mobile responsiveness
with open('frontend/src/pages/auth/Login.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make max-height and overflow work smoothly on mobile
right_col = r'''        .login-card-right {
          flex: ${step === 2 ? '0.65' : '0.9'};
          padding: ${step === 2 ? '2rem 3rem' : '3.5rem 3rem'};
          display: flex;
          max-height: ${step === 2 ? '95vh' : 'auto'};
          overflow-y: auto;
          transition: all 0.4s ease;
        }'''
right_col_new = r'''        .login-card-right {
          flex: ${step === 2 ? '0.65' : '0.9'};
          padding: ${step === 2 ? '2rem 3rem' : '3.5rem 3rem'};
          display: flex;
          max-height: ${step === 2 ? '95vh' : 'auto'};
          overflow-y: auto;
          transition: all 0.4s ease;
        }
        @media (max-width: 768px) {
          .login-card-right {
            padding: 1.5rem 1rem !important;
            max-height: 85vh;
          }
        }'''
text = text.replace(right_col, right_col_new)

with open('frontend/src/pages/auth/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
