import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays, Users, Package, TrendingUp, Shield,
  BarChart3, CheckCircle, ArrowRight, Menu, X, Car, ShoppingBag,
  Zap, ChevronRight, Play, Globe, Store,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { RegistrationModal } from "../RegistrationModal";
import { AppBrandLogo } from "../ui/AppBrandLogo";
import { LanguageSwitcherDropdown } from "../LanguageSwitcherDropdown";
import { pickLang } from "../../i18n/pickLang";

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const pct = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setCount(Math.floor(ease * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ── Intersection observer hook ────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, index }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; description: string; index: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={`group relative bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 cursor-default
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2 leading-snug">{title}</h3>
      <p className="text-xs text-white/50 leading-relaxed">{description}</p>
      {/* subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0026f6]/0 to-[#0026f6]/0 group-hover:from-[#0026f6]/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { enterDemo } = useAuth();
  const { language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const goToDemo = () => {
    enterDemo();
    navigate("/dashboard");
  };

  // Parallax scroll
  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // Stats counter section
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsInView(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);
  const c1 = useCounter(1200, 1600, statsInView);
  const c2 = useCounter(98,   1200, statsInView);
  const c3 = useCounter(340,  1800, statsInView);
  const c4 = useCounter(24,   1000, statsInView);

  const features = [
    { icon: Store,         title: tr("POS & Satış", "POS & Sales"),                          description: tr("Mağaza və onlayn satışları, fakturaları və ödənişləri bir paneldən idarə edin.", "Run in-store and online sales, invoices, and payments from one dashboard.") },
    { icon: Package,       title: tr("İnventar İdarəetməsi", "Inventory Management"),         description: tr("Məhsul və ehtiyatları izləyin, az stok xəbərdarlıqları alın, anbarları sinxron saxlayın.", "Track products and stock, get low-stock alerts, and keep warehouses in sync.") },
    { icon: Users,         title: tr("Müştəri CRM", "Customer CRM"),                         description: tr("Müştəri məlumatlarını, sifariş tarixçəsini və əlaqələri mərkəzləşdirin.", "Centralize customer profiles, order history, and relationship records.") },
    { icon: Car,           title: tr("Avtomobil Servisi", "Car Service Ops"),                description: tr("Rezervasiyalar, nəqliyyat vasitələri və servis tarixçəsi — servis sexləri üçün.", "Reservations, vehicles, and service history — built for auto workshops.") },
    { icon: ShoppingBag,  title: tr("E-ticarət Mağazaları", "Ecommerce Stores"),            description: tr("Kataloq, stok və sifariş axınını e-ticarət biznesiniz üçün sadələşdirin.", "Simplify catalog, stock, and order flow for ecommerce businesses.") },
    { icon: BarChart3,     title: tr("Maliyyə & Hesabatlar", "Finance & Reports"),            description: tr("Gəlir, xərc, mənfəət analitikası və ödəniş tarixçəsi bir paneldə.", "Revenue, expenses, profit analytics, and payment history in one place.") },
    { icon: Globe,         title: tr("Müştəri Saytı", "Customer-Facing Site"),               description: tr("Brend altdomen saytı — rezervasiya və ya sifariş üçün.", "A branded subdomain site for booking or customer orders.") },
    { icon: Shield,        title: tr("Çoxlu Filial Dəstəyi", "Multi-Branch Support"),         description: tr("Bir neçə filialı, anbarları və işçi rollarını mərkəzdən idarə edin.", "Manage multiple branches, warehouses, and staff roles from one account.") },
  ];

  return (
    <div className="min-h-screen bg-[#00082e] text-white overflow-x-hidden">

      {/* ── CSS keyframes ───────────────────────────────────────── */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes glow  { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slide-up  { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in   { from{opacity:0} to{opacity:1} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .animate-float     { animation: float 6s ease-in-out infinite }
        .animate-float-d   { animation: float 8s ease-in-out infinite 1s }
        .animate-glow      { animation: glow  4s ease-in-out infinite }
        .animate-slide-up  { animation: slide-up  0.7s cubic-bezier(.16,1,.3,1) both }
        .animate-fade-in   { animation: fade-in   0.6s ease both }
        .animate-spin-slow { animation: spin-slow 20s linear infinite }
        .delay-100 { animation-delay: 0.1s }
        .delay-200 { animation-delay: 0.2s }
        .delay-300 { animation-delay: 0.3s }
        .delay-400 { animation-delay: 0.4s }
        .delay-500 { animation-delay: 0.5s }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(0, 8, 46, 0.95) inset !important;
          -webkit-text-fill-color: rgba(255,255,255,0.90) !important;
          caret-color: white;
          transition: background-color 9999s ease-in-out 0s;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #8ab4ff 40%, #fff 60%, #8ab4ff 80%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.10);
        }
        .mesh-gradient {
          background:
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0,38,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 70%, rgba(0,38,246,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50% 0%, rgba(100,140,255,0.12) 0%, transparent 55%);
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 40 ? "bg-[#00082e]/95 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/20" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <AppBrandLogo onDarkBackground size="nav" />

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: tr("Xüsusiyyətlər", "Features"),  href: "#features" },
              { label: tr("Necə işləyir", "How it works"), href: "#how" },
              { label: tr("Əlaqə", "Contact"),             href: "#cta" },
            ].map(l => (
              <a key={l.href} href={l.href}
                className="px-3.5 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/8 transition-all duration-200 font-medium">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcherDropdown variant="dark" />
            </div>
            <button onClick={() => navigate("/login")}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/8 border border-white/10 transition-all font-medium">
              {tr("Daxil ol", "Sign in", "Войти")}
            </button>
            <button onClick={() => setIsRegisterOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-white text-[#0026f6] font-bold hover:bg-white/90 transition-all shadow-lg shadow-white/10">
              {tr("Başla", "Get started")}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/8 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass-card mx-4 mb-3 rounded-2xl p-4 space-y-1">
            {[tr("Xüsusiyyətlər","Features"), tr("Necə işləyir","How it works"), tr("Əlaqə","Contact")].map(l => (
              <button key={l} onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
                {l}
              </button>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <button onClick={() => navigate("/login")} className="w-full py-2.5 text-sm text-center text-white/70 border border-white/15 rounded-xl hover:bg-white/8 transition-colors">
                {tr("Daxil ol", "Sign in")}
              </button>
              <button onClick={() => { setMobileMenuOpen(false); setIsRegisterOpen(true); }}
                className="w-full py-2.5 text-sm text-center bg-white text-[#0026f6] font-bold rounded-xl">
                {tr("Başla", "Get started")}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">

        {/* Mesh background */}
        <div className="absolute inset-0 mesh-gradient" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#0026f6]/12 blur-3xl animate-glow pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#0026f6]/60 blur-3xl animate-glow pointer-events-none" style={{ animationDelay:"2s" }} />

        {/* Rotating ring decoration */}
        <div className="absolute top-20 right-12 w-72 h-72 rounded-full border border-white/5 animate-spin-slow pointer-events-none hidden lg:block">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0026f6]/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 w-full">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-xs font-semibold text-white/70 mb-8 animate-slide-up">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {tr("Hər biznes üçün vahid SaaS platforması", "The all-in-one SaaS for every business")}
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6 animate-slide-up delay-100">
              <span className="text-white">{tr("Biznesinizi", "Run your")}</span>
              <br />
              <span className="shimmer-text">{tr("bir paneldən", "entire business")}</span>
              <br />
              <span className="text-white">{tr("idarə edin.", "from one place.")}</span>
            </h1>

            {/* Sub */}
            <p className="text-lg sm:text-xl text-white/50 leading-relaxed mb-10 max-w-2xl animate-slide-up delay-200">
              {tr(
                "Avtomobil servisi, e-ticarət mağazaları və digər şirkətlər üçün POS, inventar, CRM, maliyyə və filial idarəetməsi — hamısı bir platformada.",
                "For car service shops, ecommerce stores, and growing companies — POS, inventory, CRM, finance, and multi-branch ops in one platform."
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up delay-300">
              <button onClick={() => setIsRegisterOpen(true)}
                className="group flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white text-[#0026f6] text-sm font-bold hover:bg-white/95 transition-all shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]">
                {tr("Əlaqə saxlayın", "Get in touch")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={goToDemo}
                className="group flex items-center justify-center gap-2 px-7 py-4 rounded-2xl glass-card text-sm font-semibold text-white/80 hover:text-white hover:bg-white/8 transition-all hover:scale-[1.01]">
                <Play className="w-4 h-4 fill-current text-white/50 group-hover:text-white/80 transition-colors" />
                {tr("Demo-ya bax", "View live demo")}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 animate-slide-up delay-400">
              {[
                { icon: Shield, text: tr("Məlumat təhlükəsizliyi", "SOC 2 compliant") },
                { icon: Zap,    text: tr("99.9% uptime", "99.9% uptime") },
                { icon: CheckCircle, text: tr("Sürətli quraşdırma", "Quick setup & onboarding") },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-1.5 text-xs text-white/40">
                  <b.icon className="w-3.5 h-3.5 text-white/30" />
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Floating dashboard preview */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[420px] hidden xl:block animate-float pointer-events-none">
            <div className="glass-card rounded-3xl p-5 shadow-2xl shadow-black/40"
              style={{ transform: `translateY(${scrollY * 0.04}px)` }}>
              {/* Mini dashboard mockup */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                <div className="flex-1 h-5 rounded-md bg-white/5 ml-2" />
              </div>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {[
                  { label: tr("Bugünkü Satışlar","Today's Sales"), val: "12", color: "text-blue-300" },
                  { label: tr("Aylıq Gəlir","Monthly Revenue"), val: "15,200 ₼", color: "text-green-300" },
                  { label: tr("Aktiv Müştərilər","Active Customers"), val: "248", color: "text-purple-300" },
                  { label: tr("Az Stok","Low Stock"), val: "5", color: "text-orange-300" },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.06] rounded-xl p-3">
                    <p className={`text-lg font-black ${s.color} leading-none mb-1`}>{s.val}</p>
                    <p className="text-[9px] text-white/40 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Mini chart bars */}
              <div className="bg-white/[0.04] rounded-xl p-3">
                <p className="text-[9px] text-white/30 mb-2">{tr("Son 7 gün","Last 7 days")}</p>
                <div className="flex items-end gap-1 h-12">
                  {[40,65,50,80,70,90,75].map((h,i) => (
                    <div key={i} className="flex-1 rounded-t"
                      style={{ height:`${h}%`, background:`rgba(0,38,246,${0.3 + i*0.07})` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating notification pill */}
            <div className="absolute -bottom-4 -left-8 glass-card rounded-2xl px-4 py-2.5 shadow-xl animate-float-d flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/80 font-semibold">{tr("Yeni sifariş","New order")}</p>
                <p className="text-[9px] text-white/40">{tr("Anar Həsənov · Onlayn mağaza","Anar Həsənov · Online store")}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1" />
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#00082e] to-transparent pointer-events-none" />
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 border-y border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: c1, suffix: "+", label: tr("Aktiv İşletmə", "Active Businesses") },
              { value: c2, suffix: "%", label: tr("Müştəri Məmnuniyyəti", "Customer Satisfaction") },
              { value: c3, suffix: "+", label: tr("Gündəlik Sifariş", "Daily Orders") },
              { value: c4, suffix: "/7", label: tr("Saat Dəstək", "Hour Support") },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl sm:text-5xl font-black text-white mb-2 tabular-nums">
                  {s.value.toLocaleString()}<span className="text-[#0026f6]">{s.suffix}</span>
                </p>
                <p className="text-sm text-white/40 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-semibold text-white/50 mb-4">
              <Zap className="w-3 h-3 text-[#0026f6]" />
              {tr("Platforma xüsusiyyətləri", "Platform features")}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              {tr("Biznesinizin", "Everything your")}
              <br />
              <span className="text-white/30">{tr("ehtiyac duyduğu hər şey", "business needs")}</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              {tr("Avtomobil servisindən e-ticarətə qədər — bir paneldən idarə olunan tam iş həlli.", "From car service to ecommerce — a complete operations suite in a single panel.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} index={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-semibold text-white/50 mb-4">
              <TrendingUp className="w-3 h-3 text-[#0026f6]" />
              {tr("Sadə proses", "Simple process")}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {tr("3 addımda başlayın", "Up and running in 3 steps")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-14 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {[
              { step:"01", icon: Users, title: tr("Hesab açın","Create your account"), desc: tr("Şirkətinizi qeydiyyatdan keçirin, işçiləri əlavə edin, filiallarınızı konfiqurasiya edin.","Register your business, add your team, and configure your branches in minutes.") },
              { step:"02", icon: Store, title: tr("Əməliyyatları qurun","Set up operations"), desc: tr("İnventar, satış, müştərilər və filiallarınızı bir neçə dəqiqəyə konfiqurasiya edin.","Configure inventory, sales, customers, and branches in a few minutes.") },
              { step:"03", icon: BarChart3, title: tr("Analitika ilə böyüyün","Grow with analytics"), desc: tr("Satış, saxlama və ən yaxşı məhsullar haqqında real vaxtda məlumat alın.","Get real-time insights on sales, retention, and top-performing products.") },
            ].map((s, i) => {
              const { ref, inView } = useInView();
              return (
                <div key={i} ref={ref}
                  style={{ transitionDelay: `${i * 120}ms` }}
                  className={`glass-card rounded-3xl p-8 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                  <div className="text-6xl font-black text-white/5 mb-4 leading-none">{s.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0026f6]/20 to-[#0026f6]/30 border border-[#0026f6]/20 flex items-center justify-center mx-auto mb-5">
                    <s.icon className="w-6 h-6 text-[#6699ff]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section id="cta" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,38,246,0.12) 0%, transparent 70%)"
        }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            {tr("Biznesinizi bugün", "Transform your")}
            <br />
            <span className="shimmer-text">{tr("böyüdün.", "business today.")}</span>
          </h2>
          <p className="text-lg text-white/40 mb-10 leading-relaxed">
            {tr("Avtomobil servisi, e-ticarət və digər şirkətlərin güvəndiyi platforma. Komandamız sizinlə əlaqə saxlayacaq.", "Trusted by car service shops, ecommerce stores, and growing companies. Our team will reach out to get you started.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setIsRegisterOpen(true)}
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#0026f6] text-sm font-black hover:bg-white/95 transition-all shadow-2xl shadow-white/10 hover:scale-[1.02]">
              {tr("İndi əlaqə saxlayın", "Contact us today")}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button onClick={goToDemo}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass-card text-sm font-semibold text-white/70 hover:text-white hover:bg-white/8 transition-all">
              {tr("Demo-ya bax", "View demo")}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <AppBrandLogo onDarkBackground size="footer" className="opacity-70" />
          <p className="text-xs text-white/25 text-center">
            © {new Date().getFullYear()} Inflero. {tr("Bütün hüquqlar qorunur.", "All rights reserved.")}
          </p>
          <div className="flex items-center gap-4">
            {[tr("Məxfilik","Privacy"), tr("Şərtlər","Terms"), tr("Əlaqə","Contact")].map(l => (
              <button key={l} className="text-xs text-white/30 hover:text-white/60 transition-colors">{l}</button>
            ))}
          </div>
        </div>
      </footer>

      <RegistrationModal
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        successActionLabel={tr("Demo-ya bax", "Explore the demo")}
        onSuccessAction={goToDemo}
      />
    </div>
  );
}
