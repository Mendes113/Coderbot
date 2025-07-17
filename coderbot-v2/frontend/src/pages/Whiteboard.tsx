import React, { useCallback, useRef, useState } from "react";
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { Save, Plus, UploadCloud, Loader2, MessageCircle, Star, Trophy, Zap, Heart, Sparkles, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import {
  pb,
  getCurrentUser,
  type DrawingRecord,
  registerUserAction,
} from "@/integrations/pocketbase/client";
import { useDrawings } from "@/hooks/useDrawings";
import { DrawingList } from "@/components/whiteboard/DrawingList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

// ---------- Tipos auxiliares ----------
/** Estrutura mínima do JSON exportado pelo Excalidraw */
type SceneJSON = Record<string, unknown>;

const getToday = () => new Date().toISOString().slice(0, 10);

const Whiteboard: React.FC = () => {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null);
  const inflightRef = useRef(false); // evita salvar em paralelo

  // ---------- Sessão do usuário ----------
  const user = getCurrentUser();
  const { drawings, loading, refresh } = useDrawings(user?.id);

  // ---------- Estado local ----------
  const [editorVisible, setEditorVisible] = useState(false);
  const [scene, setScene] = useState<SceneJSON | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null); // controla update vs create
  // const [excalidrawAccessed, setExcalidrawAccessed] = useState(false); // novo estado
  // const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  // const [dailyBonusGiven, setDailyBonusGiven] = useState(false);
  // const [createdBoards, setCreatedBoards] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false); // novo estado para controlar abertura do chat
  const [showCelebration, setShowCelebration] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");

  // // Bônus diário ao acessar pela primeira vez no dia
  // React.useEffect(() => {
  //   if (user && !dailyBonusGiven) {
  //     const lastBonus = localStorage.getItem('whiteboard_daily_bonus');
  //     const today = getToday();
  //     if (lastBonus !== today) {
  //       registerUserAction(user.id, 'whiteboard_daily_bonus'); // 200 pontos
  //       localStorage.setItem('whiteboard_daily_bonus', today);
  //       setDailyBonusGiven(true);
  //     }
  //   }
  // }, [user, dailyBonusGiven]);

  /* ===================== FUNÇÃO DE SALVAR ===================== */
  const saveScene = useCallback(async () => {
    const api = apiRef.current;
    if (!api || !user) return;
    if (inflightRef.current) return; // já tem save rodando

    inflightRef.current = true;

    const jsonObj = serializeAsJSON(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles(),
      "local",
    );
    const jsonStr = JSON.stringify(jsonObj);

    try {
      if (activeId) {
        await pb.collection("drawings").update(activeId, { data: jsonStr });
      } else {
        const record = await pb.collection("drawings").create({
          title: "Quadro sem nome",
          data: jsonStr,
          user: user.id,
        });
        setActiveId(record.id);
        // setCreatedBoards((prev) => {
        //   const newCount = prev + 1;
        //   // Bônus a cada 10 quadros criados
        //   if (newCount % 10 === 0) {
        //     registerUserAction(user.id, 'whiteboard_10_boards'); // 500 pontos
        //   }
        //   return newCount;
        // });
        // registerUserAction(user.id, 'whiteboard_create_board'); // 50 pontos
      }
      // // Salvar quadro: 10 pontos, limitado a 1x por minuto
      // const now = Date.now();
      // if (now - lastSaveTime > 60000) {
      //   registerUserAction(user.id, 'whiteboard_save_board');
      //   setLastSaveTime(now);
      // }
      toast.success("Quadro salvo");
      refresh();
    } catch (err) {
      toast.error("Erro ao salvar");
      console.error(err);
    } finally {
      inflightRef.current = false;
    }
  }, [activeId, user, refresh/*, lastSaveTime*/]);

  /* ===================== AÇÕES DO MENU INICIAL ===================== */
  const handleOpenEditor = useCallback(() => {
    setEditorVisible(true);
    // if (!excalidrawAccessed && user) {
    //   registerUserAction(user.id, "access_excalidraw");
    //   setExcalidrawAccessed(true);
    // }
  }, [/*excalidrawAccessed,*/ user]);

  const openLocalFile = async (file: File) => {
    try {
      const jsonObj = JSON.parse(await file.text());
      setScene(jsonObj);
      setActiveId(null);
      handleOpenEditor();
      if (user) registerUserAction(user.id, 'whiteboard_upload_file'); // 30 pontos
    } catch {
      toast.error("Arquivo inválido");
    }
  };

  const openFromDB = (d: DrawingRecord) => {
    try {
      const jsonObj: SceneJSON = typeof d.data === "string" ? JSON.parse(d.data) : (d.data as SceneJSON);
      setScene(jsonObj);
      setActiveId(d.id);
      handleOpenEditor();
      if (user) registerUserAction(user.id, 'whiteboard_open_board'); // 20 pontos
    } catch {
      toast.error("Não foi possível abrir o quadro");
    }
  };

  const newBoard = () => {
    setScene(null);
    setActiveId(null);
    handleOpenEditor();
    // Criar novo quadro: 50 pontos (será registrado no saveScene ao criar)
  };

  // Função para obter o JSON atual do quadro
  const getCurrentSceneJSON = (): Record<string, any> | null => {
    const api = apiRef.current;
    if (!api) return null;
    const jsonStr = serializeAsJSON(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles(),
      "local",
    );
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground relative">
      <Toaster position="bottom-center" />
      
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white px-8 py-6 rounded-2xl shadow-2xl animate-bounce text-center max-w-md">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-2">
              <Sparkles className="w-8 h-8 animate-spin" />
              {motivationalMessage}
              <Star className="w-8 h-8 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-200/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-200/20 rounded-full blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* ---------- Tela Inicial ---------- */}
      {!editorVisible ? (
        <div className="m-auto flex flex-col gap-8 items-center w-full max-w-lg p-8 border rounded-2xl shadow-2xl bg-card">
          <h1 className="text-3xl font-bold mb-2">Whiteboard</h1>
          <p className="text-gray-600 text-center mb-4">Crie, salve e compartilhe quadros visuais para potencializar seu aprendizado!</p>

          {/* Card de progresso do usuário */}
          {/*
          {user && (
            <div className="w-full">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Progresso</span>
                  <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1">Nível 2</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(createdBoards * 10, 100)}%` }} />
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-yellow-200 text-yellow-800 rounded px-2 py-1 text-xs">Primeiro Quadro</span>
                  {createdBoards >= 10 && (
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-md animate-in zoom-in-50 duration-500">
                      <Trophy className="w-3 h-3" />
                      10 Quadros!
                    </div>
                  )}
                  {dailyBonusGiven && (
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-md animate-in zoom-in-50 duration-500">
                      <Star className="w-3 h-3" />
                      Bônus Diário
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          */}

          {/* Seção de desafios/missões */}
          {/*
          {user && (
            <div className="w-full mb-4">
              <div className="font-semibold mb-1">Desafios</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Crie 10 quadros <span className={createdBoards >= 10 ? "text-green-600" : "text-gray-500"}>{createdBoards}/10</span></li>
                <li>Salve um quadro 5 dias seguidos <span className="text-gray-500">(em breve)</span></li>
                <li>Ganhe o bônus diário <span className={dailyBonusGiven ? "text-green-600" : "text-gray-500"}>{dailyBonusGiven ? "Concluído" : "Pendente"}</span></li>
              </ul>
            </div>
          )}
          */}

          {/* upload */}
          <label className="flex flex-col items-center gap-2 cursor-pointer w-full p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition mb-2 text-black">
            <UploadCloud size={24}  />
            <span className="text-sm text-black">Carregar arquivo (.json / .excalidraw)</span>
            <input
              type="file"
              accept=".json,.excalidraw"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && openLocalFile(e.target.files[0])}
            />
          </label>

          {/* novo quadro */}
          <button onClick={newBoard} className="btn-primary flex items-center gap-2 w-full justify-center py-3 text-lg rounded-lg shadow hover:scale-105 transition mb-2">
            <Plus size={20} /> Novo quadro
          </button>

              {/* Lista de quadros com design emocional */}
              {user && (
                <div className="w-full animate-in slide-in-from-bottom-2 duration-700 delay-900">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-pink-950/50 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/50 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
                    <div className="absolute inset-0 bg-pink-400/30 rounded-full blur-sm animate-ping"></div>
                  </div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    💖 Seus Quadros
                  </h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Carregando seus quadros...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <DrawingList items={drawings} onOpen={openFromDB} onRefresh={refresh} />
                    {drawings.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🎨</div>
                        <p className="text-muted-foreground text-sm">
                          Seus quadros aparecerão aqui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Comece criando seu primeiro quadro!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ---------- Editor ---------- */
        <>
          <div 
            className="fixed inset-0 top-0 left-0 w-full h-full z-10 bg-background"
            style={{ 
              height: '100vh', 
              width: '100vw',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <Excalidraw
              initialData={scene || undefined}
              excalidrawAPI={(api) => (apiRef.current = api)}
              theme="dark"
              UIOptions={{
                canvasActions: {
                  loadScene: false,
                  export: {
                    saveFileToDisk: true
                  }
                }
              }}
            />
          </div>

          {/* Botão de voltar - canto superior esquerdo */}
          <button
            onClick={() => setEditorVisible(false)}
            title="Voltar para a lista"
            className="group fixed top-5 left-5 z-50 p-3 rounded-full shadow-2xl bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 hover:scale-110 transition-all duration-300 border-2 border-white/20"
          >
            <div className="relative">
              <ArrowLeft size={20} className="group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:scale-150 transition-transform duration-300"></div>
            </div>
            {/* Efeito de pulso sutil */}
            <div className="absolute inset-0 bg-gray-400/20 rounded-full animate-ping opacity-50"></div>
          </button>

          {/* ---------- Chat Popup ---------- */}
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
              <button
                title="Abrir chat"
                className="fixed bottom-20 ml-2  z-50 p-5 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 transition"
              >
                <MessageCircle size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] p-0">
              {/* Passar o contexto do quadro para o chat */}
              <ChatInterface whiteboardContext={scene || undefined} />
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default Whiteboard;
