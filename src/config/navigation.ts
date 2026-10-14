// ========================================
// NAVIGATION
//
// The sidebar, top to bottom, grouped as
// in the staff portal design. Each link
// is hidden from accounts without its
// permission; the API enforces the same.
// ========================================

import type { Permission } from "../services/auth/auth.types";

export type NavIcon =
  | "dashboard"
  | "enquiries"
  | "tasks"
  | "products"
  | "notices"
  | "careers"
  | "content"
  | "legal"
  | "users"
  | "roles"
  | "logs";

export type NavLinkItem = {
  label: string;
  path: string;
  icon?: NavIcon;
  permission?: Permission;
};

export type NavSection = {
  label: string;
  links: NavLinkItem[];
};

export const navigation: NavSection[] = [
  {
    label: "Workspace",
    links: [
      { label: "Dashboard", path: "/dashboard", icon: "dashboard", permission: "dashboard.view" },
      { label: "Enquiries", path: "/enquiries", icon: "enquiries", permission: "enquiries.view" },
      { label: "Tasks", path: "/tasks", icon: "tasks", permission: "tasks.view" },
    ],
  },
  {
    label: "Website",
    links: [
      { label: "Products", path: "/products", icon: "products", permission: "products.view" },
      { label: "Notices & News", path: "/notices", icon: "notices", permission: "notices.view" },
      { label: "Careers", path: "/careers", icon: "careers", permission: "careers.view" },
      { label: "Website content", path: "/content", icon: "content", permission: "content.view" },
      { label: "Legal pages", path: "/legal-pages", icon: "legal", permission: "legalPages.view" },
    ],
  },
  {
    label: "Administration",
    links: [
      { label: "Users", path: "/users", icon: "users", permission: "adminUsers.view" },
      { label: "Roles & permissions", path: "/roles", icon: "roles", permission: "roles.view" },
      { label: "Activity logs", path: "/activity-logs", icon: "logs", permission: "activityLogs.view" },
    ],
  },
];

const allowedFor = (permissions: Permission[]) => (link: NavLinkItem) =>
  !link.permission || permissions.includes(link.permission);

// The sidebar for one account: links it
// lacks the permission for are dropped,
// and so is a section left empty.
export const visibleNavigation = (permissions: Permission[]): NavSection[] =>
  navigation
    .map((section) => ({ ...section, links: section.links.filter(allowedFor(permissions)) }))
    .filter((section) => section.links.length > 0);

// ========================================
// QUICK LINKS
//
// The shortcuts in the top bar.
// ========================================

export const quickLinks: NavLinkItem[] = [
  { label: "Dashboard", path: "/dashboard", permission: "dashboard.view" },
  { label: "Enquiries", path: "/enquiries", permission: "enquiries.view" },
  { label: "Tasks", path: "/tasks", permission: "tasks.view" },
  { label: "Website content", path: "/content", permission: "content.view" },
];

export const visibleQuickLinks = (permissions: Permission[]): NavLinkItem[] =>
  quickLinks.filter(allowedFor(permissions));

// "/" and unknown URLs: the first page
// this account can open.
export const homePath = (permissions: Permission[]): string =>
  visibleNavigation(permissions)[0]?.links[0]?.path ?? "/dashboard";
