import re

with open('frontend/src/pages/auth/Login.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("display: ${step === 2 ? 'none' : 'flex'};", "display: flex;")
text = text.replace("overflow-y: ${step === 2 ? 'auto' : 'visible'};", "overflow-y: auto;")

with open('frontend/src/pages/auth/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('frontend/src/pages/auth/SamsungAddressScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("mb-6", "mb-10")

btn_orig = """      <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-4\">
        <SamsungButton 
          variant="primary" 
          onClick={handleSubmit}
          className="w-full sm:w-[180px]"
          disabled={isSaving}
        >"""

btn_new = """      <div className="flex flex-col pt-10 pb-6\">
        <SamsungButton 
          variant="primary" 
          onClick={handleSubmit}
          className="w-full"
          disabled={isSaving}
        >"""

text = text.replace(btn_orig, btn_new)

with open('frontend/src/pages/auth/SamsungAddressScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
