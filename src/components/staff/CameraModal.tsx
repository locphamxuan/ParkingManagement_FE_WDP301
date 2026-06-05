import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plate: string) => void;
}

export function CameraModal({ isOpen, onClose, onSuccess }: CameraModalProps) {
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = async () => {
    setOcrError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      streamRef.current = mediaStream;
    } catch (err) {
      console.error('Failed to start webcam:', err);
      setOcrError('Could not start the webcam. Please grant camera access.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to let DOM mount
      const timer = setTimeout(() => {
        startWebcam();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopWebcam();
    }
  }, [isOpen]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const correctOcrDigits = (suffix: string): string => {
    let corrected = '';
    for (let i = 0; i < suffix.length; i++) {
      const char = suffix[i];
      if (/[0-9]/.test(char)) {
        corrected += char;
      } else {
        if (char === 'S') {
          const prev = i > 0 ? suffix[i - 1] : '';
          const next = i < suffix.length - 1 ? suffix[i + 1] : '';
          if (prev === '8') {
            corrected += '9'; // 8S -> 89
          } else if (prev === '5') {
            corrected += '6'; // 5S -> 56
          } else if (next === '7') {
            corrected += '6'; // S7 -> 67
          } else {
            corrected += '5'; // default S -> 5
          }
        } else if (char === 'B') {
          corrected += '8';
        } else if (char === 'O' || char === 'D' || char === 'Q') {
          corrected += '0';
        } else if (char === 'I' || char === 'T' || char === 'J' || char === 'L') {
          corrected += '1';
        } else if (char === 'Z') {
          corrected += '2';
        } else if (char === 'A') {
          corrected += '4';
        } else if (char === 'G') {
          corrected += '6';
        } else {
          corrected += '0';
        }
      }
    }
    return corrected;
  };

  const normalizePlate = (rawText: string): string => {
    const upperText = rawText.toUpperCase().trim();
    
    // Replace all non-alphanumeric character sequences with a single space
    const normalizedSpaces = upperText.replace(/[^A-Z0-9]+/g, ' ');
    const parts = normalizedSpaces.split(' ').filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      const part1 = parts[0];
      const suffixParts = parts.slice(1);
      const cleanSuffixParts = suffixParts.map(p => correctOcrDigits(p));
      
      if (cleanSuffixParts.length === 2) {
        const s1 = cleanSuffixParts[0];
        const s2 = cleanSuffixParts[1];
        if (s1.length === 3 && s2.length === 2) {
          return `${part1}-${s1}.${s2}`;
        }
      }
      
      const combinedSuffix = cleanSuffixParts.join('');
      if (combinedSuffix.length === 5) {
        return `${part1}-${combinedSuffix.substring(0, 3)}.${combinedSuffix.substring(3)}`;
      } else if (combinedSuffix.length === 4) {
        return `${part1}-${combinedSuffix}`;
      }
    }

    // Double fallback: regex-based
    const pattern = /(\d{2}[^A-Z0-9]*[A-Z]{1,2}\d{0,2})[\s\-_.]*(\d{3}[\s\-_.]*\d{2}|\d{3,5})/g;
    const match = pattern.exec(upperText);
    
    if (match) {
      const part1 = match[1].replace(/[^A-Z0-9]/g, '');
      const part2 = correctOcrDigits(match[2].replace(/[^A-Z0-9]/g, ''));
      
      let formattedPart2 = part2;
      if (part2.length === 5) {
        formattedPart2 = part2.substring(0, 3) + '.' + part2.substring(3);
      }
      return `${part1}-${formattedPart2}`;
    }
    
    const clean = upperText.replace(/[^A-Z0-9]/g, '');
    return clean.substring(0, 12);
  };

  const recognizePlateFromImage = async (base64String: string) => {
    setIsOcrLoading(true);
    setOcrError(null);
    try {
      const formData = new FormData();
      formData.append('apikey', 'K87161803788957');
      formData.append('base64Image', base64String);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`OCR Space API returned status ${res.status}`);
      }

      const data = await res.json();

      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.[0] || 'Image processing error.');
      }

      // Read from data.ParsedResults[0].ParsedText
      const text = data.ParsedResults?.[0]?.ParsedText || data.ParsedText || '';
      
      if (!text.trim()) {
        throw new Error('No characters recognized. Please try again with a clearer image.');
      }

      const formattedPlate = normalizePlate(text);
      if (!formattedPlate) {
        throw new Error('Could not extract a valid license plate.');
      }

      onSuccess(formattedPlate);
      stopWebcam();
      onClose();
    } catch (err) {
      console.error(err);
      setOcrError(err instanceof Error ? err.message : 'Recognition failed.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const captureFrameAndScan = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64String = canvas.toDataURL('image/jpeg', 0.85);
        await recognizePlateFromImage(base64String);
      }
    } catch (err) {
      setOcrError('Could not capture from webcam.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl overflow-hidden relative"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes laser-scan {
            0% { top: 4%; }
            50% { top: 96%; }
            100% { top: 4%; }
          }
          .animate-laser {
            animation: laser-scan 2.5s infinite linear;
          }
        `}} />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Live AI Feed</p>
            <h3 className="text-xl font-semibold text-white">Webcam Plate Scan</h3>
          </div>
          <button
            onClick={() => { stopWebcam(); onClose(); }}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Video stream container */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
          {ocrError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
              <AlertCircle className="h-10 w-10 text-rose-400 mb-2" />
              <p className="text-sm text-slate-300 max-w-[280px]">{ocrError}</p>
              <Button
                onClick={startWebcam}
                className="mt-4 h-8 px-4 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20"
              >
                Retry
              </Button>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {/* Laser Scan Overlay */}
          <div className="absolute inset-0 border border-emerald-500/20 pointer-events-none">
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-laser pointer-events-none" />
            <div className="absolute top-4 left-4 h-5 w-5 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-4 right-4 h-5 w-5 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-emerald-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/60 bg-slate-950/40 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                Align the plate within this area
              </p>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            onClick={captureFrameAndScan}
            disabled={isOcrLoading}
            className="h-11 gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 font-medium"
          >
            {isOcrLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recognizing...
              </>
            ) : (
              <>
                🎯 Capture &amp; Recognize
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => { stopWebcam(); onClose(); }}
            className="h-11 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
