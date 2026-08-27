import React from 'react';
import { getPasswordValidationStatus } from '../utils/passwordPolicy';

export default function PasswordPolicyChecker({ password = '', confirmPassword = null, showConfirm = false }) {
  const status = getPasswordValidationStatus(password);
  const isConfirming = showConfirm && confirmPassword !== null;
  const passwordsMatch = isConfirming ? (password === confirmPassword && confirmPassword.length > 0) : null;

  const rules = [
    {
      id: 'upperCase',
      label: 'Use upper case (A, B...)',
      met: status.upperCase,
    },
    {
      id: 'lowerCase',
      label: 'Use lower case (a, b...)',
      met: status.lowerCase,
    },
    {
      id: 'numeralsAndSpecial',
      label: 'Use numerals (1, 2,...) & special characters (@, *, ....)',
      met: status.numeralsAndSpecial,
      details: !status.numeralsAndSpecial && password.length > 0
        ? `(${!status.hasNumeral ? 'Missing numeral' : ''}${!status.hasNumeral && !status.hasSpecialChar ? ', ' : ''}${!status.hasSpecialChar ? 'Missing special char' : ''})`
        : '',
    },
    {
      id: 'minLength',
      label: 'Should be minimum 12 characters',
      met: status.minLength,
      details: password.length > 0 && !status.minLength ? `(${password.length}/12 chars)` : '',
    },
    {
      id: 'changeEvery45Days',
      label: 'Change password every 45 days',
      met: true, // Informational policy requirement enforced by system
      isInfo: true,
    },
    {
      id: 'last6Passwords',
      label: 'Last 6 passwords, not to be re-used',
      met: true, // Verified on submit by backend
      isInfo: true,
    },
  ];

  return (
    <div style={{
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '16px 18px',
      marginTop: '10px',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      fontSize: '13px',
      lineHeight: '1.4',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-[#1e293b]',
        fontWeight: '600',
        color: '#1e293b',
        fontSize: '13px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '8px',
        marginBottom: '4px',
      }}>
        <span>Password Requirements Policy</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rules.map((rule) => {
          const isPassed = password.length > 0 ? rule.met : false;
          return (
            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                minWidth: '20px',
                borderRadius: '50%',
                backgroundColor: rule.isInfo
                  ? '#EFF6FF'
                  : isPassed
                  ? '#DCFCE7'
                  : password.length > 0
                  ? '#FEE2E2'
                  : '#F1F5F9',
                color: rule.isInfo
                  ? '#3B82F6'
                  : isPassed
                  ? '#16A34A'
                  : password.length > 0
                  ? '#DC2626'
                  : '#94A3B8',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
              }}>
                {rule.isInfo ? 'ℹ' : isPassed ? '✓' : '✕'}
              </span>
              <span style={{
                color: rule.isInfo
                  ? '#475569'
                  : isPassed
                  ? '#16A34A'
                  : password.length > 0
                  ? '#DC2626'
                  : '#64748B',
                fontWeight: isPassed ? '500' : '400',
                fontSize: '12px',
              }}>
                {rule.label} {rule.details && <span style={{ fontSize: '11px', opacity: 0.85 }}>{rule.details}</span>}
              </span>
            </div>
          );
        })}

        {showConfirm && confirmPassword !== null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '4px',
            paddingTop: '8px',
            borderTop: '1px dashed #e2e8f0'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              minWidth: '20px',
              borderRadius: '50%',
              backgroundColor: confirmPassword.length === 0
                ? '#F1F5F9'
                : passwordsMatch
                ? '#DCFCE7'
                : '#FEE2E2',
              color: confirmPassword.length === 0
                ? '#94A3B8'
                : passwordsMatch
                ? '#16A34A'
                : '#DC2626',
              fontSize: '11px',
              fontWeight: 'bold',
            }}>
              {confirmPassword.length === 0 ? '✕' : passwordsMatch ? '✓' : '✕'}
            </span>
            <span style={{
              color: confirmPassword.length === 0
                ? '#64748B'
                : passwordsMatch
                ? '#16A34A'
                : '#DC2626',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {confirmPassword.length === 0
                ? 'Confirm Password'
                : passwordsMatch
                ? 'Passwords match'
                : 'Passwords do not match'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
