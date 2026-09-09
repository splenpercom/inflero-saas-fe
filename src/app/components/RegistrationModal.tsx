import { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { submitOnboarding } from "../api/auth";
import { notifyFromError, notifySuccess } from "../lib/toast";

import { pickLang } from "../i18n/pickLang";
function parsePhone(input: string): { countryCode: string; phone: string } {
  const cleaned = input.replace(/\s+/g, "");
  if (cleaned.startsWith("+994")) {
    return { countryCode: "+994", phone: cleaned.slice(4).replace(/\D/g, "") };
  }
  if (cleaned.startsWith("+")) {
    const match = cleaned.match(/^(\+\d{1,3})(\d+)$/);
    if (match) return { countryCode: match[1], phone: match[2] };
  }
  return { countryCode: "+994", phone: cleaned.replace(/\D/g, "") };
}

export interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  successActionLabel?: string;
  onSuccessAction?: () => void;
}

export function RegistrationModal({
  open,
  onClose,
  onSuccess,
  successActionLabel,
  onSuccessAction,
}: RegistrationModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setOwnerName("");
    setEmail("");
    setPhone("");
    setBusinessName("");
    setSubmitted(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!ownerName.trim() || !email.trim() || !phone.trim() || !businessName.trim()) {
      notifyFromError(null, tr("Bütün sahələri doldurun.", "Please fill in all fields."));
      return;
    }

    const { countryCode, phone: normalizedPhone } = parsePhone(phone);
    if (normalizedPhone.length < 7) {
      notifyFromError(null, tr("Düzgün telefon nömrəsi daxil edin.", "Enter a valid phone number."));
      return;
    }

    setLoading(true);
    try {
      await submitOnboarding({
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        countryCode,
        businessName: businessName.trim(),
      });
      notifySuccess(
        tr(
          "Qeydiyyat sorğunuz göndərildi. Təsdiqdən sonra e-poçt alacaqsınız.",
          "Registration request submitted. You will receive credentials by email after approval.",
        ),
      );
      setSubmitted(true);
      onSuccess?.();
    } catch (e) {
      notifyFromError(
        e,
        tr("Qeydiyyat uğursuz oldu. Yenidən cəhd edin.", "Registration failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <div className="bg-[#042f2e] border border-white/15 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{tr("Hesab yaradın", "Create your account")}</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {tr(
                "Sorğunuz admin tərəfindən nəzərdən keçiriləcək",
                "Your request will be reviewed by our team",
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{tr("Sorğu göndərildi!", "Request submitted!")}</h3>
            <p className="text-sm text-white/50 mb-6">
              {tr(
                "Təsdiqdən sonra giriş məlumatlarınız e-poçtla göndəriləcək. Bu vaxta qədər daxil ola bilməzsiniz.",
                "After approval, login credentials will be emailed to you. You cannot sign in until then.",
              )}
            </p>
            {onSuccessAction ? (
              <button
                onClick={() => {
                  handleClose();
                  onSuccessAction();
                }}
                className="w-full py-3 rounded-2xl bg-white text-[#14b8a6] text-sm font-bold hover:bg-white/95 transition-colors"
              >
                {successActionLabel ?? tr("Bağla", "Close")}
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-white text-[#14b8a6] text-sm font-bold hover:bg-white/95 transition-colors"
              >
                {tr("Bağla", "Close")}
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {[
              {
                label: tr("Ad Soyad", "Full name"),
                value: ownerName,
                setter: setOwnerName,
                type: "text",
                placeholder: tr("Anar Həsənov", "John Smith"),
              },
              {
                label: tr("E-poçt", "Email"),
                value: email,
                setter: setEmail,
                type: "email",
                placeholder: "you@business.az",
              },
              {
                label: tr("Telefon", "Phone"),
                value: phone,
                setter: setPhone,
                type: "tel",
                placeholder: "+994 50 000 00 00",
              },
              {
                label: tr("Şirkət adı", "Business name"),
                value: businessName,
                setter: setBusinessName,
                type: "text",
                placeholder: tr("Şirkət adı", "Your company"),
              },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-white/50 block mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-[#14b8a6]/50 focus:ring-1 focus:ring-[#14b8a6]/30 transition-colors"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={loading || !ownerName || !email || !phone || !businessName}
              className="w-full py-3 mt-2 rounded-2xl bg-white text-[#14b8a6] text-sm font-bold hover:bg-white/95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/10"
            >
              {loading ? tr("Göndərilir…", "Submitting…") : tr("Sorğu göndər", "Submit request")}
            </button>
            <p className="text-[10px] text-center text-white/25">
              {tr(
                "Qeydiyyat daxil olmaq hüququ vermir — admin təsdiqindən sonra e-poçt alacaqsınız.",
                "Registering does not grant login access — you will receive credentials by email after admin approval.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
