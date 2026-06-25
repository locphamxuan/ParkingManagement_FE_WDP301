import { useMemo, useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Home, X, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CartoonCar3D } from '@/components/map/CartoonCar3D';
import { forgotPassword, resetPassword } from '@/services/authService';
import back1 from '@/assets/back1.webp';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
  isLoading: boolean;
}

const promoPoints = [
  {
    title: 'Easy to use',
    text: 'Clean, fast forms with colors synced to the landing page.',
  },
  {
    title: 'Context-aware',
    text: 'The parking background and cream-orange tones clearly identify this as a parking system.',
  },
  {
    title: 'Secure access',
    text: 'Account information and the sign-in / sign-up flows are presented concisely and clearly.',
  },
];

export default function AuthPage({ mode, notice, onModeChange, onBackHome, onSubmit, isLoading }: AuthPageProps) {
  const [searchParams] = useSearchParams();
  const [localNotice, setLocalNotice] = useState<{ message?: string; type?: string } | null>(null);
  const [form, setForm] = useState(initialForm);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  // Only remember the EMAIL to suggest sign-in — NEVER store passwords on the client.
  const [savedAccounts, setSavedAccounts] = useState<{ email: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState<number>(0);
  const [resetToken, setResetToken] = useState<string | null>(null);
  // Notification modal (success/failure) for the forgot & reset password flow.
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
  }, [searchParams]);

  useEffect(() => {
    const checkLock = () => {
      const email = form.email.trim().toLowerCase();
      if (!email) {
        setLockTimeLeft(0);
        return;
      }
      const lockUntil = Number(localStorage.getItem(`pbms.lockUntil.${email}`) || '0');
      const timeLeft = Math.ceil((lockUntil - Date.now()) / 1000);
      
      if (timeLeft > 0) {
        setLockTimeLeft(timeLeft);
      } else {
        setLockTimeLeft(0);
      }
    };


    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [form.email]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved emails from localStorage on mount and initialize phones
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      if (stored) {
        // Keep only the email; remove any plaintext passwords left over from older versions.
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

    // Initialize mock database if not already present
    if (!localStorage.getItem('pbms.allRegisteredPhones')) {
      localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(["0911111111", "0922222222"]));
    }
  }, []);

  // Save email helper (no password persisted)
  const saveAccount = (email: string) => {
    if (!email) return;
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      let current: { email: string }[] = stored ? JSON.parse(stored) : [];

      // Remove duplicates, add to front, keep max 5
      current = current.filter((acc) => acc.email !== email);
      current.unshift({ email });
      current = current.slice(0, 5);

      localStorage.setItem('pbms_saved_accounts', JSON.stringify(current));
      setSavedAccounts(current);
    } catch (e) {
      console.error('Failed to save account', e);
    }
  };

  // Delete saved account
  const deleteSavedAccount = (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevents input from losing focus!
    try {
      const updated = savedAccounts.filter(acc => acc.email !== emailToDelete);
      localStorage.setItem('pbms_saved_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (err) {
      console.error('Failed to delete saved account', err);
    }
  };

  const handleSelectAccount = (e: React.MouseEvent, acc: { email: string }) => {
    e.preventDefault(); // Prefill the email; the user enters the password.
    setForm((s) => ({ ...s, email: acc.email }));
    setShowDropdown(false);
    // Auto-focus the password field after filling the email so the browser can suggest the saved password
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  // 3D Mouse Tracking Tilt Motion Values
  const mouseX = useMotionValue(0.5); // Range: 0 to 1
  const mouseY = useMotionValue(0.5); // Range: 0 to 1

  // Smooth springs for high-tactile response
  const springX = useSpring(mouseX, { stiffness: 120, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22 });

  // Map mouse positions to rotational angles
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);
  const rotateX = useTransform(springY, [0, 1], [8, -8]);

  const title = useMemo(() => {
    if (mode === 'reset-password') return 'Reset password';
    if (mode === 'forgot-password') return 'Recover password';
    return mode === 'login' ? 'Sign in to PBMS' : 'Create a PBMS account';
  }, [mode]);
  const description = useMemo(() => {
    if (mode === 'reset-password')
      return 'Enter your new password to complete the reset process.';
    if (mode === 'forgot-password')
      return 'Enter the email linked to your account to receive a password reset link.';
    return mode === 'login'
      ? 'Sign in to continue using the parking management system, track your information and access the features you need.'
      : 'Create a new account to start using the parking management platform with a UI consistent with the homepage.';
  }, [mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setLocalNotice({ message: 'Passwords do not match!', type: 'error' });
        return;
      }

      const phoneTrimmed = form.phone.trim();
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        setLocalNotice({
          message: 'Phone number must start with 0 and be exactly 10 digits!',
          type: 'error',
        });
        return;
      }

      const allRegisteredPhonesRaw = localStorage.getItem('pbms.allRegisteredPhones');
      const allRegisteredPhones: string[] = allRegisteredPhonesRaw
        ? JSON.parse(allRegisteredPhonesRaw)
        : ['0911111111', '0922222222'];

      if (allRegisteredPhones.includes(phoneTrimmed)) {
        setLocalNotice({
          message: 'This phone number is already registered by another account!',
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
        
        // Add new phone to simulated registry on registration success
        const updatedPhones = [...allRegisteredPhones, phoneTrimmed];
        localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(updatedPhones));
      } catch (err) {
        // Error already mapped in public auth flow hook
      }
    } else {
      const email = form.email.trim().toLowerCase();
      
      // Strict frontend-side login lock check
      const lockUntil = Number(localStorage.getItem(`pbms.lockUntil.${email}`) || '0');
      const timeLeft = Math.ceil((lockUntil - Date.now()) / 1000);
      if (timeLeft > 0) {
        setLocalNotice({
          message: `Account temporarily locked. Please come back in ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s!`,
          type: 'error',
        });
        return;
      }

      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
      };

      try {
        await onSubmit({ mode, payload });
        
        // Login success: clear wrong attempts counters & lock periods
        localStorage.removeItem(`pbms.failedAttempts.${email}`);
        localStorage.removeItem(`pbms.lockUntil.${email}`);
        saveAccount(form.email.trim());
      } catch (err) {
        // Login failure: increment fail counters & lock for 5 mins if attempts >= 5
        const attempts = Number(localStorage.getItem(`pbms.failedAttempts.${email}`) || '0') + 1;
        if (attempts >= 5) {
          localStorage.setItem(`pbms.lockUntil.${email}`, String(Date.now() + 5 * 60 * 1000));
          localStorage.removeItem(`pbms.failedAttempts.${email}`);
          setLockTimeLeft(300);
          setLocalNotice({
            message: 'Account locked for 5 minutes due to more than 5 failed password attempts!',
            type: 'error',
          });
        } else {
          localStorage.setItem(`pbms.failedAttempts.${email}`, String(attempts));
          setLocalNotice({
            message: `Incorrect email or password. You have ${5 - attempts} attempts left before your account is locked!`,
            type: 'error',
          });
        }
      }
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalNotice({ message: 'Invalid email!', type: 'error' });
      return;
    }

    try {
      await forgotPassword(email);
      setModal({
        title: 'Recovery email sent',
        message:
          'If this email exists in the system, we have sent a password reset link. Please check your inbox (including spam). The link is valid for 15 minutes.',
        type: 'success',
        next: () => {
          setForgotEmail('');
          setLocalNotice(null);
          onModeChange('login');
        },
      });
    } catch (error) {
      setModal({
        title: 'Failed to send email',
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        type: 'error',
      });
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (!resetToken) {
      setLocalNotice({ message: 'The password reset link is invalid or has expired!', type: 'error' });
      return;
    }

    const newPassword = resetPasswordForm.newPassword.trim();
    const confirmPassword = resetPasswordForm.confirmPassword.trim();

    // Validation: password must not be empty
    if (!newPassword || !confirmPassword) {
      setLocalNotice({ message: 'Please enter your password!', type: 'error' });
      return;
    }

    // Validation: password length >= 6
    if (newPassword.length < 6) {
      setLocalNotice({ message: 'Password must be at least 6 characters!', type: 'error' });
      return;
    }

    // Validation: password and confirmation must match
    if (newPassword !== confirmPassword) {
      setLocalNotice({ message: 'Passwords do not match!', type: 'error' });
      return;
    }

    try {
      await resetPassword(resetToken, newPassword);

      // The password is sensitive data — do not store plaintext on the client. The source of
      // truth is the backend; only clean up leftover pending email.
      localStorage.removeItem('pbms.forgotEmail_pending');

      setModal({
        title: 'Password reset successfully',
        message: 'Your password has been updated. Please sign in with your new password.',
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
        title: 'Password reset failed',
        message:
          error instanceof Error
            ? error.message
            : 'Password reset failed. Please try again or request a new link.',
        type: 'error',
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <main 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 py-12 px-4 overflow-hidden selection:bg-orange-500 selection:text-white"
      style={{ perspective: '1200px' }}
    >
      {/* Laser Scanning Line and perspective grid animations */}
      <style>{`
        @keyframes gridScroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 45px;
          }
        }
        .cyber-grid-animate {
          animation: gridScroll 3.5s linear infinite;
        }
        @keyframes scanline {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .input-scan-focus {
          transition: all 0.3s ease;
        }
        .input-scan-focus:focus {
          background-image: linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(249,115,22,0.06) 50%, rgba(15,23,42,0.85) 100%);
          background-size: 200% 100%;
          animation: scanline 2.5s linear infinite;
        }
      `}</style>
      
      {/* Background Neon Glow Vectors */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_60%)] pointer-events-none blur-3xl z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.06),transparent_60%)] pointer-events-none blur-3xl z-0" />

      {/* 3D Cyber-Grid Perspective Floor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[50%] opacity-40"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div 
            className="w-full h-full cyber-grid-animate"
            style={{
              transform: 'rotateX(75deg)',
              transformOrigin: 'bottom center',
              backgroundImage: `
                linear-gradient(to right, rgba(249, 115, 22, 0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(168, 85, 247, 0.12) 1px, transparent 1px)
              `,
              backgroundSize: '45px 45px',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)',
            }}
          />
        </div>
      </div>

      {/* Floating Sticky Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur-md px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 shadow-xl hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:scale-105 transition-all duration-300"
        >
          <Home size={14} className="stroke-[3]" />
          Go to home
        </a>
      </div>

      {/* Core Center Auth Container with 3D Mouse Tilt */}
      <motion.div 
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d" 
        }}
        initial={{ opacity: 0, scale: 0.96, z: -100 }}
        animate={{ opacity: 1, scale: 1, z: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
        className="w-full max-w-4xl glass-panel-dark border border-white/5 shadow-2xl rounded-3xl overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-none grid grid-cols-1 md:grid-cols-2 relative z-10"
      >
        {/* Left Interactive Promo Info Column */}
        <div 
          className="p-8 text-white flex flex-col justify-between relative overflow-hidden preserve-3d bg-slate-950"
          style={{ 
            transformStyle: "preserve-3d",
            backgroundImage: `url(${back1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark Glassmorphic Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/85 to-orange-950/70 pointer-events-none z-0" />
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />
          
          <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
            <h2 className="text-3xl font-black tracking-tight">{title}</h2>
            <p className="mt-3.5 text-xs font-bold text-orange-100 leading-relaxed">{description}</p>
          </div>
          
          {/* Centered Premium Illustration Section */}
          <div 
            className="relative my-6 py-4 flex flex-col items-center justify-center min-h-[180px] z-10 preserve-3d"
            style={{ transform: "translateZ(45px)", transformStyle: "preserve-3d" }}
          >
            {/* Ambient Background Glow behind the Image */}
            <div className="absolute w-48 h-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15),transparent_70%)] pointer-events-none blur-2xl" />
            
            {/* Holographic Spark Particles */}
            {[
              { id: 1, left: "20%", color: "#f97316", delay: 0 },
              { id: 2, left: "40%", color: "#fbbf24", delay: 1.2 },
              { id: 3, left: "70%", color: "#f97316", delay: 2.4 },
              { id: 4, left: "80%", color: "#fbbf24", delay: 0.6 },
            ].map((spark) => (
              <motion.span
                key={spark.id}
                initial={{ y: 20, opacity: 0, scale: 0.4 }}
                animate={{ 
                  y: [20, -50], 
                  opacity: [0, 0.8, 0],
                  scale: [0.4, 1.0, 0.3]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  delay: spark.delay,
                  ease: "easeInOut"
                }}
                className="absolute w-1 h-1 rounded-full pointer-events-none filter blur-[0.5px] z-0"
                style={{
                  left: spark.left,
                  backgroundColor: spark.color,
                  boxShadow: `0 0 6px ${spark.color}`
                }}
              />
            ))}

            <motion.div
              animate={{ 
                y: [0, -6, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut"
              }}
              className="relative w-full max-w-[290px] aspect-[16/10] rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-950/40 backdrop-blur-sm z-10 flex items-center justify-center p-1.5"
            >
              <img 
                src={back1} 
                alt="PBMS System Illustration" 
                className="w-full h-full object-cover rounded-xl"
              />
              {/* Scanline sweep effect for high tech vibe */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/10 to-transparent pointer-events-none animate-[scan_3s_linear_infinite]" />
              <style>{`
                @keyframes scan {
                  0% { transform: translateY(-100%); }
                  100% { transform: translateY(100%); }
                }
              `}</style>
            </motion.div>
          </div>
          
          <div className="mt-4 space-y-4 relative z-10" style={{ transform: "translateZ(25px)" }}>
            {promoPoints.map((p, idx) => (
              <motion.div 
                key={p.title} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
                className="bg-white/10 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg"
              >
                <h4 className="font-black text-xs uppercase tracking-wider font-mono text-orange-100">{p.title}</h4>
                <p className="text-xs mt-1.5 opacity-90 leading-relaxed font-semibold">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Input Form Column */}
        <div className="p-8 flex flex-col justify-center bg-slate-900/10 backdrop-blur-md">
          {lockTimeLeft > 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 rounded-xl border border-rose-500/25 bg-rose-950/30 text-rose-400 p-4 text-xs font-black uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(239,68,68,0.15)] flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 stroke-[2.5]" />
                <span>Account is temporarily locked</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans tracking-normal font-semibold normal-case leading-relaxed">Wrong password more than 5 times. Please come back later:<span className="text-rose-400 font-black font-mono">{Math.floor(lockTimeLeft / 60)}m {lockTimeLeft % 60}s</span>.
              </p>
            </motion.div>
          ) : (localNotice || notice)?.message ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-5 rounded-xl border p-3.5 text-xs font-black uppercase tracking-wider font-mono backdrop-blur-md flex items-center gap-2.5 ${
                (localNotice || notice).type === 'success' 
                  ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'border-rose-500/25 bg-rose-950/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
              }`}
            >
              <AlertCircle size={14} className="shrink-0" />
              {(localNotice || notice).message}
            </motion.div>
          ) : null}

          {mode === 'forgot-password' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-bold text-foreground">Enter your email to recover your password</h3>
                <p className="text-xs text-slate-400">We will send a password reset link to your email.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Email
                </label>
                <input 
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="user@pbms.vn"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onModeChange('login');
                    setForgotEmail('');
                    setLocalNotice(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all"
                >Back</button>
                <motion.button 
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </motion.button>
              </div>
            </form>
          ) : mode === 'reset-password' ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Hidden email field: helps browser associate the new password with the right account */}
              <input type="hidden" autoComplete="username" value={forgotEmail || ''} />
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-bold text-foreground">Enter new password</h3>
                <p className="text-xs text-slate-400">Password must be at least 6 characters.</p>
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">New password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm(s => ({ ...s, newPassword: e.target.value }))}
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-10 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Confirm password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) => setResetPasswordForm(s => ({ ...s, confirmPassword: e.target.value }))}
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-10 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onModeChange('login');
                    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                    setResetToken(null);
                    setLocalNotice(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all"
                >Cancel</button>
                <motion.button 
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Processing...' : 'Reset password'}
                </motion.button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Full name</label>
                  <input 
                    name="fullName" 
                    value={form.fullName} 
                    onChange={handleChange} 
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Phone number</label>
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="0901234567" 
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Email</label>
              {/* Hidden input to hold username for browser password manager association */}
              <input 
                type="text" 
                name="username" 
                autoComplete="username" 
                value={form.email} 
                readOnly 
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
              />
              <input 
                ref={emailInputRef}
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                type="email" 
                required 
                autoComplete="one-time-code"
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setShowDropdown(false)}
                className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                placeholder="user@pbms.vn" 
              />

              {/* Custom Cyberpunk Saved Accounts Dropdown */}
              {showDropdown && savedAccounts.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-[68px] z-50 rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-md overflow-hidden py-1.5 animate-fadeIn"
                >
                  <div className="px-3.5 py-1.5 border-b border-white/5 text-[9px] font-mono text-slate-500 tracking-wider uppercase font-black">Saved accounts</div>
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onMouseDown={(e) => handleSelectAccount(e, acc)}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
                    >
                      <span className="font-medium tracking-wide truncate max-w-[85%]">{acc.email}</span>
                      <button
                        type="button"
                        onMouseDown={(e) => deleteSavedAccount(e, acc.email)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                        title="Delete this account"
                      >
                        <X size={12} className="stroke-[3]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Password</label>
              <div className="relative">
                <input 
                  ref={passwordInputRef}
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  type={showPassword ? "text" : "password"} 
                  required 
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-10 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="At least 6 characters" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => onModeChange('forgot-password')}
                  className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
                >Forgot password?</button>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1.5 relative animate-fadeIn">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Confirm password</label>
                <div className="relative">
                  <input 
                    name="confirmPassword" 
                    value={form.confirmPassword} 
                    onChange={handleChange} 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-10 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="Re-enter password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-3">
              <motion.button 
                type="submit" 
                disabled={isLoading || (mode === 'login' && lockTimeLeft > 0)} 
                whileHover={mode === 'login' && lockTimeLeft > 0 ? {} : { scale: 1.015 }}
                whileTap={mode === 'login' && lockTimeLeft > 0 ? {} : { scale: 0.96 }}
                className={`w-full h-11 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                  mode === 'login' && lockTimeLeft > 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50'
                }`}
              >
                {isLoading 
                  ? 'Processing...' 
                  : mode === 'login' && lockTimeLeft > 0 
                  ? `Locked (retry in ${Math.floor(lockTimeLeft / 60)}m ${lockTimeLeft % 60}s)` 
                  : mode === 'login' 
                  ? 'Sign in' 
                  : 'Create account'}
              </motion.button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')} 
                  className="text-xs font-bold text-slate-400 hover:text-orange-400 underline transition-colors"
                >
                  {mode === 'login' ? 'Create new account' : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </form>
          )}
        </div>
      </motion.div>

      {/* Notification modal (forgot/reset password) */}
      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                modal.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {modal.type === 'success' ? (
                <CheckCircle2 size={30} className="stroke-[2.2]" />
              ) : (
                <AlertCircle size={30} className="stroke-[2.2]" />
              )}
            </div>

            <h3 className="text-base font-black tracking-tight text-white">{modal.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{modal.message}</p>

            <button
              type="button"
              onClick={closeModal}
              className={`mt-5 h-11 w-full rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                modal.type === 'success'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)]'
                  : 'border border-white/10 text-white hover:bg-slate-800'
              }`}
            >Got it</button>
          </motion.div>
        </div>
      ) : null}
    </main>
  );
}
