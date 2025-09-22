// src/pages/Auth.tsx
import { useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { startGithubOAuth } from "@/integrations/pocketbase/client";
import AuthForm from "@/components/auth/AuthForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);

  // encapsula supabase + navigate + toast
  useAuthRedirect();

  return (
    <main
      role="main"
      aria-busy={isLoading}
      className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-white"
    >
      <div className="pointer-events-none absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle className="pointer-events-auto" />
      </div>
      {/* Global loading overlay */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-30 grid place-items-center bg-black/40 backdrop-blur-sm"
        >
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Centered content */}
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo + heading */}
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/coderbot_colorfull.png"
              alt="CoderBot"
              className="h-12 w-auto drop-shadow-sm"
            />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Bem-vindo(a)</h1>
            <p className="mt-1 text-sm text-muted-foreground dark:text-white/70">
              Entre para continuar sua jornada de aprendizado
            </p>
          </div>

          {/* Auth card */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm">
            {/* Optional: OAuth provider */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={startGithubOAuth}
              >
                <Github className="h-4 w-4" /> Entrar com GitHub
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Keep the existing form */}
            <AuthForm isLoading={isLoading} setIsLoading={setIsLoading} />
          </div>

          {/* Footer microcopy */}
          <p className="mt-6 text-center text-xs text-muted-foreground dark:text-white/60">
            Ao continuar, você concorda com nossos
            {" "}
            <a href="/terms" className="underline underline-offset-4">Termos de Uso</a>
            {" "}e{ " "}
            <a href="/privacy" className="underline underline-offset-4">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
