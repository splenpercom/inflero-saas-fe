import { getAppLogo, getBrandLogoUrl } from "../../lib/branding";
import { useIsDarkMode } from "../../hooks/useIsDarkMode";
import { BrandLogo, type BrandLogoSize } from "./BrandLogo";

type TenantLogoFields = Parameters<typeof getCompanyLogoUrl>[0];

type AppBrandLogoProps = {
  alt?: string;
  size?: BrandLogoSize;
  className?: string;
  imgClassName?: string;
  tenant?: TenantLogoFields | null;
  /** Use on always-dark surfaces (landing, login) so the light-on-dark wordmark shows. */
  onDarkBackground?: boolean;
};

export function AppBrandLogo({
  alt = "Inflero",
  size = "header",
  className,
  imgClassName,
  tenant,
  onDarkBackground = false,
}: AppBrandLogoProps) {
  const isDark = useIsDarkMode();
  const useDarkLogo = onDarkBackground || isDark;
  const src = tenant ? getBrandLogoUrl(tenant, useDarkLogo) : getAppLogo(useDarkLogo);

  return (
    <BrandLogo
      src={src}
      alt={alt}
      size={size}
      className={className}
      imgClassName={imgClassName}
    />
  );
}
