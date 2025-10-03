import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/integrations/pocketbase/client";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function UserInfo() {
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("ID copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p>Carregando informações do usuário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="text-2xl">📋 Informações do Usuário</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use estas informações para criar notificações de teste no PocketBase Admin
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User ID */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">🆔 User ID</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(user.id)}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-sm break-all font-mono">
              {user.id}
            </code>
          </div>

          {/* Nome */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">👤 Nome</h3>
            <p className="text-lg">{user.name || "Sem nome"}</p>
          </div>

          {/* Email */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">📧 Email</h3>
            <p className="text-lg">{user.email}</p>
          </div>

          {/* Role */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">🎭 Role</h3>
            <p className="text-lg capitalize">{user.role}</p>
          </div>

          {/* Instruções */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>📝</span> Como criar notificação no PocketBase
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Acesse:{" "}
                <a
                  href="http://localhost:8090/_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  http://localhost:8090/_/
                </a>
              </li>
              <li>Faça login com as credenciais do .env</li>
              <li>Navegue até a collection "notifications"</li>
              <li>Clique em "New record"</li>
              <li>Preencha os campos:
                <div className="ml-4 mt-2 p-2 bg-white dark:bg-gray-900 rounded font-mono text-xs">
                  recipient: <span className="text-purple-600">{user.id}</span><br />
                  sender: <span className="text-purple-600">{user.id}</span><br />
                  title: "Teste de Notificação"<br />
                  content: "Esta é uma notificação de teste! 🚀"<br />
                  type: "info"<br />
                  read: false
                </div>
              </li>
              <li>Clique em "Create"</li>
              <li>A notificação aparecerá automaticamente na sidebar! ✨</li>
            </ol>
          </div>

          {/* Link para página de testes */}
          <div className="flex gap-3">
            <Button
              onClick={() => window.open("http://localhost:8090/_/", "_blank")}
              className="flex-1"
              variant="default"
            >
              🔧 Abrir PocketBase Admin
            </Button>
            <Button
              onClick={() => (window.location.href = "/notifications-test")}
              className="flex-1"
              variant="outline"
            >
              🧪 Página de Testes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
