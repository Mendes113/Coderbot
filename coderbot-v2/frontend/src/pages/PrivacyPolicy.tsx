import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, User, FileText, Globe, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
              Política de Privacidade
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
                  1. Informações Gerais
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                O CoderBot é uma plataforma educacional de código aberto voltada para o ensino de programação. 
                Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações 
                quando você utiliza nossa plataforma.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  2. Informações que Coletamos
                </h2>
              </div>
              
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                2.1 Informações de Conta
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Email:</strong> Para autenticação e comunicação</li>
                <li><strong>Nome de usuário:</strong> Para identificação na plataforma</li>
                <li><strong>Tipo de usuário:</strong> Estudante ou Professor</li>
                <li><strong>Progresso educacional:</strong> Exercícios completados, notas, tempo de estudo</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                2.2 Dados de Uso (Opcional - Com Consentimento)
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Páginas visitadas e tempo gasto em cada seção</li>
                <li>Interações com elementos da interface</li>
                <li>Dados técnicos (navegador, sistema operacional, resolução)</li>
                <li>Métricas de performance da aplicação</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-6 mb-3">
                2.3 Conteúdo Criado
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Códigos escritos nos exercícios</li>
                <li>Anotações e comentários</li>
                <li>Desenhos no quadro branco colaborativo</li>
                <li>Conversas com o chatbot educacional</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  3. Como Utilizamos suas Informações
                </h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Fornecimento do serviço:</strong> Autenticação, salvamento de progresso, personalização da experiência</li>
                <li><strong>Comunicação:</strong> Envio de atualizações importantes sobre a plataforma</li>
                <li><strong>Melhoria da plataforma:</strong> Análise de uso para desenvolvimento de novos recursos</li>
                <li><strong>Suporte técnico:</strong> Resolução de problemas e assistência aos usuários</li>
                <li><strong>Segurança:</strong> Prevenção de fraudes e proteção contra atividades maliciosas</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  4. Proteção de Dados
                </h2>
              </div>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p><strong>Criptografia:</strong> Todas as comunicações são protegidas por HTTPS/TLS</p>
                <p><strong>Autenticação segura:</strong> Senhas são criptografadas usando algoritmos seguros</p>
                <p><strong>Acesso restrito:</strong> Apenas pessoal autorizado tem acesso aos dados</p>
                <p><strong>Anonimização:</strong> Dados analíticos são processados de forma anônima</p>
                <p><strong>Backups seguros:</strong> Backups são criptografados e armazenados com segurança</p>
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  5. Compartilhamento de Dados
                </h2>
              </div>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p><strong>Não vendemos dados:</strong> Nunca vendemos, alugamos ou comercializamos suas informações pessoais.</p>
                <p><strong>Compartilhamento limitado:</strong> Podemos compartilhar dados apenas nos seguintes casos:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Com seu consentimento explícito</li>
                  <li>Para cumprir obrigações legais</li>
                  <li>Para proteger nossos direitos e segurança</li>
                  <li>Com provedores de serviços que assinaram acordos de confidencialidade</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                6. Seus Direitos (LGPD)
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Acesso:</strong> Saber quais dados pessoais temos sobre você</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a remoção de dados pessoais desnecessários</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Retirar o consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas situações</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                7. Retenção de Dados
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Dados de conta:</strong> Mantidos enquanto sua conta estiver ativa</li>
                <li><strong>Dados educacionais:</strong> Preservados para continuidade do aprendizado</li>
                <li><strong>Dados analíticos:</strong> Agregados e anonimizados, retidos por até 2 anos</li>
                <li><strong>Logs de segurança:</strong> Mantidos por até 1 ano para fins de auditoria</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                8. Cookies e Tecnologias Similares
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p><strong>Cookies essenciais:</strong> Necessários para o funcionamento da plataforma (sessão, autenticação)</p>
                <p><strong>Cookies analíticos:</strong> Opcionais, utilizados apenas com seu consentimento</p>
                <p><strong>Local Storage:</strong> Para salvar preferências e progresso offline</p>
                <p><strong>Sem rastreamento:</strong> Não utilizamos cookies de terceiros para rastreamento publicitário</p>
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white m-0">
                  9. Contato
                </h2>
              </div>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Repositório GitHub: github.com/chatbot-educacional</li>
                  <li>Issues no GitHub para dúvidas sobre privacidade</li>
                  <li>Através dos canais de suporte da plataforma</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                10. Alterações nesta Política
              </h2>
              <p className="text-slate-700 dark:text-slate-300">
                Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas 
                serão comunicadas através da plataforma. Recomendamos revisar esta página regularmente 
                para se manter informado sobre como protegemos suas informações.
              </p>
            </section>

            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✓ Esta política está em conformidade com a LGPD (Lei 13.709/2018) e as melhores práticas de proteção de dados.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/consent" className="hover:text-slate-900 dark:hover:text-white underline underline-offset-4">
            Termo de Consentimento
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