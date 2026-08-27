export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const PASSWORD_POLICY_RULES = [
  { key: 'upperCase', label: 'Use upper case (A, B...)' },
  { key: 'lowerCase', label: 'Use lower case (a, b...)' },
  { key: 'numeralsAndSpecial', label: 'Use numerals (1, 2,...) & special characters (@, *, ....)' },
  { key: 'minLength', label: 'Should be minimum 12 characters' },
  { key: 'changeEvery45Days', label: 'Change password every 45 days (Enforced)' },
  { key: 'last6Passwords', label: 'Last 6 passwords, not to be re-used' },
];

export function getPasswordValidationStatus(password = '') {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumeral = /[0-9]/.test(password);
  const hasSpecialChar = SPECIAL_CHAR_REGEX.test(password);
  const minLength = password.length >= 12;

  return {
    upperCase: hasUpperCase,
    lowerCase: hasLowerCase,
    numeralsAndSpecial: hasNumeral && hasSpecialChar,
    hasNumeral,
    hasSpecialChar,
    minLength,
    allSyntaxValid: hasUpperCase && hasLowerCase && hasNumeral && hasSpecialChar && minLength,
  };
}

export function isPasswordValid(password = '') {
  return getPasswordValidationStatus(password).allSyntaxValid;
}
