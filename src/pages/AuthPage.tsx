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

const socialButton =
  'flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-blue-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20';

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
              <form onSubmit={handleForgotPassword} className="space-y-4">
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
              <form onSubmit={handleResetPassword} className="space-y-4">
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
              <form onSubmit={handleSubmit} className="space-y-4">
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

                  {mode === 'login' && (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="px-3 font-mono text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Or sign in with
                        </span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>

                      <p className="text-center text-[11px] font-semibold text-slate-400">
                        Provider sign-in coming soon
                      </p>

                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => showToast('Google login is coming soon...', 'info')}
                          aria-label="Sign in with Google"
                          className={socialButton}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="#EA4335"
                              d="M12 5.04c1.67 0 3.2.58 4.4 1.71l3.29-3.29C17.72 1.58 14.99 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.22 7.74 8.89 5.04 12 5.04z"
                            />
                            <path
                              fill="#4285F4"
                              d="M23.45 12.3c0-.82-.07-1.6-.22-2.3H12v4.35h6.42c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.25-2.07 3.57-5.12 3.57-8.61z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.78a6.99 6.99 0 0 1 0-4.35L1.39 7.41a11.96 11.96 0 0 0 0 10.37l3.89-3z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.45 1.15-4.09 1.15-3.11 0-5.78-2.7-6.72-5.54L1.39 15.7A11.94 11.94 0 0 0 12 23z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => showToast('Facebook login is coming soon...', 'info')}
                          aria-label="Sign in with Facebook"
                          className={socialButton}
                        >
                          <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => showToast('GitHub login is coming soon...', 'info')}
                          aria-label="Sign in with GitHub"
                          className={socialButton}
                        >
                          <svg className="h-5 w-5 fill-slate-800" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => showToast('LinkedIn login is coming soon...', 'info')}
                          aria-label="Sign in with LinkedIn"
                          className={socialButton}
                        >
                          <svg className="h-5 w-5 fill-[#0A66C2]" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
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
