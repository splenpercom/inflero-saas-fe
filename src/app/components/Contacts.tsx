import { X, Mail, Phone, MapPin, MessageSquare, Send, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import { useState } from "react";
import { AppBrandLogo } from "./ui/AppBrandLogo";
import { useLanguage } from "../i18n/LanguageContext";

import { pickLang } from "../i18n/pickLang";
interface ContactsProps {
  onClose: () => void;
}

export function Contacts({ onClose }: ContactsProps) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      t(
        "Mesajınız göndərildi! Tezliklə sizinlə əlaqə saxlayacağıq.",
        "Your message has been sent! We'll contact you soon."
      )
    );
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <AppBrandLogo onDarkBackground size="nav" />
          <button
            onClick={onClose}
            className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 p-2.5 rounded-xl text-white transition-all duration-300 hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {t("Bizimlə", "Get in")}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t("Əlaqə", "Touch")}
              </span>
            </h1>
            <p className="text-xl text-white/80">
              {t(
                "Sizə kömək etməyə hazırıq. Bizimlə əlaqə saxlayın!",
                "We're here to help. Reach out to us!"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="flex flex-col space-y-6">
              {/* Contact Cards */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t("Email", "Email")}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">
                      {t(
                        "Bizə email göndərin və 24 saat ərzində cavab alın",
                        "Send us an email and get a response within 24 hours"
                      )}
                    </p>
                    <a
                      href="mailto:noreply@inflero.com"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      noreply@inflero.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t("Telefon", "Phone")}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">
                      {t(
                        "İş günləri 9:00-18:00 arası zəng edin",
                        "Call us on weekdays between 9:00-18:00"
                      )}
                    </p>
                    <a
                      href="tel:+994501234567"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      +994 (50) 123-45-67
                    </a>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t("Ünvan", "Address")}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">
                      {t(
                        "Bakı şəhəri, Nəsimi rayonu",
                        "Baku city, Nasimi district"
                      )}
                    </p>
                    <p className="text-blue-400">
                      {t(
                        "Azadlıq prospekti 123",
                        "123 Azadliq Avenue"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Card - Separate */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 flex-1 flex items-center justify-center">
                <div className="flex items-center justify-center gap-5">
                  {/* Instagram */}
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-pink-400 transition-colors duration-300"
                    title="Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-blue-400 transition-colors duration-300"
                    title="Facebook"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-blue-500 transition-colors duration-300"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors duration-300"
                    title="TikTok"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://whatsapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-green-400 transition-colors duration-300"
                    title="WhatsApp"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-red-500 transition-colors duration-300"
                    title="YouTube"
                  >
                    <Youtube className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {t("Mesaj Göndərin", "Send a Message")}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {t("Ad Soyad", "Full Name")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("Adınızı daxil edin", "Enter your name")}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {t("Email", "Email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t(
                      "Email ünvanınızı daxil edin",
                      "Enter your email"
                    )}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {t("Telefon", "Phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t(
                      "Telefon nömrənizi daxil edin",
                      "Enter your phone"
                    )}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {t("Mesaj", "Message")} *
                  </label>
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder={t(
                      "Mesajınızı yazın...",
                      "Write your message..."
                    )}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full group relative inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative">{t("Göndər", "Send Message")}</span>
                  <Send className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}