import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { pb } from "@/integrations/pocketbase/client";
import { CodeEditorProvider } from "@/context/CodeEditorContext";

const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const UserProfile = React.lazy(() => import("./pages/UserProfile"));
const Auth = React.lazy(() => import("./pages/Auth"));
const ChatInterface = React.lazy(() => import("./pages/ChatInterface"));
const CodeEditor = React.lazy(() => import("./pages/CodeEditor"));
const ExerciseInterface = React.lazy(() => import("./pages/ExerciseInterface"));
const LearningMetrics = React.lazy(() => import("./pages/LearningMetrics"));
const TeacherDashboard = React.lazy(() => import("./pages/TeacherDashboard"));
const StudentDashboard = React.lazy(() => import("./pages/StudentDashboard"));
const Whiteboard = React.lazy(() => import("./pages/Whiteboard"));
const Home = React.lazy(() => import("./home/Home"));
const Mermaid = React.lazy(() => import("./pages/Mermaid"));
const FlashCardPage = React.lazy(() => import("./pages/FlashCardPage"));
const AdaptiveLearning = React.lazy(() => import("./pages/AdaptiveLearning"));
const StudentInvitations = React.lazy(() => import("./components/student/StudentInvitations"));
const Analytics = React.lazy(() => import("./pages/Analytics"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CodeEditorProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center h-screen text-xl">Carregando...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="dashboard" element={<RequireAuth><Index /></RequireAuth>}>
                  <Route path="chat" element={<ChatInterface />} />
                  <Route path="playground" element={<CodeEditor />} />
                  <Route path="adaptive" element={<AdaptiveLearning />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="exercises" element={<ExerciseInterface />} />
                  <Route path="metrics" element={<LearningMetrics />} />
                  <Route path="teacher" element={<TeacherDashboard />} />
                  <Route path="student" element={<StudentDashboard />} />
                  <Route path="invitations" element={<StudentInvitations />} />
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
        </CodeEditorProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

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
