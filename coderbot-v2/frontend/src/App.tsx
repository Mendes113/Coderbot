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

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false,
        autocapture: true,
        disable_session_recording: true,
      });

      const userModel = pb.authStore.model as any;
      const userId = userModel?.id;
      if (userId) {
        posthog.identify(userId, {
          role: userModel?.role ?? undefined,
        });
      }
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
      posthog.capture('$pageview', { path: location.pathname });
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleVisibility = () => {
      const eventName = document.visibilityState === 'visible' ? 'edu_app_focus' : 'edu_app_blur';
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture(eventName);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

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
