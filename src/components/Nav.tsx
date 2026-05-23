"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveDot } from "./LiveDot";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",         label: "Dashboard" },
  { href: "/rooms",    label: "Rooms" },
  { href: "/events",   label: "Events" },
  { href: "/scan",     label: "Scan" },
  { href: "/finance",  label: "Finance" },
  { href: "/log",      label: "Log" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur">
      <div className="max-w-[1500px] mx-auto flex items-center gap-6 px-4 sm:px-6 h-14">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] text-white font-black shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
            Q
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">QTrack</span>
            <span className="text-[10px] text-[var(--color-muted)] tracking-wide uppercase">
              QSTP Asset Intelligence
            </span>
          </div>
          <LiveDot className="ml-2" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-accent)] text-white shadow-[0_4px_10px_rgba(124,58,237,0.25)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-panel-2)]",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />
        <ThemeToggle />
      </div>

      <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2">
        {tabs.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition",
                active
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-panel-2)]",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
