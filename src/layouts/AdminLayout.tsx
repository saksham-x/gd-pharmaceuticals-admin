import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  ClipboardList,
  FileText,
  History,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Pill,
  Scale,
  Users,
  type LucideIcon,
} from "lucide-react";

import Topbar from "../components/Topbar";
import { appConfig } from "../config/appConfig";
import { visibleNavigation, type NavIcon, type NavLinkItem } from "../config/navigation";
import { useAdminSession } from "../hooks/useAuth";
import { usePendingCount } from "../hooks/usePendingCount";
import { logoutAdmin, refreshAdminSession } from "../services/auth/authService";
import { ENQUIRIES_CHANGED_EVENT, getPendingEnquiryCount } from "../services/enquiry/enquiryService";

// ========================================
// ADMIN LAYOUT
//
// The staff portal shell from the design:
// a navy sidebar (a drawer on phones), the
// top bar, and the page.
// ========================================

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  enquiries: Inbox,
  tasks: ClipboardList,
  products: Pill,
  notices: Megaphone,
  careers: Briefcase,
  content: FileText,
  legal: Scale,
  users: Users,
  roles: KeyRound,
  logs: History,
};

// A count shown beside a link, keyed by
// its path, e.g. new enquiries.
type Badges = Record<string, number>;

function SidebarLink({ link, badge = 0 }: { link: NavLinkItem; badge?: number }) {
  const Icon = (link.icon && ICONS[link.icon]) || BarChart3;

  return (
    <NavLink
      to={link.path}
      className={({ isActive }) =>
        `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
          isActive ? "bg-navy-2 text-white" : "text-[#c7d6e7] hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{link.label}</span>
      {badge > 0 && (
        <span
          aria-label={`${badge} new`}
          className="min-w-5 rounded-full bg-[#2f7fc9] px-[7px] py-px text-center text-[10px] text-white"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </NavLink>
  );
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const session = useAdminSession();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Picks up a role or permissions changed
  // since login, and signs out an account
  // that was deleted.
  useEffect(() => {
    refreshAdminSession().catch((error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logoutAdmin();
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const sections = visibleNavigation(session?.permissions ?? []);

  const newEnquiries = usePendingCount(
    getPendingEnquiryCount,
    ENQUIRIES_CHANGED_EVENT,
    session?.permissions.includes("enquiries.view") ?? false
  );

  const badges: Badges = { "/enquiries": newEnquiries };

  const logout = () => {
    logoutAdmin();
    navigate("/login");
  };

  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-60 flex w-[250px] flex-col bg-navy text-[#c7d6e7] transition-transform duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:w-60 md:translate-x-0 ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-[68px] shrink-0 items-center gap-2.5 border-b border-white/10 px-[18px] font-display text-[15px] font-bold text-white">
        <span className="relative grid h-8 w-8 place-items-center rounded-[10px_10px_10px_4px] border border-[#8ec0f0] text-[13px]">
          G
        </span>
        G.D. Admin
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4" aria-label="Staff portal">
        {sections.map((section) => (
          <div key={section.label}>
            <h6 className="mx-2 mt-[22px] mb-2.5 text-[10px] font-semibold tracking-[.14em] text-[#8aa3be] uppercase">
              {section.label}
            </h6>
            {section.links.map((link) => (
              <SidebarLink key={link.path} link={link} badge={badges[link.path]} />
            ))}
          </div>
        ))}
      </nav>

      <a
        className="mx-2.5 mb-3 flex items-center gap-2 px-3 py-2 text-xs text-[#9fb6cf] transition hover:text-white"
        href={appConfig.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        View website
      </a>

      {session && (
        <div className="flex items-center gap-2.5 border-t border-white/10 px-[18px] py-4">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#d6efe2] text-xs font-bold text-[#1a7f5a]">
            {initialsOf(session.name)}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-[13px] text-white">{session.name}</b>
            <small className="block truncate text-[11px]">{session.roleName ?? session.role}</small>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <main className="min-h-screen bg-soft text-ink md:bg-[linear-gradient(90deg,var(--navy)_240px,var(--soft)_240px)]">
      <div className="flex min-h-screen">
        {sidebar}

        {/* Phone drawer backdrop */}
        <div
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 z-50 bg-[#17324d]/40 transition-opacity md:hidden ${
            drawerOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar session={session} onLogout={logout} onOpenMenu={() => setDrawerOpen(true)} />

          <section className="min-w-0 flex-1 px-4 pt-5 pb-10 md:px-7 md:pt-6 md:pb-12">{children}</section>
        </div>
      </div>
    </main>
  );
}
