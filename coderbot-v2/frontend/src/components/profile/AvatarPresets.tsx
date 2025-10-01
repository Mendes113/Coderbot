// src/components/profile/AvatarPresets.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Estilos populares do DiceBear API
const avatarStyles = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "big-ears",
  "big-smile",
  "bottts",
  "croodles",
  "fun-emoji",
  "micah",
  "miniavs",
  "notionists",
  "personas",
  "pixel-art",
  "thumbs",
] as const;

// Seeds divertidos para gerar avatares únicos
const seeds = [
  "Felix", "Aneka", "Harley", "Jasper", "Luna", "Oliver", "Willow", "Charlie",
  "Milo", "Zoe", "Max", "Chloe", "Rocky", "Bella", "Cooper", "Sophie",
  "Buddy", "Daisy", "Jack", "Molly", "Bear", "Sadie", "Duke", "Lucy",
  "Tucker", "Maggie", "Toby", "Lola", "Bailey", "Stella", "Zeus", "Penny"
];

interface AvatarPresetsProps {
  onSelect: (url: string) => void;
  currentAvatar?: string | null;
}

export function AvatarPresets({ onSelect, currentAvatar }: AvatarPresetsProps) {
  const [open, setOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<typeof avatarStyles[number]>("adventurer");
  const [randomSeed, setRandomSeed] = useState(0);

  // Gera URLs dos avatares
  const generateAvatarUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  const handleSelectAvatar = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  const handleRandomize = () => {
    setRandomSeed(prev => prev + 8);
  };

  // Gera 16 avatares por estilo
  const currentAvatars = seeds
    .slice(randomSeed % seeds.length, (randomSeed % seeds.length) + 16)
    .map(seed => generateAvatarUrl(selectedStyle, seed));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="relative group overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Escolher Avatar Preset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Escolha seu Avatar
          </DialogTitle>
          <DialogDescription>
            Selecione um estilo e escolha seu avatar preferido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor de Estilo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Estilo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRandomize}
                className="h-8 gap-2"
              >
                <Shuffle className="h-3 w-3" />
                Novos Avatares
              </Button>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {avatarStyles.map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                    className="capitalize shrink-0"
                  >
                    {style.replace(/-/g, " ")}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Grid de Avatares */}
          <ScrollArea className="h-[400px] w-full">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-1">
              {currentAvatars.map((avatarUrl, index) => (
                <motion.button
                  key={`${selectedStyle}-${index}-${randomSeed}`}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectAvatar(avatarUrl)}
                  className={`
                    relative rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100
                    dark:from-purple-900/20 dark:to-pink-900/20
                    w-full aspect-square max-w-[80px]
                    ring-2 ring-offset-1 transition-all duration-200
                    ${currentAvatar === avatarUrl
                      ? "ring-purple-500 ring-offset-purple-100 dark:ring-offset-purple-900"
                      : "ring-transparent hover:ring-purple-300 dark:hover:ring-purple-700"
                    }
                  `}
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {currentAvatar === avatarUrl && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-purple-500/20 flex items-center justify-center"
                    >
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </ScrollArea>

          {/* Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Sparkles className="h-3 w-3" />
            <p>
              Clique em "Novos Avatares" para ver mais opções ou mude o estilo acima
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

