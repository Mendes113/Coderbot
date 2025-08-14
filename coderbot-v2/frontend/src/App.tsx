import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { pb } from "@/integrations/pocketbase/client";
import posthog from "posthog-js";
// import { CodeEditorProvider } from "@/context/CodeEditorContext";

const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const UserProfile = React.lazy(() => import("./pages/UserProfile"));
const Auth = React.lazy(() => import("./pages/Auth"));
const ChatInterface = React.lazy(() => import("./pages/ChatInterface"));
const ExerciseInterface = React.lazy(() => import("./pages/ExerciseInterface"));
const LearningMetrics = React.lazy(() => import("./pages/LearningMetrics"));
const TeacherDashboard = React.lazy(() => import("./pages/TeacherDashboard"));
import StudentDashboard from "./pages/StudentDashboard";
const Whiteboard = React.lazy(() => import("./pages/Whiteboard"));
const Home = React.lazy(() => import("./home/Home"));
const Mermaid = React.lazy(() => import("./pages/Mermaid"));
const FlashCardPage = React.lazy(() => import("./pages/FlashCardPage"));
const AdaptiveLearning = React.lazy(() => import("./pages/AdaptiveLearning"));
// Removed StudentInvitations route and import
const Analytics = React.lazy(() => import("./pages/Analytics"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');

    const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY;
    const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

    // Debug environment presence
    console.info('[Analytics] PostHog env', { hasKey: Boolean(posthogKey), host: posthogHost });

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false,
        autocapture: true,
        disable_session_recording: true,
        debug: true,
        request_batching: false,
      });

      // Expose globally for manual debug and log every capture
      (window as any).posthog = posthog;
      const __originalCapture = (posthog.capture as any)?.bind?.(posthog);
      if (__originalCapture) {
        (posthog as any).capture = (event: string, props?: Record<string, any>) => {
          console.debug('[Analytics][capture]', event, props);
          return __originalCapture(event, props);
        };
      }

      // Emit a boot event for verification
      posthog.capture('edu_debug_boot', { path: window.location.pathname });

      const userModel = pb.authStore.model as any;
      const userId = userModel?.id;
      if (userId) {
        posthog.identify(userId, {
          role: userModel?.role ?? undefined,
        });
      }

      // --- Web Vitals (via CDN) ---
      const loadWebVitalsScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if ((window as any).webVitals) return resolve();
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('web-vitals load error'));
          document.head.appendChild(s);
        });
      };

      (async () => {
        try {
          await loadWebVitalsScript();
          const wv = (window as any).webVitals;
          if (!wv) {
            console.warn('[Analytics][web-vitals] Not available after load');
            return;
          }
          console.info('[Analytics][web-vitals] Ready');
          const nav = performance.getEntriesByType('navigation')[0] as any;
          const send = (metric: any) => {
            try {
              console.debug('[Analytics][web-vitals][report]', metric?.name, metric?.value, metric);
              posthog.capture('$web_vitals', {
                metric_name: metric?.name,
                value: metric?.value,
                delta: metric?.delta,
                id: metric?.id,
                rating: metric?.rating,
                path: window.location.pathname,
                navigation_type: nav?.type,
              });
            } catch (e) {
              console.warn('[Analytics][web-vitals] capture failed', e);
            }
          };
          wv.onCLS?.(send, { reportAllChanges: true });
          wv.onFID?.(send);
          wv.onLCP?.(send);
          wv.onTTFB?.(send);
          wv.onINP?.(send, { reportAllChanges: true });
          wv.onFCP?.(send);
        } catch (e) {
          console.warn('[Analytics] Web Vitals load failed', e);
        }
      })();
      // --- end Web Vitals ---
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* <CodeEditorProvider> */}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsTracker />
            <Suspense fallback={<div className="flex items-center justify-center h-screen text-xl">Carregando...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="dashboard" element={<RequireAuth><Index /></RequireAuth>}>
                  <Route path="chat" element={<ChatInterface />} />
                  <Route path="adaptive" element={<AdaptiveLearning />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="exercises" element={<ExerciseInterface />} />
                  <Route path="metrics" element={<LearningMetrics />} />
                  <Route path="teacher" element={<TeacherDashboard />} />
                  <Route path="student" element={<StudentDashboard />} />
                  <Route path="whiteboard" element={<Whiteboard />} />
                  <Route path="mermaid" element={<Mermaid />} />
                  <Route path="flashcard" element={<FlashCardPage />} />
                </Route>
                <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        {/* </CodeEditorProvider> */}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (posthog && typeof posthog.capture === 'function') {
      console.debug('[Analytics][$pageview]', { path: location.pathname });
      posthog.capture('$pageview', { path: location.pathname });
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleVisibility = () => {
      const eventName = document.visibilityState === 'visible' ? 'edu_app_focus' : 'edu_app_blur';
      if (posthog && typeof posthog.capture === 'function') {
        console.debug('[Analytics][visibility]', { eventName });
        posthog.capture(eventName);
        if (document.visibilityState !== 'visible') {
          // Send $pageleave to improve bounce/session duration analytics
          posthog.capture('$pageleave', { path: location.pathname });
          console.debug('[Analytics][$pageleave]', { path: location.pathname });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [location.pathname]);

  return null;
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Se não há sessão válida, redireciona
    if (!pb.authStore.isValid) {
      navigate('/auth');
    }
    setLoading(false);

    // Fica escutando logout externo (ex: expiração de token)
    const unsubscribe = pb.authStore.onChange(() => {
      if (!pb.authStore.isValid) {
        navigate('/auth');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) return null; // ou um spinner

  return children;
};
