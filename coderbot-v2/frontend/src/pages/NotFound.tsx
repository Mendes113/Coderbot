import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Animação Lottie do Gato */}
        <div className="w-64 h-64 mx-auto mb-8 flex items-center justify-center">
          <DotLottieReact
            src="/cat_Mark_loading.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Título 404 */}
        <h1 className="text-8xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          404
        </h1>

        {/* Mensagem Principal */}
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Oops! Página não encontrada
        </h2>

        {/* Descrição */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Parece que o gato comeu esta página... 🐱
          <br />
          <span className="text-sm">
            (Rota: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{location.pathname}</code>)
          </span>
        </p>

        {/* Botões de Navegação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>
          
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Home className="mr-2 h-5 w-5" />
            Ir para Home
          </Button>
        </div>

        {/* Easter Egg Hint */}
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-8 italic">
          💡 Dica: Explore a plataforma para descobrir conquistas escondidas!
        </p>
      </div>
    </div>
  );
};

export default NotFound;
