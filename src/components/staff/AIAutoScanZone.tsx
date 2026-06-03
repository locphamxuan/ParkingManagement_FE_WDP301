import { useRef, useState } from 'react';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraModal } from './CameraModal';

interface AIAutoScanZoneProps {
  onScanSuccess: (plate: string) => void;
}

export function AIAutoScanZone({ onScanSuccess }: AIAutoScanZoneProps) {
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolves Lỗi 2: Convert raw OCR text to uppercase before regex matching
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
        throw new Error(data.ErrorMessage?.[0] || 'Lỗi xử lý hình ảnh.');
      }

      // Resolves Lỗi 1: Read from data.ParsedResults[0].ParsedText
      const text = data.ParsedResults?.[0]?.ParsedText || data.ParsedText || '';

      if (!text.trim()) {
        throw new Error('Không nhận diện được ký tự nào. Vui lòng tải lên ảnh rõ nét hơn.');
      }

      const formattedPlate = normalizePlate(text);
      if (!formattedPlate) {
        throw new Error('Không trích xuất được biển số xe hợp lệ.');
      }

      onScanSuccess(formattedPlate);
    } catch (err) {
      console.error(err);
      setOcrError(err instanceof Error ? err.message : 'Nhận diện hình ảnh thất bại.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file) return;
    setIsOcrLoading(true);
    setOcrError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      recognizePlateFromImage(base64String);
    };
    reader.onerror = () => {
      setOcrError('Không thể đọc file ảnh.');
      setIsOcrLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`relative mb-4 flex flex-col items-center justify-center rounded-2xl border border-dashed p-5 transition-all duration-300 ${
          dragActive
            ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
            : 'border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 backdrop-blur-md hover:border-orange-500/40 hover:from-orange-500/10 hover:to-amber-500/10'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 items-center justify-center rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]">
              AI LPR Auto-Scan
            </div>
          </div>
          <p className="text-xs text-slate-300 mb-4 max-w-[280px]">
            Quét biển số tự động. Kéo thả ảnh CCTV tại đây hoặc sử dụng điều khiển bên dưới.
          </p>

          {isOcrLoading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="h-8 w-8 text-orange-400 animate-spin mb-2" />
              <p className="text-xs font-semibold text-orange-300">Đang nhận diện biển số xe...</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 justify-center">
              <Button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="h-9 px-4 rounded-xl border border-orange-500/30 bg-orange-500/15 text-xs text-orange-200 hover:bg-orange-500/25 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)] gap-1.5 transition-all duration-200 animate-pulse hover:animate-none"
              >
                <Camera size={14} /> Quét WebCam Trực Tiếp
              </Button>

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 gap-1.5 transition-all duration-200"
              >
                <Upload size={14} /> Tải Lên Ảnh Biển Số
              </Button>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {ocrError && (
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
              <AlertCircle size={12} className="shrink-0" />
              <span>{ocrError}</span>
            </div>
          )}
        </div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSuccess={onScanSuccess}
      />
    </>
  );
}
