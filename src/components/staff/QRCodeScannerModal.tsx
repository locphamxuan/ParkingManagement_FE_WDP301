import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Upload, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
}

export function QRCodeScannerModal({ isOpen, onClose, onSuccess }: QRCodeScannerModalProps) {
  const [useCamera, setUseCamera] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error('Camera start failed:', err);
      setScanError('Không thể truy cập camera. Vui lòng thử lại.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && useCamera) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, useCamera]);

  const decodeQRFromImageData = (width: number, height: number, data: Uint8ClampedArray): string | null => {
    const code = jsQR(data, width, height, {
      inversionAttempts: 'dontInvert',
    });
    return code ? code.data : null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          setScanError('Không tìm thấy Canvas để phân tích ảnh.');
          setIsLoading(false);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setScanError('Không thể tạo context 2D cho Canvas.');
          setIsLoading(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const decoded = decodeQRFromImageData(img.width, img.height, imageData.data);
          
          if (decoded) {
            onSuccess(decoded);
            onClose();
          } else {
            setScanError('Không tìm thấy mã QR nào trong hình ảnh của bạn.');
          }
        } catch (err) {
          setScanError('Lỗi phân tích hình ảnh.');
        } finally {
          setIsLoading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const captureFrameAndScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = decodeQRFromImageData(canvas.width, canvas.height, imageData.data);
      if (decoded) {
        onSuccess(decoded);
        stopCamera();
        onClose();
      } else {
        setScanError('Không tìm thấy mã QR trong khung hình camera.');
      }
    } catch (err) {
      setScanError('Lỗi xử lý quét QR.');
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
          @keyframes laser-scan-green {
            0% { top: 4%; }
            50% { top: 96%; }
            100% { top: 4%; }
          }
          .animate-laser-green {
            animation: laser-scan-green 2s infinite linear;
          }
        `}} />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-400">QR Scanner</p>
            <h3 className="text-xl font-semibold text-white">Quét Mã QR Đặt Chỗ</h3>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setUseCamera(true)}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              useCamera ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera size={14} /> Quét WebCam
          </button>
          <button
            onClick={() => setUseCamera(false)}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              !useCamera ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={14} /> Upload Ảnh
          </button>
        </div>

        {/* Tab Contents */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black flex flex-col items-center justify-center">
          {useCamera ? (
            <>
              {scanError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                  <AlertCircle className="h-10 w-10 text-rose-400 mb-2" />
                  <p className="text-sm text-slate-300 max-w-[280px]">{scanError}</p>
                  <Button
                    onClick={startCamera}
                    className="mt-4 h-8 px-4 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20"
                  >
                    Thử Lại
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

              {/* QR Laser Overlay */}
              <div className="absolute inset-0 border border-emerald-500/20 pointer-events-none">
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-laser-green pointer-events-none" />
                <div className="absolute top-4 left-4 h-5 w-5 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-4 right-4 h-5 w-5 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-emerald-400" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 border-2 border-emerald-400/40 border-dashed rounded-lg flex items-center justify-center">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-400/80 bg-slate-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                      Mã QR Đặt Chỗ
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full bg-gradient-to-br from-slate-900 to-slate-950">
              <QrCode className="h-16 w-16 text-slate-500 mb-4 animate-pulse" />
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                  <p className="text-sm font-semibold text-slate-300">Đang quét mã QR...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mb-4 max-w-[280px]">
                    Tải lên hoặc kéo thả ảnh chứa mã QR đặt chỗ từ điện thoại hoặc thiết bị của khách hàng.
                  </p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold"
                  >
                    <Upload size={14} /> Tải Lên Ảnh QR Code
                  </Button>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          )}

          {scanError && !useCamera && (
            <div className="absolute bottom-4 flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
              <AlertCircle size={12} className="shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>

        {/* Modal Controls */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {useCamera ? (
            <Button
              onClick={captureFrameAndScan}
              className="h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold"
            >
              🎯 Quét Ngay
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="secondary"
            onClick={() => { stopCamera(); onClose(); }}
            className="h-11 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Đóng
          </Button>
        </div>

        {/* Resolves Lỗi: Move <canvas> outside useCamera condition so it remains mounted on Upload tab */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
