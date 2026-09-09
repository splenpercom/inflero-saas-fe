import { pickLang } from "../../i18n/pickLang";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Upload, X, MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchTenantSettings,
  updateTenantSettings,
  uploadTenantSettingsAsset,
  deleteTenantSettingsAsset,
  type TenantSettingsRecord,
} from "../../api/tenantSettings";
import { fetchSalesBillers, updateSalesBiller, type SalesBillerRow } from "../../api/sales";
import { notifyFromError, notifyInfo, notifySuccess } from "../../lib/toast";
import { ModernSelect } from "../ui/ModernSelect";
import { LocationMapPicker } from "../ui/LocationMapPicker";

type CommissionDraft = {
  commissionType: "FIXED" | "PERCENT" | "";
  commissionValue: string;
};

interface FormSnapshot {
  companyName: string;
  companyEmail: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
  instagram: string;
  facebook: string;
  telegram: string;
  whatsapp: string;
  tiktok: string;
  website: string;
  latitude: number;
  longitude: number;
  logoPreview: string | null;
  logoFile: File | null;
  savedLogoUrl: string | null;
}

const DEFAULT_LAT = 40.4093;
const DEFAULT_LNG = 49.8671;

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function Settings() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, refresh, hasModule } = useAuth();
  const posEnabled = hasModule("POS");
  const { canView, canEdit } = useModulePermissions("Settings");
  const branchRevision = useBranchRevision();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  // Section states
  const [companyInfoOpen, setCompanyInfoOpen] = useState(true);
  const [companyImagesOpen, setCompanyImagesOpen] = useState(true);
  const [addressInfoOpen, setAddressInfoOpen] = useState(true);
  const [socialsOpen, setSocialsOpen] = useState(true);
  const [addonsOpen, setAddonsOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);

  // Company Information
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Company Images
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);

  // Social Links
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

  // Address Information
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);

  // Add-ons
  const [employeeCommissionEnabled, setEmployeeCommissionEnabled] = useState(false);
  const [posServiceFeeEnabled, setPosServiceFeeEnabled] = useState(false);
  const [posSendToProductionEnabled, setPosSendToProductionEnabled] = useState(false);
  const [billers, setBillers] = useState<SalesBillerRow[]>([]);
  const [commissionDrafts, setCommissionDrafts] = useState<Record<string, CommissionDraft>>({});

  const snapshotRef = useRef<FormSnapshot | null>(null);
  const addonSnapshotRef = useRef<{
    employeeCommissionEnabled: boolean;
    posServiceFeeEnabled: boolean;
    posSendToProductionEnabled: boolean;
    billers: SalesBillerRow[];
  } | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const applySnapshot = useCallback((snap: FormSnapshot) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setCompanyName(snap.companyName);
    setCompanyEmail(snap.companyEmail);
    setPhoneNumber(snap.phoneNumber);
    setAddress(snap.address);
    setCity(snap.city);
    setPostalCode(snap.postalCode);
    setInstagram(snap.instagram);
    setFacebook(snap.facebook);
    setTelegram(snap.telegram);
    setWhatsapp(snap.whatsapp);
    setTiktok(snap.tiktok);
    setWebsite(snap.website);
    setLatitude(snap.latitude);
    setLongitude(snap.longitude);
    setLogoPreview(snap.logoPreview);
    setLogoFile(snap.logoFile);
    setSavedLogoUrl(snap.savedLogoUrl);
  }, []);

  const applyFromApi = useCallback((data: TenantSettingsRecord) => {
    const social = data.socialLinks ?? {};
    setCompanyName(data.companyName ?? "");
    setCompanyEmail(data.companyEmail ?? "");
    setPhoneNumber(data.phone ?? "");
    setAddress(data.address ?? "");
    setCity(data.city ?? "");
    setPostalCode(data.postalCode ?? "");
    setWebsite(data.website ?? "");
    setInstagram(social.instagram ?? "");
    setFacebook(social.facebook ?? "");
    setTelegram(social.telegram ?? "");
    setWhatsapp(social.whatsapp ?? "");
    setTiktok(social.tiktok ?? "");
    setLatitude(data.latitude ?? DEFAULT_LAT);
    setLongitude(data.longitude ?? DEFAULT_LNG);
    setEmployeeCommissionEnabled(data.employeeCommissionEnabled === true);
    setPosServiceFeeEnabled(data.posServiceFeeEnabled === true);
    setPosSendToProductionEnabled(data.posSendToProductionEnabled === true);
    setSavedLogoUrl(data.companyLogo);
    setLogoFile(null);
    setLogoPreview(data.companyLogo);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const applyBillerDrafts = useCallback((rows: SalesBillerRow[]) => {
    setBillers(rows);
    const drafts: Record<string, CommissionDraft> = {};
    for (const b of rows) {
      drafts[b.id] = {
        commissionType: b.commissionType ?? "",
        commissionValue: b.commissionValue ?? "",
      };
    }
    setCommissionDrafts(drafts);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!(isAuthenticated || isDemo) || !canView) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [data, billerRows] = await Promise.all([
          fetchTenantSettings(),
          posEnabled ? fetchSalesBillers().catch(() => [] as SalesBillerRow[]) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        applyFromApi(data);
        applyBillerDrafts(billerRows);
        addonSnapshotRef.current = {
          employeeCommissionEnabled: data.employeeCommissionEnabled === true,
          posServiceFeeEnabled: data.posServiceFeeEnabled === true,
          posSendToProductionEnabled: data.posSendToProductionEnabled === true,
          billers: billerRows,
        };
        snapshotRef.current = {
          companyName: data.companyName ?? "",
          companyEmail: data.companyEmail ?? "",
          phoneNumber: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          postalCode: data.postalCode ?? "",
          instagram: data.socialLinks?.instagram ?? "",
          facebook: data.socialLinks?.facebook ?? "",
          telegram: data.socialLinks?.telegram ?? "",
          whatsapp: data.socialLinks?.whatsapp ?? "",
          tiktok: data.socialLinks?.tiktok ?? "",
          website: data.website ?? "",
          latitude: data.latitude ?? DEFAULT_LAT,
          longitude: data.longitude ?? DEFAULT_LNG,
          logoPreview: data.companyLogo,
          logoFile: null,
          savedLogoUrl: data.companyLogo,
        };
      } catch (err) {
        if (!cancelled) {
          notifyFromError(
            err,
            pickLang(language, "Parametrləri yükləmək alınmadı.", "Failed to load settings."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [isDemo, isAuthenticated, canView, applyFromApi, applyBillerDrafts, language, branchRevision, posEnabled]);

  const requireSignedIn = () => {
    if (isDemo || !isAuthenticated) {
      notifyInfo(
        pt(
          "Sign in with your live account to edit company settings.",
          "Şirkət parametrlərini redaktə etmək üçün canlı hesabınızla daxil olun.",
        ),
      );
      return false;
    }
    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setLogoPreview(url);
    setLogoFile(file);
    e.target.value = "";
  };

  const handleRemoveImage = async () => {
    if (logoFile) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setLogoFile(null);
      setLogoPreview(savedLogoUrl);
      return;
    }

    if (!savedLogoUrl) {
      setLogoPreview(null);
      return;
    }

    if (!requireSignedIn()) return;
    if (!canEdit) return;

    setLogoRemoving(true);
    try {
      await deleteTenantSettingsAsset("companyLogo");
      setSavedLogoUrl(null);
      setLogoPreview(null);
      if (snapshotRef.current) {
        snapshotRef.current = {
          ...snapshotRef.current,
          logoPreview: null,
          logoFile: null,
          savedLogoUrl: null,
        };
      }
      await refresh();
      notifySuccess(pt("Company logo removed.", "Şirkət loqosu silindi."));
    } catch (err) {
      notifyFromError(err, pt("Failed to remove logo.", "Loqonu silmək alınmadı."));
    } finally {
      setLogoRemoving(false);
    }
  };

  const handleSave = async () => {
    if (!requireSignedIn()) return;
    if (!canEdit) return;

    if (!companyName.trim() || !companyEmail.trim() || !phoneNumber.trim()) {
      notifyFromError(null, pt("Company name, email, and phone are required.", "Şirkət adı, e-poçt və telefon mütləqdir."));
      return;
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      notifyFromError(null, pt("Address, city, and postal code are required.", "Ünvan, şəhər və poçt kodu mütləqdir."));
      return;
    }

    setSaving(true);
    try {
      for (const b of posEnabled ? billers : []) {
        const draft = commissionDrafts[b.id];
        if (!draft) continue;
        const nextType = draft.commissionType === "" ? null : draft.commissionType;
        const rawVal = draft.commissionValue.trim();
        if (nextType != null) {
          const nextValue = rawVal === "" ? NaN : Number(rawVal);
          if (Number.isNaN(nextValue) || nextValue < 0) {
            notifyFromError(
              null,
              pt(
                `Invalid commission for ${b.name}.`,
                `${b.name} üçün komissiya düzgün deyil.`,
              ),
            );
            return;
          }
          if (nextType === "PERCENT" && nextValue > 100) {
            notifyFromError(
              null,
              pt(
                `Percent commission for ${b.name} cannot exceed 100.`,
                `${b.name} üçün faiz komissiyası 100-dən çox ola bilməz.`,
              ),
            );
            return;
          }
        }
      }

      let companyLogo: string | null | undefined;
      if (logoFile) {
        companyLogo = await uploadTenantSettingsAsset("companyLogo", logoFile);
      } else if (savedLogoUrl && !logoPreview) {
        companyLogo = null;
      }

      await updateTenantSettings({
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim(),
        phone: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        website: emptyToNull(website),
        latitude,
        longitude,
        ...(posEnabled
          ? { employeeCommissionEnabled, posServiceFeeEnabled, posSendToProductionEnabled }
          : {}),
        socialLinks: {
          instagram: emptyToNull(instagram),
          facebook: emptyToNull(facebook),
          telegram: emptyToNull(telegram),
          whatsapp: emptyToNull(whatsapp),
          tiktok: emptyToNull(tiktok),
        },
        ...(companyLogo !== undefined ? { companyLogo } : {}),
      });

      for (const b of billers) {
        const draft = commissionDrafts[b.id];
        if (!draft) continue;
        const nextType = draft.commissionType === "" ? null : draft.commissionType;
        const rawVal = draft.commissionValue.trim();
        const nextValue =
          nextType == null || rawVal === "" ? null : Number(rawVal);
        const prevType = b.commissionType ?? null;
        const prevValue = b.commissionValue != null ? Number(b.commissionValue) : null;
        if (prevType === nextType && prevValue === nextValue) continue;
        await updateSalesBiller(b.id, {
          commissionType: nextType,
          commissionValue: nextValue,
        });
      }

      const refreshedBillers = posEnabled
        ? await fetchSalesBillers().catch(() => billers)
        : [];
      applyBillerDrafts(refreshedBillers);
      addonSnapshotRef.current = {
        employeeCommissionEnabled,
        posServiceFeeEnabled,
        posSendToProductionEnabled,
        billers: refreshedBillers,
      };

      if (companyLogo !== undefined) {
        setSavedLogoUrl(companyLogo);
        setLogoPreview(companyLogo);
        setLogoFile(null);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      }

      snapshotRef.current = {
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        instagram,
        facebook,
        telegram,
        whatsapp,
        tiktok,
        website,
        latitude,
        longitude,
        logoPreview: companyLogo !== undefined ? companyLogo : logoPreview,
        logoFile: null,
        savedLogoUrl: companyLogo !== undefined ? companyLogo : savedLogoUrl,
      };
      await refresh();
      notifySuccess(pt("Settings saved successfully!", "Parametrlər uğurla saxlanıldı!"));
    } catch (err) {
      notifyFromError(err, pt("Failed to save settings.", "Parametrləri saxlamaq alınmadı."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (snapshotRef.current) {
      applySnapshot(snapshotRef.current);
      if (addonSnapshotRef.current) {
        setEmployeeCommissionEnabled(addonSnapshotRef.current.employeeCommissionEnabled);
        setPosServiceFeeEnabled(addonSnapshotRef.current.posServiceFeeEnabled);
        setPosSendToProductionEnabled(addonSnapshotRef.current.posSendToProductionEnabled);
        applyBillerDrafts(addonSnapshotRef.current.billers);
      }
      notifyInfo(pt("Changes discarded.", "Dəyişikliklər ləğv edildi."));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-6 h-6 animate-spin text-[#14b8a6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {pt("Settings", "Parametrlər")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pt("Manage your company and system settings", "Şirkət və sistem parametrlərini idarə edin")}
          </p>
        </div>

        <div className="space-y-3">
          {/* Company Settings Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-visible">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pt("Company Settings", "Şirkət Parametrləri")}
              </h2>
            </div>

            {/* Company Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setCompanyInfoOpen(!companyInfoOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#ccfbf1] dark:bg-[#14b8a6]/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#14b8a6] dark:text-[#14b8a6]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pt("Company Information", "Şirkət Məlumatı")}
                  </span>
                </div>
                {companyInfoOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {companyInfoOpen && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {pt("Company Name", "Şirkət Adı")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>

                    {/* Company Email Address */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {pt("Company Email Address", "Şirkət E-poçt Ünvanı")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {pt("Phone Number", "Telefon Nömrəsi")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Company Images Section */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setCompanyImagesOpen(!companyImagesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#ccfbf1] dark:bg-[#14b8a6]/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#14b8a6] dark:text-[#14b8a6]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pt("Company Images", "Şirkət Şəkilləri")}
                  </span>
                </div>
                {companyImagesOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {companyImagesOpen && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="space-y-4 mt-4">
                    {/* Company Logo */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {pt("Company Logo", "Şirkət Loqosu")}
                        </label>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {pt("Upload Logo of your Company", "Şirkətinizin loqosunu yükləyin")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {logoPreview ? (
                          <div className="relative">
                            <img src={logoPreview} alt="Company Logo" className="w-12 h-12 rounded-lg object-cover border border-gray-300 dark:border-gray-700" />
                            {canEdit && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              disabled={logoRemoving || saving}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {logoRemoving ? (
                                <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                              ) : (
                                <X className="w-2.5 h-2.5 text-white" />
                              )}
                            </button>
                            )}
                          </div>
                        ) : canEdit ? (
                          <label className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-[#14b8a6]/20">
                            <Upload className="w-3 h-3" />
                            {pt("Upload Image", "Şəkil Yüklə")}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </label>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {pt("Recommended size is 450x+ x 450px. Max size 5mb.", "Tövsiyə olunan ölçü 450x+ x 450px. Maks ölçü 5mb.")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Address Information Section */}
            <div>
              <button
                onClick={() => setAddressInfoOpen(!addressInfoOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#ccfbf1] dark:bg-[#14b8a6]/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#14b8a6] dark:text-[#14b8a6]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pt("Address Information", "Ünvan Məlumatı")}
                  </span>
                </div>
                {addressInfoOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {addressInfoOpen && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {/* Address */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {pt("Address", "Ünvan")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* City */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {pt("City", "Şəhər")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={pt("Enter city", "Şəhəri daxil edin")}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                        />
                      </div>

                      {/* Postal Code */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {pt("Postal Code", "Poçt Kodu")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder={pt("Enter postal code", "Poçt kodunu daxil edin")}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                        />
                      </div>
                    </div>

                    {/* Map location picker */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {pt("Location on Map", "Xəritədə Yer")} <span className="text-red-500">*</span>
                      </label>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                        {pt("Search and pin your location on the map", "Xəritədə yerləşdiyiniz yeri axtarın və işarələyin")}
                      </p>
                      <LocationMapPicker
                        latitude={latitude}
                        longitude={longitude}
                        onChange={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                        onAddressResolved={(label) => {
                          if (!address.trim()) {
                            setAddress(label.split(",").slice(0, 2).join(",").trim());
                          }
                        }}
                        searchPlaceholder={pt("Search address or place...", "Ünvan və ya yer axtarın...")}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setSocialsOpen(!socialsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <svg className="w-3 h-3 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {pt("Social Media & Links", "Sosial Media & Linklər")}
                </span>
              </div>
              {socialsOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {socialsOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 mb-4">
                  {pt("These links appear on your customer site.", "Bu linklər müştəri saytınızda göstərilir.")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Instagram", placeholder: "https://instagram.com/yourpage", value: instagram, setter: setInstagram,
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      ),
                      color: "text-pink-500",
                    },
                    {
                      label: "Facebook", placeholder: "https://facebook.com/yourpage", value: facebook, setter: setFacebook,
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ),
                      color: "text-blue-600",
                    },
                    {
                      label: "Telegram", placeholder: "https://t.me/yourchannel", value: telegram, setter: setTelegram,
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 14.07l-2.967-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.943.515z"/>
                        </svg>
                      ),
                      color: "text-sky-500",
                    },
                    {
                      label: "WhatsApp", placeholder: "https://wa.me/994XXXXXXXXX", value: whatsapp, setter: setWhatsapp,
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      ),
                      color: "text-green-500",
                    },
                    {
                      label: "TikTok", placeholder: "https://tiktok.com/@yourpage", value: tiktok, setter: setTiktok,
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      ),
                      color: "text-gray-900 dark:text-white",
                    },
                    {
                      label: pt("Website", "Vebsayt"), placeholder: "https://yourwebsite.az", value: website, setter: setWebsite,
                      icon: (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                      ),
                      color: "text-[#14b8a6]",
                    },
                  ].map(({ label, placeholder, value, setter, icon, color }) => (
                    <div key={label}>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className={color}>{icon}</span>
                        {label}
                      </label>
                      <input
                        type="url"
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add-ons */}
          {posEnabled && <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setAddonsOpen(!addonsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pt("Add-ons", "Əlavələr")}
              </h2>
              {addonsOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {addonsOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800 space-y-5 mt-0 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {pt("Employee commission", "İşçi komissiyası")}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {pt(
                        "When on, each POS sale stores a commission snapshot for the selected employee. Customer total is unchanged.",
                        "Aktiv olduqda hər POS satışı seçilmiş işçi üçün komissiya snapshot-ı yazır. Müştəri məbləği dəyişmir.",
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setEmployeeCommissionEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                      employeeCommissionEnabled ? "bg-[#14b8a6]" : "bg-gray-300 dark:bg-gray-700"
                    } disabled:opacity-50`}
                    aria-pressed={employeeCommissionEnabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition mt-0.5 ${
                        employeeCommissionEnabled ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {employeeCommissionEnabled && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                            {pt("Employee", "İşçi")}
                          </th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                            {pt("Type", "Tip")}
                          </th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">
                            {pt("Value", "Dəyər")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {billers.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-xs text-gray-500 text-center">
                              {pt("No employees found", "İşçi tapılmadı")}
                            </td>
                          </tr>
                        ) : (
                          billers.map((b) => {
                            const draft = commissionDrafts[b.id] ?? {
                              commissionType: "",
                              commissionValue: "",
                            };
                            return (
                              <tr
                                key={b.id}
                                className="border-t border-gray-100 dark:border-gray-800"
                              >
                                <td className="px-3 py-2">
                                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                                    {b.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{b.code}</p>
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    disabled={!canEdit}
                                    value={draft.commissionType}
                                    onChange={(e) => {
                                      const v = e.target.value as CommissionDraft["commissionType"];
                                      setCommissionDrafts((prev) => ({
                                        ...prev,
                                        [b.id]: { ...draft, commissionType: v },
                                      }));
                                    }}
                                    className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white disabled:opacity-50"
                                  >
                                    <option value="">{pt("None", "Yox")}</option>
                                    <option value="FIXED">{pt("Fixed (AZN)", "Sabit (AZN)")}</option>
                                    <option value="PERCENT">{pt("Percent (%)", "Faiz (%)")}</option>
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={!canEdit || !draft.commissionType}
                                    value={draft.commissionValue}
                                    onChange={(e) =>
                                      setCommissionDrafts((prev) => ({
                                        ...prev,
                                        [b.id]: { ...draft, commissionValue: e.target.value },
                                      }))
                                    }
                                    placeholder={draft.commissionType === "PERCENT" ? "%" : "₼"}
                                    className="w-28 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white disabled:opacity-50"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {pt("POS service fee", "POS xidmət haqqı")}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {pt(
                        "When on, cashiers can enter a service fee on each POS sale; it is added to the customer total.",
                        "Aktiv olduqda kassir hər POS satışında xidmət haqqı daxil edə bilər; məbləğ müştəri cəminə əlavə olunur.",
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setPosServiceFeeEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                      posServiceFeeEnabled ? "bg-[#14b8a6]" : "bg-gray-300 dark:bg-gray-700"
                    } disabled:opacity-50`}
                    aria-pressed={posServiceFeeEnabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition mt-0.5 ${
                        posServiceFeeEnabled ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {pt("Send to Production", "İstehsala göndər")}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {pt(
                        "When on, POS shows a Send to Production checkout button and production status on POS orders.",
                        "Aktiv olduqda POS-da İstehsala göndər düyməsi və POS sifarişlərində istehsal statusu görünür.",
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setPosSendToProductionEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                      posSendToProductionEnabled ? "bg-[#14b8a6]" : "bg-gray-300 dark:bg-gray-700"
                    } disabled:opacity-50`}
                    aria-pressed={posSendToProductionEnabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition mt-0.5 ${
                        posSendToProductionEnabled ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>}

          {/* Action Buttons */}
          {canEdit && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-1.5 bg-gray-900 dark:bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {pt("Cancel", "Ləğv et")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-[#14b8a6]/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {pt("Save Changes", "Dəyişiklikləri Yadda Saxla")}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}