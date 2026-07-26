import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { AuthPromoPanel } from '@/components/auth/AuthPromoPanel';
import { AuthNoticeModal } from '@/components/auth/AuthNoticeModal';
import { showToast } from '@/components/common/ToastNotification';
import styles from '@/styles/modules/AuthPage.module.css';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

const fieldLabel =
  'block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-sky-600';

const fieldInput =
  'block h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const fieldInputWithToggle = `${fieldInput} pr-14`;

const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButton =
  'inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition duration-200 hover:border-blue-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20';

interface PasswordToggleProps {
  visible: boolean;
  label: string;
  onToggle: () => void;
}

/** Nút hiện/ẩn mật khẩu — vùng chạm 44px, có aria-label vì chỉ có icon. */
function PasswordToggle({ visible, label, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      aria-pressed={visible}
      className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

interface AuthPageProps {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
  isLoading: boolean;
}

export default function AuthPage({ mode, notice, onModeChange, onSubmit, isLoading }: AuthPageProps) {
  const {
    localNotice, setLocalNotice, form, forgotEmail, setForgotEmail,
    resetPasswordForm, setResetPasswordForm, savedAccounts, showDropdown, setShowDropdown,
    setResetToken, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    modal, closeModal, dropdownRef, emailInputRef, passwordInputRef,
    deleteSavedAccount, handleSelectAccount,
    title, description, handleChange, handleSubmit, handleForgotPassword, handleResetPassword,
  } = useAuthForm({ mode, onModeChange, onSubmit });

  const prefersReducedMotion = useReducedMotion();
  const activeNotice = (localNotice || notice)?.message ? localNotice || notice : null;
  const isSuccessNotice = activeNotice?.type === 'success';

  const fadeIn = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28, ease: 'easeOut' as const } };

  const noticeFade = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18 } };

  return (
    <main
      className={`relative flex min-h-screen justify-center overflow-x-hidden px-4 py-10 text-slate-900 ${styles.authShell}`}
    >
      {/* Very subtle blue ambient glows, same recipe as the manager portal shell */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.04),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-[960px] flex-col justify-center">
        {/* Soft blue/indigo halo so the centered shell reads as layered, not floating on an empty page */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[660px] w-[900px] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.13),rgba(99,102,241,0.07)_45%,transparent_72%)] blur-2xl"
        />
        {/* Back to home — a secondary dashboard action, kept in flow so it never overlaps the card */}
        <div className="mb-4">
          <a
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-transparent px-3 text-xs font-black text-slate-600 transition duration-200 hover:border-blue-200 hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
          >
            <ArrowLeft size={15} className="stroke-[2.5]" />
            Back to home
          </a>
        </div>

        <motion.div
          {...fadeIn}
          className="grid w-full grid-cols-1 overflow-hidden rounded-[24px] border border-blue-200 bg-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.30)] lg:grid-cols-[minmax(0,0.82fr),minmax(0,1.18fr)]"
        >
          {/* Supporting context — below the form on mobile so the form stays the first thing you reach */}
          <div className="order-2 min-w-0 lg:order-1">
            <AuthPromoPanel />
          </div>

          {/* Login form — the dominant column */}
          <div className="order-1 flex min-w-0 flex-col p-6 sm:p-8 lg:order-2 lg:py-10">
            <div className="mb-6">
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
              <p className="mt-2 text-xs font-bold leading-relaxed text-[#576b85]">{description}</p>
            </div>

            {activeNotice ? (
              <motion.div
                {...noticeFade}
                role="alert"
                aria-live="polite"
                className={`mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs font-bold ${
                  isSuccessNotice
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {isSuccessNotice ? (
                  <CheckCircle2 size={15} className="mt-px shrink-0" />
                ) : (
                  <AlertCircle size={15} className="mt-px shrink-0" />
                )}
                <span className="min-w-0 break-words">{activeNotice.message}</span>
              </motion.div>
            ) : null}

            {mode === 'forgot-password' ? (
              <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className={fieldLabel}>
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className={fieldInput}
                    placeholder="user@pbms.vn"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange('login');
                      setForgotEmail('');
                      setLocalNotice(null);
                    }}
                    className={`${secondaryButton} sm:flex-1`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className={`${primaryButton} sm:flex-1`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </button>
                </div>
              </form>
            ) : mode === 'reset-password' ? (
              <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                {/* Hidden email field: helps browser associate the new password with the right account */}
                <input type="hidden" autoComplete="username" value={forgotEmail || ''} />

                <div className="space-y-1.5">
                  <label htmlFor="new-password" className={fieldLabel}>
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
                      required
                      className={fieldInputWithToggle}
                      placeholder="At least 6 characters"
                    />
                    <PasswordToggle
                      visible={showPassword}
                      label="new password"
                      onToggle={() => setShowPassword(!showPassword)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-new-password" className={fieldLabel}>
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={resetPasswordForm.confirmPassword}
                      onChange={(e) => setResetPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                      required
                      className={fieldInputWithToggle}
                      placeholder="Retype password"
                    />
                    <PasswordToggle
                      visible={showConfirmPassword}
                      label="confirm password"
                      onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      onModeChange('login');
                      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                      setResetToken(null);
                      setLocalNotice(null);
                    }}
                    className={`${secondaryButton} sm:flex-1`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className={`${primaryButton} sm:flex-1`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Reset password'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="fullName" className={fieldLabel}>
                        Full name
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        className={fieldInput}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className={fieldLabel}>
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        className={fieldInput}
                        placeholder="0901234567"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className={fieldLabel}>
                    Email
                  </label>
                  {/* Hidden input to hold username for browser password manager association */}
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={form.email}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    className={styles.hiddenInput}
                  />
                  <div className="relative">
                    <input
                      id="email"
                      ref={emailInputRef}
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      type="email"
                      required
                      autoComplete="one-time-code"
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setShowDropdown(false)}
                      className={fieldInput}
                      placeholder="user@pbms.vn"
                    />

                    {/* Saved account suggestions (emails only, from local storage) */}
                    {showDropdown && savedAccounts.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-blue-900/10"
                      >
                        <p className="border-b border-slate-100 px-3.5 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Saved accounts
                        </p>
                        {savedAccounts.map((acc) => (
                          <div
                            key={acc.email}
                            onMouseDown={(e) => handleSelectAccount(e, acc)}
                            className="group flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <span className="truncate">{acc.email}</span>
                            <button
                              type="button"
                              onMouseDown={(e) => deleteSavedAccount(e, acc.email)}
                              aria-label={`Remove saved account ${acc.email}`}
                              title="Remove this account"
                              className="shrink-0 rounded-md p-1.5 text-slate-400 transition duration-200 hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <X size={12} className="stroke-[3]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className={fieldLabel}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      ref={passwordInputRef}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className={fieldInputWithToggle}
                      placeholder="At least 6 characters"
                    />
                    <PasswordToggle
                      visible={showPassword}
                      label="password"
                      onToggle={() => setShowPassword(!showPassword)}
                    />
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="-my-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onModeChange('forgot-password')}
                      className="-mr-2 inline-flex h-11 items-center rounded-lg px-2 text-xs font-bold text-blue-600 transition-colors duration-200 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className={fieldLabel}>
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className={fieldInputWithToggle}
                        placeholder="Retype password"
                      />
                      <PasswordToggle
                        visible={showConfirmPassword}
                        label="confirm password"
                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className={`${primaryButton} w-full`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : mode === 'login' ? (
                      'Login'
                    ) : (
                      'Register'
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
                      className="inline-flex h-11 items-center rounded-lg px-2 text-xs font-bold text-slate-500 transition-colors duration-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                      {mode === 'login' ? (
                        <>
                          New here?&nbsp;<span className="text-blue-600 underline">Create an account</span>
                        </>
                      ) : (
                        <>
                          Already have an account?&nbsp;<span className="text-blue-600 underline">Login</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* Notification modal (forgot/reset password) */}
      <AuthNoticeModal modal={modal} onClose={closeModal} />
    </main>
  );
}
