import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { visibleQuickLinks } from "../config/navigation";

import type { AdminSummary } from "../services/auth/auth.types";

import { toggleTheme, useTheme } from "../utils/theme";

// ========================================
// TOPBAR
//
// Sits above every admin page: a few
// shortcut links on the left, the theme
// toggle and the profile menu on the
// right. The sidebar keeps the full list.
// ========================================

type TopbarProps = {
  session: AdminSummary | null;

  onLogout: () => void;

  // Opens the sidebar drawer on phones.
  onOpenMenu?: () => void;
};

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-blush hover:text-[#1266B1]";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

// ========================================
// THEME TOGGLE
// ========================================

function ThemeToggle() {
  const theme = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      title={
        isDark ? "Light theme" : "Dark theme"
      }
      className={iconButton}
    >
      {isDark ? (
        // Sun: shown in dark mode, switches
        // to light.
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon: shown in light mode.
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ========================================
// PROFILE MENU
//
// Closes on an outside click, on Escape
// and after choosing an item.
// ========================================

function ProfileMenu({
  session,
  onLogout,
}: TopbarProps) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const wrapperRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (
      event: PointerEvent
    ) => {
      if (
        !wrapperRef.current?.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    const handleKey = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointer
    );

    document.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointer
      );

      document.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const allowed = (permission: string) =>
    session?.permissions.includes(
      permission
    ) ?? false;

  const itemClass =
    "block w-full px-4 py-2.5 text-left text-sm text-ink transition hover:bg-soft hover:text-[#1266B1]";

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-1 transition hover:bg-blush md:pr-3"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1266B1] text-sm font-medium text-white">
          {initialsOf(session?.name ?? "")}
        </span>

        <span className="hidden text-left md:block">
          <span className="block max-w-[140px] truncate text-sm font-medium text-ink">
            {session?.name ?? "Account"}
          </span>

          {session && (
            <span className="block text-[11px] uppercase tracking-[1px] text-[#1266B1]">
              {session.roleName ?? session.role}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#1266B1]/10 bg-surface py-2 shadow-xl"
        >
          {session && (
            <div className="border-b border-[#1266B1]/10 px-4 pb-3 pt-1">
              <p className="truncate text-sm font-medium text-ink">
                {session.name}
              </p>

              <p className="truncate text-xs text-muted">
                {session.email}
              </p>

              <span className="mt-2 inline-block rounded-full bg-blush px-3 py-0.5 text-[11px] uppercase tracking-[1px] text-[#1266B1]">
                {session.roleName ?? session.role}
              </span>

            </div>
          )}

          <div className="py-1">
            {allowed("adminUsers.view") && (
              <button
                type="button"
                role="menuitem"
                onClick={() => go("/users")}
                className={itemClass}
              >
                Admin Users
              </button>
            )}

            {allowed("roles.view") && (
              <button
                type="button"
                role="menuitem"
                onClick={() => go("/roles")}
                className={itemClass}
              >
                Roles & Permissions
              </button>
            )}

            {allowed("activityLogs.view") && (
              <button
                type="button"
                role="menuitem"
                onClick={() => go("/activity-logs")}
                className={itemClass}
              >
                Activity Logs
              </button>
            )}

            {allowed("content.view") && (
              <button
                type="button"
                role="menuitem"
                onClick={() => go("/content")}
                className={itemClass}
              >
                Website Content
              </button>
            )}
          </div>

          <div className="border-t border-[#1266B1]/10 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-[#DC2626] transition hover:bg-soft"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// TOPBAR
// ========================================

export default function Topbar({
  session,
  onLogout,
  onOpenMenu,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[#1266B1]/10 bg-surface/90 px-4 backdrop-blur md:px-7">
      {/* LEFT: title on phones, shortcuts on wider screens */}

      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className={iconButton}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <h1 className="font-display text-lg font-bold text-ink">
          G.D. Admin
        </h1>
      </div>

      <nav
        aria-label="Shortcuts"
        className="hidden items-center gap-1 md:flex"
      >
        {visibleQuickLinks(
          session?.permissions ?? []
        ).map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm transition ${
                isActive
                  ? "bg-blush text-[#1266B1]"
                  : "text-muted hover:bg-soft hover:text-[#1266B1]"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* RIGHT */}

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <ProfileMenu
          session={session}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
