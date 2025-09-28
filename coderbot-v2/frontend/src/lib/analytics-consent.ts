export type ConsentStatus = "unknown" | "granted" | "denied";

const CONSENT_STORAGE_KEY = "coderbot:analyticsConsent";

export const getAnalyticsConsent = (): ConsentStatus => {
  if (typeof window === "undefined" || !window?.localStorage) return "unknown";
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (stored === "granted" || stored === "denied") {
    return stored;
  }
  return "unknown";
};

export const setAnalyticsConsent = (status: ConsentStatus) => {
  if (typeof window === "undefined" || !window?.localStorage) return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, status);
};

export const clearAnalyticsConsent = () => {
  if (typeof window === "undefined" || !window?.localStorage) return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
};

export const isAnalyticsConsentGranted = (): boolean => getAnalyticsConsent() === "granted";

export const consentStorageKey = CONSENT_STORAGE_KEY;
