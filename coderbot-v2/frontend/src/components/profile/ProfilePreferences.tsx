import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Code2, 
  Sparkles, 
  Zap, 
  Monitor, 
  Moon, 
  Sun, 
  Settings, 
  Save,
  Info,
  Eye,
  Type,
  Keyboard,
  Palette
} from 'lucide-react';
import { useCodeEditor } from '@/context/CodeEditorContext';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

/**
 * ProfilePreferences Component
 * 
 * Manages user editor preferences with sections for:
 * - Code Editor settings
 * - Appearance preferences
 * - Accessibility options
 */
export const ProfilePreferences: React.FC = () => {
  const {
    editorPreferences,
    isSimpleMode,
    isAdvancedMode,
    savePreferences,
    isSyncingPreferences,
  } = useCodeEditor();

  const [hasChanges, setHasChanges] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(editorPreferences);

  // Sync local preferences when context updates
  React.useEffect(() => {
    setLocalPreferences(editorPreferences);
    setHasChanges(false);
  }, [editorPreferences]);

  // Update local preferences and mark as changed
  const handlePreferenceChange = <K extends keyof typeof localPreferences>(
    key: K,
    value: typeof localPreferences[K]
  ) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save all preferences to backend
  const handleSave = async () => {
    try {
      await savePreferences(localPreferences);
      setHasChanges(false);
      toast.success('Preferências salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar preferências');
      console.error('Error saving preferences:', error);
    }
  };

  // Reset to current saved preferences
  const handleReset = () => {
    setLocalPreferences(editorPreferences);
    setHasChanges(false);
    toast.success('Alterações descartadas');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
            Preferências do Editor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize sua experiência de desenvolvimento
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSyncingPreferences}
            >
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSyncingPreferences}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md shadow-purple-500/20"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSyncingPreferences ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}
      </div>

      {/* Mode Explanation Alert */}
      <Alert className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20">
        <Info className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="text-sm">
          <div className="space-y-2">
            <p>
              <span className="font-medium">Modos do Editor:</span>
            </p>
            <div className="pl-4 space-y-1">
              <p>
                <strong className="text-green-700 dark:text-green-300">🌱 Modo Simples:</strong>{' '}
                Interface limpa e minimalista para iniciantes. Apenas syntax highlighting básico.
              </p>
              <p>
                <strong className="text-purple-700 dark:text-purple-300">⚡ Modo Avançado:</strong>{' '}
                Ferramentas profissionais - Minimap, Code Folding, Guias de Indentação, 
                Sticky Scroll, Parameter Hints, Rulers (80/120 caracteres), e formatação automática.
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Editor Settings Section */}
      <Card className="border-purple-200/50 dark:border-purple-800/50">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/30 dark:to-transparent">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle>Editor de Código</CardTitle>
          </div>
          <CardDescription>
            Configure o comportamento e a aparência do editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Editor Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Modo do Editor</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha entre interface simples ou avançada
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "px-3 py-1.5",
                  localPreferences.editor_mode === 'simple'
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                )}
              >
                {localPreferences.editor_mode === 'simple' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Simples
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Avançado
                  </>
                )}
              </Badge>
            </div>
            
            <Select
              value={localPreferences.editor_mode}
              onValueChange={(value: 'simple' | 'advanced') => {
                handlePreferenceChange('editor_mode', value);
                // Update related preferences based on mode
                if (value === 'simple') {
                  handlePreferenceChange('show_minimap', false);
                  handlePreferenceChange('enable_lsp', false);
                } else {
                  handlePreferenceChange('show_minimap', true);
                  handlePreferenceChange('enable_lsp', true);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium">Modo Simples</div>
                      <div className="text-xs text-muted-foreground">Interface minimalista para iniciantes</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Modo Avançado</div>
                      <div className="text-xs text-muted-foreground">
                        Minimap, Code Folding, Rulers, Formatação Auto
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Tamanho da Fonte
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ajuste o tamanho do texto no editor
                </p>
              </div>
              <Badge variant="outline">{localPreferences.font_size}px</Badge>
            </div>
            <Slider
              value={[localPreferences.font_size]}
              onValueChange={(value) => handlePreferenceChange('font_size', value[0])}
              min={10}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Show Line Numbers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Números de Linha
              </Label>
              <p className="text-sm text-muted-foreground">
                Mostrar numeração de linhas no editor
              </p>
            </div>
            <Switch
              checked={localPreferences.show_line_numbers}
              onCheckedChange={(checked) => handlePreferenceChange('show_line_numbers', checked)}
            />
          </div>

          <Separator />

          {/* Enable Ligatures */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Ligaturas de Fonte
              </Label>
              <p className="text-sm text-muted-foreground">
                Combinar caracteres para melhor legibilidade (ex: {'=> , !='})
              </p>
            </div>
            <Switch
              checked={localPreferences.enable_ligatures}
              onCheckedChange={(checked) => handlePreferenceChange('enable_ligatures', checked)}
            />
          </div>

          <Separator />

          {/* Show Minimap */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Recursos Avançados
                {localPreferences.editor_mode === 'simple' && (
                  <Badge variant="secondary" className="text-xs">
                    Apenas no Modo Avançado
                  </Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                Ativa Minimap, Code Folding, Sticky Scroll, Rulers (80/120), 
                Parameter Hints, Formatação Automática e Guias de Indentação
              </p>
            </div>
            <Switch
              checked={localPreferences.show_minimap}
              onCheckedChange={(checked) => handlePreferenceChange('show_minimap', checked)}
              disabled={localPreferences.editor_mode === 'simple'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="border-purple-200/50 dark:border-purple-800/50">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/30 dark:to-transparent">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle>Aparência</CardTitle>
          </div>
          <CardDescription>
            Personalize o tema e a aparência visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Editor Theme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Tema do Editor</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha entre claro, escuro ou automático
                </p>
              </div>
              {localPreferences.editor_theme === 'auto' && (
                <Badge variant="secondary" className="gap-1">
                  <Monitor className="w-3 h-3" />
                  Auto-detectado
                </Badge>
              )}
            </div>
            
            <Select
              value={localPreferences.editor_theme}
              onValueChange={(value: 'light' | 'dark' | 'auto') => 
                handlePreferenceChange('editor_theme', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Claro</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-500" />
                    <span>Escuro</span>
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-purple-500" />
                    <div>
                      <div>Automático (Sistema)</div>
                      <div className="text-xs text-muted-foreground">
                        Sincroniza com o tema do seu sistema operacional
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save reminder at bottom */}
      {hasChanges && (
        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm">
            Você tem alterações não salvas. Clique em <strong>Salvar Alterações</strong> para aplicar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfilePreferences;
