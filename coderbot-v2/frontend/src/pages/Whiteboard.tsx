import React, { useCallback, useRef, useState } from "react";
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { Save, Plus, UploadCloud, Loader2, MessageCircle } from "lucide-react";
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
  const [excalidrawAccessed, setExcalidrawAccessed] = useState(false); // novo estado
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [dailyBonusGiven, setDailyBonusGiven] = useState(false);
  const [createdBoards, setCreatedBoards] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false); // novo estado para controlar abertura do chat

  // Bônus diário ao acessar pela primeira vez no dia
  React.useEffect(() => {
    if (user && !dailyBonusGiven) {
      const lastBonus = localStorage.getItem('whiteboard_daily_bonus');
      const today = getToday();
      if (lastBonus !== today) {
        registerUserAction(user.id, 'whiteboard_daily_bonus'); // 200 pontos
        localStorage.setItem('whiteboard_daily_bonus', today);
        setDailyBonusGiven(true);
      }
    }
  }, [user, dailyBonusGiven]);

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
        setCreatedBoards((prev) => {
          const newCount = prev + 1;
          // Bônus a cada 10 quadros criados
          if (newCount % 10 === 0) {
            registerUserAction(user.id, 'whiteboard_10_boards'); // 500 pontos
          }
          return newCount;
        });
        registerUserAction(user.id, 'whiteboard_create_board'); // 50 pontos
      }
      // Salvar quadro: 10 pontos, limitado a 1x por minuto
      const now = Date.now();
      if (now - lastSaveTime > 60000) {
        registerUserAction(user.id, 'whiteboard_save_board');
        setLastSaveTime(now);
      }
      toast.success("Quadro salvo");
      refresh();
    } catch (err) {
      toast.error("Erro ao salvar");
      console.error(err);
    } finally {
      inflightRef.current = false;
    }
  }, [activeId, user, refresh, lastSaveTime]);

  /* ===================== AÇÕES DO MENU INICIAL ===================== */
  const handleOpenEditor = useCallback(() => {
    setEditorVisible(true);
    if (!excalidrawAccessed && user) {
      registerUserAction(user.id, "access_excalidraw");
      setExcalidrawAccessed(true);
    }
  }, [excalidrawAccessed, user]);

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
  const getCurrentSceneJSON = () => {
    const api = apiRef.current;
    if (!api) return null;
    return serializeAsJSON(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles(),
      "local",
    );
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="flex flex-col w-full h-screen bg-background text-foreground">
      <Toaster position="bottom-center" />

      {/* ---------- Tela Inicial ---------- */}
      {!editorVisible ? (
        <div className="m-auto flex flex-col gap-8 items-center w-full max-w-lg p-8 border rounded-2xl shadow-2xl bg-card">
          <h1 className="text-3xl font-bold mb-2">Whiteboard</h1>
          <p className="text-gray-600 text-center mb-4">Crie, salve e compartilhe quadros visuais para potencializar seu aprendizado!</p>

          {/* Card de progresso do usuário */}
          {user && (
            <div className="w-full">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Progresso</span>
                  {/* Exemplo: Nível do usuário */}
                  <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1">Nível 2</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  {/* Exemplo de barra de XP */}
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(createdBoards * 10, 100)}%` }} />
                </div>
                <div className="flex gap-2 mt-2">
                  {/* Badges/conquistas - exemplo visual */}
                  <span className="inline-block bg-yellow-200 text-yellow-800 rounded px-2 py-1 text-xs">Primeiro Quadro</span>
                  {createdBoards >= 10 && (
                    <span className="inline-block bg-green-200 text-green-800 rounded px-2 py-1 text-xs">10 Quadros!</span>
                  )}
                  {dailyBonusGiven && (
                    <span className="inline-block bg-blue-200 text-blue-800 rounded px-2 py-1 text-xs">Bônus Diário</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seção de desafios/missões */}
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

          {/* upload */}
          <label className="flex flex-col items-center gap-2 cursor-pointer w-full p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition mb-2">
            <UploadCloud size={24} />
            <span className="text-sm">Carregar arquivo (.json / .excalidraw)</span>
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

          {/* lista do usuário */}
          {user && (
            <div className="w-full mt-2">
              <h2 className="text-lg font-semibold mb-2">Seus quadros</h2>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <DrawingList items={drawings} onOpen={openFromDB} onRefresh={refresh} />
              )}
            </div>
          )}
        </div>
      ) : (
        /* ---------- Editor ---------- */
        <>
          <div className="flex-1">
            <Excalidraw
              initialData={scene || undefined}
              excalidrawAPI={(api) => (apiRef.current = api)}
            />
          </div>

          {/* FAB salvar manual */}
          <button
            onClick={saveScene}
            title="Salvar quadro"
            className="fixed bottom-5 right-5 z-50 p-4 rounded-full shadow-xl bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 transition"
          >
            <Save size={24} />
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
              <ChatInterface whiteboardContext={getCurrentSceneJSON()} />
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default Whiteboard;
