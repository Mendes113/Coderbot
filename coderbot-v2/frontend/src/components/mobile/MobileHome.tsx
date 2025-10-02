import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ArrowRight,
  PlayCircle,
  Bot,
  Code2,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Users,
  MessageCircle,
  PenTool,
  BookOpen,
  CheckCircle,
  Smartphone,
  Zap,
  Heart
} from 'lucide-react';

export default function MobileHome() {
  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Chat com IA em português",
      desc: "Converse com o tutor para revisar conceitos, gerar exemplos e destravar exercícios quando precisar.",
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Painel do professor",
      desc: "Crie turmas, acompanhe sessões de chat e distribua materiais em um único ambiente de gestão.",
    },
    {
      icon: <PenTool className="h-6 w-6" />,
      title: "Quadro colaborativo",
      desc: "Use quadros visuais e anotações compartilhadas para planejar aulas e registrar aprendizados.",
    },
  ];

  const benefits = [
    "Aprendizado personalizado com IA",
    "Acompanhamento em tempo real",
    "Interface otimizada para mobile",
    "Suporte offline básico"
  ];

  const stats = [
    { number: "1000+", label: "Estudantes" },
    { number: "50+", label: "Professores" },
    { number: "24/7", label: "Disponível" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img
              src="/coderbot_colorfull.png"
              alt="CoderBot"
              className="h-8 w-8"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CoderBot
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-8 pb-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <Badge variant="outline" className="mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 dark:from-indigo-900/20 dark:to-purple-900/20 dark:text-indigo-300 dark:border-indigo-800">
              <Smartphone className="h-3 w-3 mr-1" />
              Versão Mobile
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
              Ensino de programação
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                guiado por IA
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Combine chat com IA, exercícios interativos e acompanhamento personalizado em uma experiência móvel completa.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
            >
              <a href="/auth" className="flex items-center gap-2">
                Começar agora <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Ver demo
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stat.number}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pb-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
            Recursos principais
          </h2>
          <div className="space-y-4">
            {features.map((feature, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 pb-12 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
            Por que escolher o CoderBot?
          </h2>
          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
            Acesso rápido
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <CardHeader className="pb-3 text-center">
                <MessageCircle className="h-8 w-8 mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
                <CardTitle className="text-lg">Chat IA</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-3">
                  Converse com o tutor de IA
                </CardDescription>
                <Button asChild size="sm" className="w-full">
                  <a href="/dashboard/chat">Acessar</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <CardHeader className="pb-3 text-center">
                <BookOpen className="h-8 w-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                <CardTitle className="text-lg">Exercícios</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-3">
                  Pratique com exercícios interativos
                </CardDescription>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <a href="/dashboard/exercises">Praticar</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">
                Pronto para começar?
              </h3>
              <p className="mb-4 opacity-90">
                Junte-se a milhares de estudantes e professores que já estão aprendendo com o CoderBot.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-indigo-600 hover:bg-slate-100"
              >
                <a href="/auth" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Criar conta grátis
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Safe area for mobile devices */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
