// Deprecated: Use SimpleDropdown instead
// This file is kept for backward compatibility but all components are stubbed out

import * as React from "react";

// Stub exports - these are no longer used but kept to prevent import errors
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children, align, className }: { children: React.ReactNode; align?: string; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuItem({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <div onClick={onClick} className={className}>{children}</div>;
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={className} />;
}

export function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuRadioGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuSubTrigger({ children }: { children: React.ReactNode; inset?: boolean }) {
  return <>{children}</>;
}

export function DropdownMenuSubContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuCheckboxItem({ children }: { children: React.ReactNode; checked?: boolean }) {
  return <>{children}</>;
}

export function DropdownMenuRadioItem({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuShortcut({ children }: { children: React.ReactNode; className?: string }) {
  return <>{children}</>;
}
