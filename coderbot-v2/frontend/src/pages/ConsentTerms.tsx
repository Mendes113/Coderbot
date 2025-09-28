import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, Eye, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConsentTerms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-950 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link to="/auth" aria-label="Voltar para login">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Termo de Consentimento para Uso de Cookies e Dados Analíticos
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
            
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  1. Introdução
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                O CoderBot ("nós", "nosso" ou "plataforma") respeita sua privacidade e está comprometido 
                em ser transparente sobre como coletamos e utilizamos dados analíticos para melhorar 
                nossa plataforma educacional.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  2. Dados Coletados
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Com seu consentimento, coletamos os seguintes dados analíticos anonimizados:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Dados de navegação:</strong> Páginas visitadas, tempo de permanência, cliques e interações</li>
                <li><strong>Dados técnicos:</strong> Tipo de navegador, sistema operacional, resolução de tela</li>
                <li><strong>Métricas de performance:</strong> Tempos de carregamento, Core Web Vitals</li>
                <li><strong>Dados de aprendizagem:</strong> Progresso em exercícios, tempo gasto em atividades (anonimizados)</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  3. Finalidade e Uso dos Dados
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Os dados coletados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Melhorar a experiência do usuário na plataforma</li>
                <li>Identificar e corrigir problemas técnicos</li>
                <li>Desenvolver novos recursos baseados no comportamento de uso</li>
                <li>Otimizar o desempenho e velocidade da plataforma</li>
                <li>Criar relatórios estatísticos agregados e anônimos</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  4. Seus Direitos e Controles
                </h2>
              </div>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p><strong>Consentimento Voluntário:</strong> O consentimento para coleta de dados analíticos é completamente opcional e não afeta sua capacidade de usar o CoderBot.</p>
                <p><strong>Revogação a Qualquer Momento:</strong> Você pode revogar seu consentimento a qualquer momento através das configurações do seu navegador ou entrando em contato conosco.</p>
                <p><strong>Dados Anonimizados:</strong> Todos os dados são processados de forma anônima, sem identificação pessoal.</p>
                <p><strong>Não Compartilhamento:</strong> Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                5. Ferramentas Utilizadas
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Utilizamos o <strong>PostHog</strong> como nossa ferramenta de analytics, que:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Respeita regulamentações de privacidade como LGPD e GDPR</li>
                <li>Permite controle total sobre quais dados são coletados</li>
                <li>Oferece opções de hospedagem própria para maior controle de dados</li>
                <li>Não utiliza cookies de rastreamento de terceiros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                6. Contato
              </h2>
              <p className="text-slate-700 dark:text-slate-300">
                Se você tiver dúvidas sobre este termo de consentimento ou sobre como seus dados são tratados, 
                entre em contato conosco através do nosso repositório no GitHub ou pelos canais de suporte da plataforma.
              </p>
            </section>

            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">
                ✓ Ao aceitar os cookies analíticos, você confirma que leu e compreendeu este termo de consentimento.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Política de Privacidade
          </Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Termos de Uso
          </Link>
          <Link to="/auth" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
}