import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import { X, Camera } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";

type BarcodeScanModalProps = {
  open: boolean;
  onClose: () => void;
  /** Return `false` to keep the modal open (e.g. product not found). */
  onScan: (code: string) => void | boolean | Promise<void | boolean>;
  title?: string;
  /** Keep camera open and keep adding (POS). */
  continuous?: boolean;
};

type NativeBarcodeDetector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

type NativeBarcodeDetectorCtor = new (options?: { formats?: string[] }) => NativeBarcodeDetector;

const NATIVE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "qr_code",
  "data_matrix",
];

/** Ignore repeat of the same code for this long (ms). */
const DUP_COOLDOWN_MS = 1600;

function eanChecksumOk(digits: string): boolean {
  if (!/^\d{8}$|^\d{13}$/.test(digits)) return false;
  const body = digits.slice(0, -1);
  const check = Number(digits[digits.length - 1]);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const n = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  return (10 - (sum % 10)) % 10 === check;
}

/** Light filter only — reject empty junk and clearly broken EAN-8/13. */
function acceptCode(raw: string): string | null {
  const code = raw.trim();
  if (code.length < 4 || code.length > 64) return null;
  if (!/^[A-Za-z0-9\-._/]+$/.test(code)) return null;
  if (/^\d{13}$/.test(code) && !eanChecksumOk(code)) return null;
  if (/^\d{8}$/.test(code) && !eanChecksumOk(code)) return null;
  return code;
}

function getNativeDetector(): NativeBarcodeDetector | null {
  const Ctor = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: NATIVE_FORMATS });
  } catch {
    try {
      return new Ctor();
    } catch {
      return null;
    }
  }
}

function makeZxingReader() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

export function BarcodeScanModal({
  open,
  onClose,
  onScan,
  title,
  continuous = false,
}: BarcodeScanModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => pickLang(language, az, en);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const continuousRef = useRef(continuous);
  const lastSentRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  onScanRef.current = onScan;
  onCloseRef.current = onClose;
  continuousRef.current = continuous;

  const stopCamera = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    busyRef.current = false;
  }, []);

  const fireScan = useCallback(
    async (raw: string) => {
      const code = acceptCode(raw) ?? raw.trim();
      if (!code || code.length < 4) return;

      const now = Date.now();
      if (lastSentRef.current.code === code && now - lastSentRef.current.at < DUP_COOLDOWN_MS) {
        return;
      }
      lastSentRef.current = { code, at: now };

      setFlash(code);
      window.setTimeout(() => setFlash(null), 900);

      const result = await Promise.resolve(onScanRef.current(code));
      const failed = result === false;
      // Close after a successful scan unless continuous mode is on
      if (!failed && !continuousRef.current) {
        stopCamera();
        onCloseRef.current();
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      setStarting(false);
      setFlash(null);
      setManualCode("");
      lastSentRef.current = { code: "", at: 0 };
      return;
    }

    let cancelled = false;
    setStarting(true);
    setError(null);
    setFlash(null);

    const native = getNativeDetector();
    const zxing = makeZxingReader();

    const scheduleNext = (ms: number) => {
      if (cancelled) return;
      timerRef.current = setTimeout(() => {
        void tick();
      }, ms);
    };

    const tick = async () => {
      if (cancelled || busyRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        scheduleNext(100);
        return;
      }

      busyRef.current = true;
      try {
        if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
        const canvas = canvasRef.current;
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          scheduleNext(150);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);

        let raw: string | null = null;
        if (native) {
          try {
            const codes = await native.detect(canvas);
            raw = codes[0]?.rawValue ?? null;
          } catch {
            /* fall through */
          }
        }
        if (!raw) {
          try {
            raw = zxing.decodeFromCanvas(canvas).getText();
          } catch (err) {
            if (!(err instanceof NotFoundException)) {
              /* keep scanning */
            }
          }
        }

        const code = raw ? acceptCode(raw) : null;
        if (code) {
          await fireScan(code);
          scheduleNext(continuousRef.current ? 400 : 200);
          return;
        }
        scheduleNext(90);
      } finally {
        busyRef.current = false;
      }
    };

    void (async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled) return;

      if (!window.isSecureContext) {
        setStarting(false);
        setError(
          tr(
            "Kamera üçün HTTPS lazımdır (https://… Network link).",
            "Camera needs HTTPS (open the https://… Network URL).",
          ),
        );
        return;
      }

      const video = videoRef.current;
      if (!video) {
        setStarting(false);
        setError(tr("Kamera açıla bilmədi", "Could not start the camera"));
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play().catch(() => undefined);
        setStarting(false);
        scheduleNext(60);
      } catch {
        if (cancelled) return;
        setStarting(false);
        setError(
          tr(
            "Kamera icazəsi lazımdır və ya kamera tapılmadı.",
            "Camera permission required or no camera found.",
          ),
        );
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stopCamera, fireScan]);

  const submitManual = () => {
    const code = manualCode.trim();
    if (code.length < 4) return;
    setManualCode("");
    void fireScan(code);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#14b8a6]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title ?? tr("Barkod skan et", "Scan barcode")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-gray-800">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            {(starting || error) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white z-10 p-4 text-center">
                {error ?? tr("Kamera açılır...", "Starting camera...")}
              </div>
            )}
            {!error && !starting && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[5]">
                <div className="w-[88%] h-[30%] border-2 border-white/70 rounded-md" />
              </div>
            )}
            {flash && (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-[#14b8a6] text-white text-center text-xs font-semibold py-2 px-3 truncate">
                {tr("Oxundu", "Scanned")}: {flash}
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
            {tr(
              "Barkodu çərçivəyə tutun — avtomatik əlavə olunur.",
              "Point at the barcode — it adds automatically.",
            )}
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitManual();
                }
              }}
              placeholder={tr("Və ya kodu yazıb Enter", "Or type code + Enter")}
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={submitManual}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg"
            >
              {tr("Əlavə et", "Add")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
