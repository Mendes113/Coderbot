import { useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AnalogySettingsProps {
  analogiesEnabled: boolean;
  setAnalogiesEnabled: (enabled: boolean) => void;
  knowledgeBase: string;
  setKnowledgeBase: (base: string) => void;
}

export const AnalogySettings: React.FC<AnalogySettingsProps> = ({
  analogiesEnabled,
  setAnalogiesEnabled,
  knowledgeBase,
  setKnowledgeBase,
}) => {
  return (
    <div className="space-y-4">
      {/* Toggle for enabling/disabling analogies */}
      <div className="flex items-center justify-between space-x-2 rounded-2xl border-2 border-[hsl(var(--education-purple))] bg-white/80 dark:bg-black/60 shadow-md p-4 transition-all duration-200">
        <Label htmlFor="analogy-mode" className="flex flex-col space-y-1">
          <span className="font-semibold text-[hsl(var(--education-purple-dark))] dark:text-[hsl(var(--education-purple))]">Modo Analogia</span>
          <span className="font-normal leading-snug text-muted-foreground">
            Receber explicações usando analogias.
          </span>
        </Label>
        <Switch
          id="analogy-mode"
          checked={analogiesEnabled}
          onCheckedChange={setAnalogiesEnabled}
          aria-label="Ativar modo analogia"
          className="data-[state=checked]:bg-[hsl(var(--education-purple))]"
        />
      </div>

      {/* Knowledge Base Input - Shown only when analogies are enabled */}
      {analogiesEnabled && (
        <div className="space-y-2 rounded-2xl border-2 border-[hsl(var(--education-purple))] bg-white/80 dark:bg-black/60 shadow-md p-4 transition-all duration-200">
           <Label htmlFor="knowledge-base" className="font-semibold text-[hsl(var(--education-purple-dark))] dark:text-[hsl(var(--education-purple))]">
             Base de Conhecimento para Analogias (Opcional)
           </Label>
           <Textarea
             id="knowledge-base"
             placeholder="Ex: Explique como se eu fosse um chef de cozinha, use termos de Star Wars, etc."
             value={knowledgeBase}
             onChange={(e) => setKnowledgeBase(e.target.value)}
             className="min-h-[80px] resize-none bg-white/70 dark:bg-black/40 border-2 border-[hsl(var(--education-purple))] rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:border-[hsl(var(--education-purple-dark))] focus:ring-2 focus:ring-[hsl(var(--education-purple))] transition-all duration-200"
             aria-label="Digite a base de conhecimento para as analogias"
           />
           <p className="text-sm text-muted-foreground">
             Forneça um contexto ou tema para guiar as analogias da IA.
           </p>
        </div>
      )}
    </div>
  );
};
