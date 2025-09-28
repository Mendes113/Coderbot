import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldX } from "lucide-react";
import { ReactNode } from "react";

interface AnalyticsConsentBannerProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
  extraContent?: ReactNode;
}

/**
 * Fixed bottom banner prompting the user for analytics consent.
 * Designed to comply with LGPD/GDPR cookie consent requirements.
 */
export function AnalyticsConsentBanner({
  open,
  onAccept,
  onDecline,
  className,
  extraContent,
}: AnalyticsConsentBannerProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Solicitação de consentimento para cookies analíticos"
      className={cn(
        "fixed inset-x-4 bottom-4 z-[60] md:left-auto md:right-6 md:w-full md:max-w-md",
        "rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur",
        "dark:border-white/10 dark:bg-slate-900/95",
        "animate-in fade-in slide-in-from-bottom-4",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <img
            src="/coderbot_colorfull.png"
            alt="Logo CoderBot"
            className="h-11 w-11 flex-none rounded-xl border border-white/40 bg-white object-contain p-1 shadow-sm dark:border-white/10 dark:bg-white/10"
          />
          <div className="flex flex-1 flex-col gap-2 text-slate-700 dark:text-slate-200">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Podemos coletar dados de uso?
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Esses dados são anônimos e ajudam a equipe a evoluir o CoderBot com base no uso real.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Leia nossa{" "}
              <a href="/privacy" className="underline underline-offset-4">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button onClick={onAccept} className="w-full whitespace-nowrap sm:w-auto">
            Permitir analytics
          </Button>
          <Button
            onClick={onDecline}
            variant="outline"
            className="w-full whitespace-nowrap border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
          >
            <ShieldX className="mr-2 h-4 w-4" aria-hidden="true" />
            Recusar
          </Button>
        </div>
        {extraContent}
      </div>
    </div>
  );
}
