import re

with open('frontend/src/pages/auth/Login.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the CSS block to be dynamic based on step
css_block_orig = r'''        .login-glass-card {
          display: flex;
          width: 100%;
          max-width: 820px;'''

css_block_new = r'''        .login-glass-card {
          display: flex;
          width: 100%;
          max-width: ${step === 2 ? '1000px' : '820px'};
          transition: max-width 0.4s ease;'''

text = text.replace(css_block_orig, css_block_new)

left_col_orig = r'''        .login-card-left {
          flex: 1.1;
          padding: 3.5rem 3rem;'''

left_col_new = r'''        .login-card-left {
          flex: 1.1;
          padding: 3.5rem 3rem;
          display: ${step === 2 ? 'none' : 'flex'};'''

text = text.replace(left_col_orig, left_col_new)

right_col_orig = r'''        .login-card-right {
          flex: 0.9;
          padding: 3.5rem 3rem;
          display: flex;'''

right_col_new = r'''        .login-card-right {
          flex: ${step === 2 ? '1' : '0.9'};
          padding: ${step === 2 ? '0' : '3.5rem 3rem'};
          display: flex;'''

text = text.replace(right_col_orig, right_col_new)

# Remove the step === 2 outer early return block
early_return_orig = r'''  if (step === 2) {
    return (
      <div className="bg-gray-50 min-h-screen pt-4 pb-12">
        <SamsungAddressScreen 
          initialData={tempData}
          onSave={handleAddressSave}
          onCancel={handleAddressCancel}
          isSaving={savingAddress}
        />
      </div>
    );
  }'''

text = text.replace(early_return_orig, '')

# Inject SamsungAddressScreen inside the login-card-right
login_card_right_orig = r'''        {/* RIGHT COLUMN - AUTHENTICATION FORM */}
        <div className="login-card-right">
          <div>
            <h3 className="login-title">{t("Sign in")}</h3>'''

login_card_right_new = r'''        {/* RIGHT COLUMN - AUTHENTICATION FORM */}
        <div className="login-card-right">
          {step === 2 ? (
            <SamsungAddressScreen 
              initialData={tempData}
              onSave={handleAddressSave}
              onCancel={handleAddressCancel}
              isSaving={savingAddress}
            />
          ) : (
            <>
          <div>
            <h3 className="login-title">{t("Sign in")}</h3>'''

text = text.replace(login_card_right_orig, login_card_right_new)

# Close the step === 1 fragment
end_of_right_col_orig = r'''            </p>
          </div>
        </div>
      </div>
    </div>'''

end_of_right_col_new = r'''            </p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>'''

text = text.replace(end_of_right_col_orig, end_of_right_col_new)

with open('frontend/src/pages/auth/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Login.tsx updated to embed step 2')
