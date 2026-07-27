import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const VISIBILITY_THRESHOLD = 640;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > VISIBILITY_THRESHOLD);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          title="Back to top"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.94 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
          onClick={scrollToTop}
          className="relative z-[70] mx-auto mt-6 flex h-12 w-fit items-center justify-center gap-2 rounded-2xl border border-cyan-300/70 bg-gradient-to-br from-blue-600 to-cyan-500 px-5 text-white shadow-[0_16px_36px_rgba(14,165,233,0.3)] transition-[filter,box-shadow] hover:brightness-110 hover:shadow-[0_18px_42px_rgba(14,165,233,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 md:fixed md:bottom-8 md:right-8 md:mt-0 md:h-12 md:w-12 md:px-0"
        >
          <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-wide md:hidden">Back to top</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
