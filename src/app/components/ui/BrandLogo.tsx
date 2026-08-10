import { cn } from "./utils";

const SHELL = {
  header: "h-14 w-[216px] shrink-0 overflow-hidden flex items-center justify-start",
  sidebar: "h-9 w-[136px] shrink-0 overflow-hidden flex items-center justify-center",
  sidebarIcon: "h-9 w-9 shrink-0 overflow-hidden flex items-center justify-center",
  auth: "h-16 w-[252px] shrink-0 overflow-hidden flex items-center justify-start",
  nav: "h-14 w-[224px] shrink-0 overflow-hidden flex items-center justify-center",
  footer: "h-12 w-[196px] shrink-0 overflow-hidden flex items-center justify-center",
  receipt: "h-16 w-[232px] shrink-0 overflow-hidden flex items-center justify-center mx-auto",
} as const;

export type BrandLogoSize = keyof typeof SHELL;

type BrandLogoProps = {
  src: string;
  alt: string;
  size?: BrandLogoSize;
  className?: string;
  imgClassName?: string;
};

export function BrandLogo({
  src,
  alt,
  size = "header",
  className,
  imgClassName,
}: BrandLogoProps) {
  return (
    <div className={cn(SHELL[size], className)}>
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover object-center", imgClassName)}
      />
    </div>
  );
}

export function brandLogoReceiptHtml(src: string, alt: string): string {
  return `<div style="height:64px;width:232px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin:0 auto 4px;">
  <img src="${src}" alt="${alt}" style="height:100%;width:100%;object-fit:cover;object-position:center;" />
</div>`;
}
