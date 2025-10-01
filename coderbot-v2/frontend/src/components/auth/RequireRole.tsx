import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { pb } from "@/integrations/pocketbase/client";

type RoleFallbackMap = {
  default?: ReactNode;
  [role: string]: ReactNode | undefined;
};

type RequireRoleProps = {
  allowedRoles: string[];
  children: ReactNode;
  fallbackByRole?: RoleFallbackMap;
  loadingFallback?: ReactNode;
};

const normalizeRole = (role: string | null | undefined) =>
  role ? role.toLowerCase().trim() : null;

export const RequireRole = ({
  allowedRoles,
  children,
  fallbackByRole,
  loadingFallback = null,
}: RequireRoleProps) => {
  const location = useLocation();
  const normalizedAllowed = useMemo(
    () => allowedRoles.map((role) => role.toLowerCase().trim()),
    [allowedRoles]
  );

  const readCurrentRole = useCallback(() => {
    const model = pb.authStore.model as ({ role?: string | null } | null);
    return normalizeRole(model?.role);
  }, []);

  const [role, setRole] = useState<string | null>(() => readCurrentRole());
  const [isReady, setIsReady] = useState<boolean>(() => pb.authStore.isValid);

  useEffect(() => {
    const handleChange = () => {
      setRole(readCurrentRole());
      setIsReady(true);
    };

    handleChange();
    const unsubscribe = pb.authStore.onChange(handleChange);
    return () => unsubscribe();
  }, [readCurrentRole]);

  if (!isReady) {
    return <>{loadingFallback}</>;
  }

  if (role && normalizedAllowed.includes(role)) {
    return <>{children}</>;
  }

  const resolveFallback = () => {
    if (!fallbackByRole) {
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{ from: location }}
        />
      );
    }

    if (role) {
      for (const [key, node] of Object.entries(fallbackByRole)) {
        if (key === "default") continue;
        if (normalizeRole(key) === role) {
          return node;
        }
      }
    }

    return fallbackByRole.default ?? (
      <Navigate
        to="/dashboard"
        replace
        state={{ from: location }}
      />
    );
  };

  return <>{resolveFallback()}</>;
};

export default RequireRole;
