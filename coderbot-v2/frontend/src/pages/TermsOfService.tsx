import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Users, Code, BookOpen, AlertTriangle, Gavel } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
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
              Termos de Uso
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
                <Scale className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  1. Aceitação dos Termos
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Ao acessar e utilizar o CoderBot, você concorda em cumprir e estar sujeito aos seguintes 
                termos e condições de uso. Se você não concordar com qualquer parte destes termos, 
                não deverá utilizar nossa plataforma.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  2. Descrição do Serviço
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                O CoderBot é uma plataforma educacional gratuita e de código aberto que oferece:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Exercícios interativos de programação</li>
                <li>Chatbot educacional com IA para suporte ao aprendizado</li>
                <li>Editor de código integrado</li>
                <li>Quadro branco colaborativo</li>
                <li>Sistema de notas e acompanhamento de progresso</li>
                <li>Ferramentas para professores gerenciarem turmas</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  3. Contas de Usuário
                </h2>
              </div>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                3.1 Registro
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Você deve fornecer informações precisas e atualizadas durante o registro</li>
                <li>Você é responsável por manter a confidencialidade da sua conta</li>
                <li>Você deve notificar imediatamente sobre uso não autorizado da sua conta</li>
                <li>Uma pessoa pode ter apenas uma conta ativa</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                3.2 Tipos de Usuário
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Estudantes:</strong> Acesso a exercícios, chatbot, editor e recursos de aprendizado</li>
                <li><strong>Professores:</strong> Recursos adicionais para criar turmas, acompanhar progresso e gerenciar estudantes</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Code className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  4. Uso Adequado da Plataforma
                </h2>
              </div>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                4.1 Uso Permitido
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Utilizar a plataforma para fins educacionais legítimos</li>
                <li>Compartilhar conhecimento de forma respeitosa com outros usuários</li>
                <li>Reportar bugs e sugerir melhorias através dos canais apropriados</li>
                <li>Contribuir para o projeto de código aberto seguindo as diretrizes</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                4.2 Uso Proibido
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Usar a plataforma para atividades ilegais ou prejudiciais</li>
                <li>Tentar hackear, prejudicar ou sobrecarregar os sistemas</li>
                <li>Compartilhar conteúdo ofensivo, discriminatório ou inadequado</li>
                <li>Copiar ou distribuir conteúdo protegido por direitos autorais</li>
                <li>Criar múltiplas contas ou contas falsas</li>
                <li>Usar bots ou scripts automatizados não autorizados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                5. Conteúdo e Propriedade Intelectual
              </h2>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                5.1 Conteúdo da Plataforma
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                O CoderBot é licenciado sob licenças de código aberto. O código fonte está disponível 
                no GitHub e pode ser usado de acordo com os termos da licença aplicável.
              </p>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                5.2 Conteúdo do Usuário
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Você mantém a propriedade do conteúdo que cria na plataforma</li>
                <li>Ao usar a plataforma, você concede uma licença não exclusiva para armazenar e exibir seu conteúdo</li>
                <li>Você é responsável por garantir que seu conteúdo não viola direitos de terceiros</li>
                <li>Reservamo-nos o direito de remover conteúdo inadequado ou que viole estes termos</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  6. Limitações e Isenções de Responsabilidade
                </h2>
              </div>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                6.1 Disponibilidade do Serviço
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>O serviço é fornecido "como está", sem garantias de disponibilidade contínua</li>
                <li>Pode haver interrupções temporárias para manutenção ou atualizações</li>
                <li>Não garantimos compatibilidade com todos os navegadores ou dispositivos</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                6.2 Limitação de Responsabilidade
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais 
                ou consequenciais resultantes do uso ou incapacidade de usar a plataforma, incluindo 
                mas não se limitando à perda de dados ou interrupção do aprendizado.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                7. Privacidade e Proteção de Dados
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Sua privacidade é importante para nós. O tratamento de dados pessoais é regido por nossa 
                <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4 mx-1">
                  Política de Privacidade
                </Link>
                , que faz parte integrante destes Termos de Uso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                8. Suspensão e Cancelamento
              </h2>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                8.1 Por Parte do Usuário
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                Você pode encerrar sua conta a qualquer momento através das configurações da plataforma 
                ou entrando em contato conosco.
              </p>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                8.2 Por Parte da Plataforma
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                Reservamos o direito de suspender ou encerrar contas que violem estes termos, 
                com ou sem aviso prévio, dependendo da gravidade da violação.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Gavel className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  9. Disposições Gerais
                </h2>
              </div>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                9.1 Alterações nos Termos
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Podemos atualizar estes termos periodicamente. Alterações significativas serão 
                comunicadas através da plataforma com antecedência razoável.
              </p>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                9.2 Lei Aplicável
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Estes termos são regidos pelas leis brasileiras, especialmente pela Lei Geral 
                de Proteção de Dados (LGPD) e pelo Marco Civil da Internet.
              </p>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                9.3 Resolução de Conflitos
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                Tentaremos resolver disputas de forma amigável através de nossos canais de suporte. 
                Casos não resolvidos serão submetidos ao foro da comarca onde o usuário reside.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                10. Contato e Suporte
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Para dúvidas sobre estes termos ou para reportar violações:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Repositório GitHub: github.com/chatbot-educacional</li>
                <li>Issues no GitHub para reportar problemas</li>
                <li>Canais de suporte dentro da plataforma</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                ✓ Ao utilizar o CoderBot, você confirma que leu, compreendeu e concorda com estes Termos de Uso.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/consent" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Termo de Consentimento
          </Link>
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Política de Privacidade
          </Link>
          <Link to="/auth" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
}