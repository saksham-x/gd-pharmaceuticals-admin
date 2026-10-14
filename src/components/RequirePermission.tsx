import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { homePath } from "../config/navigation";
import { useAdminSession } from "../hooks/useAuth";
import type { Permission } from "../services/auth/auth.types";

// ========================================
// REQUIRE PERMISSION
//
// Shows a page only to accounts whose
// role grants `permission`; everyone else
// gets a short "no access" note instead
// of a page full of failed requests.
//
// The API enforces the same permission —
// this only saves a confusing screen.
// ========================================

type RequirePermissionProps = {
  permission?: Permission;
  children: ReactNode;
};

export default function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const session = useAdminSession();

  // No session yet (saved before roles
  // existed): let the page load while the
  // layout refreshes it.
  if (
    !permission ||
    !session ||
    session.permissions.includes(permission)
  ) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-3xl bg-surface px-6 py-14 text-center shadow-sm">
      <p className="font-medium text-ink">
        You do not have access to this page
      </p>

      <p className="mt-2 text-sm text-muted">
        Your role ({session.roleName ??
          session.role}) does not include it.
        Ask a super admin if you need it.
      </p>
    </div>
  );
}

// ========================================
// HOME REDIRECT
//
// "/" and unknown URLs: the first page in
// the sidebar this account can open.
// ========================================

export function HomeRedirect() {
  const session = useAdminSession();

  return (
    <Navigate
      to={homePath(
        session?.permissions ?? []
      )}
      replace
    />
  );
}
