import { useMemo, useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { forgotPassword, resetPassword } from '@/services/authService';
import { findPasswordWeakness } from '@/utils/passwordPolicy';

export type AuthMode = 'login' | 'register' | 'verify-registration' | 'forgot-password' | 'reset-password';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

interface UseAuthFormArgs {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
}

/**
 * State + logic của màn Auth (login/register/forgot/reset). Tách khỏi component
 * để phần JSX thuần trình bày.
 */
export function useAuthForm({ mode, onModeChange, onSubmit }: UseAuthFormArgs) {
  const [searchParams] = useSearchParams();
  const [localNotice, setLocalNotice] = useState<{ message?: string; type?: string } | null>(null);
  const [form, setForm] = useState(initialForm);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [registrationOtp, setRegistrationOtp] = useState('');
  // Chỉ ghi nhớ EMAIL để gợi ý đăng nhập — KHÔNG bao giờ lưu mật khẩu ở client.
  const [savedAccounts, setSavedAccounts] = useState<{ email: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  // Modal thông báo (thành công/thất bại) cho luồng quên & đặt lại mật khẩu.
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    next?: () => void;
  } | null>(null);

  const closeModal = () => {
    const next = modal?.next;
    setModal(null);
    next?.();
  };

  // Auto-detect reset-password mode from URL token
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
      onModeChange('reset-password');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved emails from localStorage on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      if (stored) {
        const parsed: { email?: string }[] = JSON.parse(stored);
        const emailsOnly = parsed
          .filter((acc) => acc?.email)
          .map((acc) => ({ email: acc.email as string }));
        setSavedAccounts(emailsOnly);
        localStorage.setItem('pbms_saved_accounts', JSON.stringify(emailsOnly));
      }
    } catch (e) {
      console.error('Failed to load saved accounts', e);
    }
  }, []);

  const saveAccount = (email: string) => {
    if (!email) return;
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      let current: { email: string }[] = stored ? JSON.parse(stored) : [];
      current = current.filter((acc) => acc.email !== email);
      current.unshift({ email });
      current = current.slice(0, 5);
      localStorage.setItem('pbms_saved_accounts', JSON.stringify(current));
      setSavedAccounts(current);
    } catch (e) {
      console.error('Failed to save account', e);
    }
  };

  const deleteSavedAccount = (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const updated = savedAccounts.filter((acc) => acc.email !== emailToDelete);
      localStorage.setItem('pbms_saved_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (err) {
      console.error('Failed to delete saved account', err);
    }
  };

  const handleSelectAccount = (e: React.MouseEvent, acc: { email: string }) => {
    e.preventDefault();
    setForm((s) => ({ ...s, email: acc.email }));
    setShowDropdown(false);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  // 3D Mouse Tracking Tilt Motion Values
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22 });
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);
  const rotateX = useTransform(springY, [0, 1], [8, -8]);

  const title = useMemo(() => {
    if (mode === 'reset-password') return 'Reset Password';
    if (mode === 'forgot-password') return 'Recover Password';
    if (mode === 'verify-registration') return 'Verify your email';
    return mode === 'login' ? 'Login to PBMS' : 'Create PBMS Account';
  }, [mode]);

  const description = useMemo(() => {
    if (mode === 'reset-password')
      return 'Enter your new password to complete the reset process.';
    if (mode === 'forgot-password')
      return 'Enter the email address associated with your account to receive a reset link.';
    if (mode === 'verify-registration')
      return 'Enter the 6-digit verification code we sent to your email.';
    return mode === 'login'
      ? 'Log in to continue using the smart parking management system.'
      : 'Create a new account to start using the smart parking platform.';
  }, [mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (mode === 'register') {
      if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
        setLocalNotice({ message: 'Please fill in all fields!', type: 'error' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setLocalNotice({ message: 'Invalid email address!', type: 'error' });
        return;
      }
      const weakness = findPasswordWeakness(form.password);
      if (weakness) {
        setLocalNotice({ message: weakness, type: 'error' });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setLocalNotice({ message: 'Confirm password does not match!', type: 'error' });
        return;
      }
      const phoneTrimmed = form.phone.trim();
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        setLocalNotice({
          message: 'Phone number must start with 0 and contain exactly 10 digits!',
          type: 'error',
        });
        return;
      }
      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: phoneTrimmed,
      };
      try {
        await onSubmit({ mode, payload });
      } catch (_err) {
        // Error already mapped in public auth flow hook
      }
    } else if (mode === 'verify-registration') {
      const otp = registrationOtp.trim();
      if (!/^\d{6}$/.test(otp)) {
        setLocalNotice({ message: 'Please enter the 6-digit verification code.', type: 'error' });
        return;
      }
      // The password lives only in this form's React state and is sent for the
      // first time here, with the verified OTP.
      if (!form.password) {
        setLocalNotice({
          message: 'Your registration details were lost. Please start registration again.',
          type: 'error',
        });
        return;
      }
      try {
        await onSubmit({ mode, payload: { email: form.email.trim(), otp, password: form.password } });
      } catch (_err) {
        // Error already mapped in public auth flow hook
      }
    } else {
      if (!form.email.trim() || !form.password) {
        setLocalNotice({ message: 'Please enter your email and password!', type: 'error' });
        return;
      }
      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
      };
      try {
        await onSubmit({ mode, payload });
        saveAccount(form.email.trim());
      } catch (err) {
        setLocalNotice({
          message: err instanceof Error ? err.message : 'Login failed',
          type: 'error',
        });
      }
    }
  }

  async function handleResendRegistration() {
    setLocalNotice(null);
    try {
      await onSubmit({
        mode: 'register',
        payload: {
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
        },
      });
      setRegistrationOtp('');
    } catch (_err) {
      // Error already mapped in public auth flow hook
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);
    const email = forgotEmail.trim();
    if (!email) {
      setLocalNotice({ message: 'Please enter your email!', type: 'error' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalNotice({ message: 'Invalid email address!', type: 'error' });
      return;
    }
    try {
      await forgotPassword(email);
      setModal({
        title: 'Recovery Email Sent',
        message:
          'If this email exists in our system, we have sent a reset password link. Please check your inbox (including spam folder). The link is valid for 15 minutes.',
        type: 'success',
        next: () => {
          setForgotEmail('');
          setLocalNotice(null);
          onModeChange('login');
        },
      });
    } catch (error) {
      setModal({
        title: 'Failed to Send Email',
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        type: 'error',
      });
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);
    if (!resetToken) {
      setLocalNotice({ message: 'Invalid or expired password reset link!', type: 'error' });
      return;
    }
    const newPassword = resetPasswordForm.newPassword.trim();
    const confirmPassword = resetPasswordForm.confirmPassword.trim();
    if (!newPassword || !confirmPassword) {
      setLocalNotice({ message: 'Please enter password!', type: 'error' });
      return;
    }
    const resetWeakness = findPasswordWeakness(newPassword);
    if (resetWeakness) {
      setLocalNotice({ message: resetWeakness, type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalNotice({ message: 'Confirm password does not match!', type: 'error' });
      return;
    }
    try {
      await resetPassword(resetToken, newPassword);
      localStorage.removeItem('pbms.forgotEmail_pending');
      setModal({
        title: 'Password Reset Successfully',
        message: 'Your password has been updated. Please log in with your new password.',
        type: 'success',
        next: () => {
          setResetPasswordForm({ newPassword: '', confirmPassword: '' });
          setResetToken(null);
          setLocalNotice(null);
          onModeChange('login');
        },
      });
    } catch (error) {
      setModal({
        title: 'Failed to Reset Password',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to reset password. Please try again or request a new link.',
        type: 'error',
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return {
    localNotice, setLocalNotice,
    form, setForm,
    forgotEmail, setForgotEmail,
    resetPasswordForm, setResetPasswordForm,
    registrationOtp, setRegistrationOtp,
    savedAccounts, showDropdown, setShowDropdown,
    resetToken, setResetToken, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    modal, closeModal,
    dropdownRef, emailInputRef, passwordInputRef,
    saveAccount, deleteSavedAccount, handleSelectAccount,
    rotateX, rotateY,
    title, description,
    handleChange, handleSubmit, handleResendRegistration, handleForgotPassword, handleResetPassword,
    handleMouseMove, handleMouseLeave,
  };
}
