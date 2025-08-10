import { useCallback } from "react";
import posthog from "posthog-js";
import { pb } from "@/integrations/pocketbase/client";

export type AnalyticsProps = Record<string, any>;

export function identifyCurrentUser(extra?: AnalyticsProps) {
  try {
    const user: any = pb?.authStore?.model;
    const userId: string | undefined = user?.id;
    if (userId) {
      posthog.identify(userId, {
        role: user?.role ?? undefined,
        ...extra,
      });
    }
  } catch {
    // no-op
  }
}

export function useAnalytics() {
  const track = useCallback((eventName: string, props?: AnalyticsProps) => {
    try {
      posthog?.capture?.(eventName, props);
    } catch {
      // no-op
    }
  }, []);

  const startTimer = useCallback((eventName: string, baseProps?: AnalyticsProps) => {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return (extraProps?: AnalyticsProps) => {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const durationMs = Math.round(end - start);
      track(eventName, { ...(baseProps || {}), ...(extraProps || {}), durationMs });
    };
  }, [track]);

  const identify = useCallback((id?: string, props?: AnalyticsProps) => {
    try {
      if (id) {
        posthog.identify(id, props);
      } else {
        identifyCurrentUser(props);
      }
    } catch {
      // no-op
    }
  }, []);

  const isFeatureEnabled = useCallback((flagKey: string) => {
    try {
      // Returns boolean or null
      return Boolean((posthog as any)?.isFeatureEnabled?.(flagKey));
    } catch {
      return false;
    }
  }, []);

  const getFeatureFlag = useCallback((flagKey: string) => {
    try {
      return (posthog as any)?.getFeatureFlag?.(flagKey) ?? null;
    } catch {
      return null;
    }
  }, []);

  return { track, startTimer, identify, isFeatureEnabled, getFeatureFlag };
}