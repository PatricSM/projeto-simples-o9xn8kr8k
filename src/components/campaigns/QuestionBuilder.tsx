import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical, Plus, X, GitBranch } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import ConditionalLogic from "@/components/campaigns/ConditionalLogic";
import ContextualTags from "@/components/campaigns/ContextualTags";
import { NPS_COLOR_PROFILE_OPTIONS } from '@/lib/nps-color-profiles';

export interface Question {
  id: string;
  title: string;
  description?: string;
  question_type: 'nps_scale' | 'text' | 'multiple_choice' | 'rating' | 'contact_points' | 'problems';
  required: boolean;
  order_index: number;
  section_id?: string;
  config: Record<string, any>;
  is_primary_nps?: boolean; // Indica se é a pergunta NPS principal
  conditional_logic?: {
    enabled: boolean;
    rules: ConditionalRule[];
  };
}

export interface ConditionalRule {
  option_value: string;
  target_section_id: string;
  action: 'go_to_section' | 'skip_to_end';
}

interface QuestionBuilderProps {
  question: Question;
  index: number;
  sections: Array<{ id: string; title: string; order_index: number }>;
  questions: Question[]; // Para tags contextuais
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onRemove: (id: string) => void;
  onMarkAsPrimaryNPS?: (questionId: string) => void; // Nova função para marcar como NPS principal
}

export default function QuestionBuilder({ 
  question, 
  index, 
  sections, 
  questions,
  onUpdate, 
  onRemove,
  onMarkAsPrimaryNPS 
}: QuestionBuilderProps) {
  const [options, setOptions] = useState<string[]>(
    question.config?.options || ['']
  );
  const [showConditionalLogic, setShowConditionalLogic] = useState(
    question.conditional_logic?.enabled || false
  );

  /**
   * Re-sincroniza o state local `options` quando a prop `question.config.options`
   * muda externamente (ex.: usuário troca o tipo de pergunta para `multiple_choice`,
   * ou os dados são recarregados do banco).
   *
   * Sem este efeito, o `useState` inicial só era avaliado na montagem do componente —
   * ao trocar de tipo o config do pai mudava, mas o state local ficava preso ao
   * valor antigo, fazendo as opções digitadas serem perdidas (Bug #3).
   */
  useEffect(() => {
    const incoming = question.config?.options;
    if (Array.isArray(incoming)) {
      const normalized = incoming.length > 0 ? incoming : [''];
      // Comparação rasa por JSON evita loop quando o conteúdo é equivalente
      if (JSON.stringify(normalized) !== JSON.stringify(options)) {
        setOptions(normalized);
      }
    } else if (question.question_type === 'multiple_choice' && options.length === 0) {
      setOptions(['']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.config?.options, question.question_type]);

  const getQuestionTypeLabel = (type: string) => {
    const types = {
      nps_scale: 'Escala NPS (0-10)',
      text: 'Texto Livre',
      multiple_choice: 'Escolha Múltipla',
      rating: 'Avaliação (1-5 estrelas)',
      contact_points: 'Pontos de Contato',
      problems: 'Problemas Reportados',
    };
    return types[type as keyof typeof types] || type;
  };

  const updateConfig = (key: string, value: any) => {
    onUpdate(question.id, {
      config: { ...question.config, [key]: value }
    });
  };

  const updateConditionalLogic = (enabled: boolean, rules: ConditionalRule[] = []) => {
    onUpdate(question.id, {
      conditional_logic: { enabled, rules }
    });
  };

  const insertTagInField = (tag: string, field: 'title' | 'description') => {
    const currentValue = field === 'title' ? question.title : question.description || '';
    const newValue = currentValue + ' ' + tag;
    onUpdate(question.id, { [field]: newValue });
  };

  /**
   * Atualiza as opções preservando strings vazias intermediárias.
   * A sanitização (filtro de vazias) é feita APENAS no consumo:
   *   - na renderização do ConditionalLogic (linha ~716, prop `options`)
   *   - no publish da campanha (NewCampaign.publishCampaign)
   *   - na renderização da pesquisa pública (PublicSurvey)
   * Isso permite ao usuário digitar/apagar livremente sem perder opções.
   */
  const handleOptionsChange = (newOptions: string[]) => {
    setOptions(newOptions);
    updateConfig('options', newOptions);
  };

  const addOption = () => {
    handleOptionsChange([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    handleOptionsChange(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    handleOptionsChange(newOptions);
  };

  const renderQuestionTypeConfig = () => {
    switch (question.question_type) {
      case 'nps_scale':
        return (
          <div className="space-y-4">
            <div>
              <Label>Configuração NPS</Label>
              
              {/* Marcação como NPS Principal */}
              <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                <input
                  type="checkbox"
                  id={`primary-nps-${question.id}`}
                  checked={question.is_primary_nps || false}
                  onChange={(e) => {
                    if (e.target.checked && onMarkAsPrimaryNPS) {
                      onMarkAsPrimaryNPS(question.id);
                    } else {
                      onUpdate(question.id, { is_primary_nps: false });
                    }
                  }}
                />
                <Label htmlFor={`primary-nps-${question.id}`} className="text-sm font-medium">
                  ⭐ Marcar como Escala NPS Principal
                </Label>
              </div>
              
              {question.is_primary_nps && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                  📊 Esta é a pergunta NPS principal usada para cálculo do score oficial da campanha
                </div>
              )}
              
              {!question.is_primary_nps && questions.some(q => q.is_primary_nps) && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                  ℹ️ Esta é uma escala NPS secundária para análises específicas
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <Label className="text-sm">Pergunta para Detratores (0-6)</Label>
                  <Textarea
                    placeholder="Por que você deu essa nota baixa?"
                    value={question.config?.detractor_question || ''}
                    onChange={(e) => updateConfig('detractor_question', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Pergunta para Neutros (7-8)</Label>
                  <Textarea
                    placeholder="O que poderíamos melhorar?"
                    value={question.config?.neutral_question || ''}
                    onChange={(e) => updateConfig('neutral_question', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Pergunta para Promotores (9-10)</Label>
                  <Textarea
                    placeholder="O que mais gostou em nossos serviços?"
                    value={question.config?.promoter_question || ''}
                    onChange={(e) => updateConfig('promoter_question', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Perfil de cores da escala NPS exibida na pesquisa pública */}
              <div className="mt-4">
                <Label className="text-sm">Perfil de cores da escala</Label>
                <Select
                  value={question.config?.nps_color_profile || 'traffic_light'}
                  onValueChange={(value) => updateConfig('nps_color_profile', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NPS_COLOR_PROFILE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Escolha como as cores dos botões 0–10 serão exibidas na pesquisa pública.
                </p>
              </div>
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opções de Resposta</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`allow-multiple-${question.id}`}
                  checked={question.config?.allow_multiple !== false}
                  onChange={(e) => updateConfig('allow_multiple', e.target.checked)}
                />
                <Label htmlFor={`allow-multiple-${question.id}`} className="text-sm">
                  Permitir múltiplas seleções
                </Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <input
                type="checkbox"
                id={`allow-other-${question.id}`}
                checked={question.config?.allow_other !== false}
                onChange={(e) => updateConfig('allow_other', e.target.checked)}
              />
              <Label htmlFor={`allow-other-${question.id}`} className="text-sm font-medium">
                ✨ Incluir opção "Outro(a)" para resposta personalizada
              </Label>
            </div>
            
            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Opção ${idx + 1}`}
                    value={option}
                    onChange={(e) => updateOption(idx, e.target.value)}
                  />
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {/* Mostrar opção "Outro(a)" se habilitada */}
              {question.config?.allow_other !== false && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                  <Input
                    value="Outro(a) - especifique"
                    disabled
                    className="bg-gray-100 text-gray-600"
                  />
                  <Badge variant="secondary" className="text-xs">
                    Automático
                  </Badge>
                </div>
              )}
              
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
          </div>
        );

      case 'rating': {
        const isLikert = question.config?.display_mode === 'likert';
        const likertItems: string[] = question.config?.items || [];
        const maxRating = question.config?.max_rating || 5;
        const scaleLabels: string[] = question.config?.scale_labels || Array(maxRating).fill('');

        /**
         * Ativa/desativa o modo Likert (matriz).
         * Ao ativar, preserva max_rating e preenche scale_labels e items com defaults.
         * Ao desativar, remove campos específicos de Likert sem perder os demais.
         */
        const toggleLikertMode = (enabled: boolean) => {
          if (enabled) {
            onUpdate(question.id, {
              config: {
                ...question.config,
                display_mode: 'likert',
                likert_style: question.config?.likert_style || 'radio',
                items: likertItems.length >= 2 ? likertItems : ['Item 1', 'Item 2'],
                scale_labels: scaleLabels.some((l: string) => l.trim())
                  ? scaleLabels
                  : ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'].slice(0, maxRating),
              },
            });
          } else {
            // Remover campos exclusivos do Likert, manter o restante
            const { display_mode, likert_style, items, scale_labels, ...rest } = question.config || {};
            onUpdate(question.id, { config: { ...rest } });
          }
        };

        /** Atualiza um item individual na lista de itens Likert */
        const updateLikertItem = (idx: number, value: string) => {
          const updated = [...likertItems];
          updated[idx] = value;
          updateConfig('items', updated);
        };

        /** Adiciona novo item à lista Likert */
        const addLikertItem = () => updateConfig('items', [...likertItems, '']);

        /** Remove item da lista Likert (mínimo 2 itens) */
        const removeLikertItem = (idx: number) => {
          if (likertItems.length <= 2) return;
          updateConfig('items', likertItems.filter((_, i) => i !== idx));
        };

        /** Atualiza um label individual na escala */
        const updateScaleLabel = (idx: number, value: string) => {
          const updated = [...scaleLabels];
          updated[idx] = value;
          updateConfig('scale_labels', updated);
        };

        return (
          <div className="space-y-4">
            {/* --- Configuração base (compartilhada) --- */}
            <div>
              <Label>Configuração de Avaliação</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-sm">Número máximo de estrelas</Label>
                  <Select
                    value={maxRating.toString()}
                    onValueChange={(value) => {
                      const newMax = parseInt(value);
                      const newLabels = Array(newMax).fill('').map((_, i) => scaleLabels[i] || '');
                      onUpdate(question.id, {
                        config: {
                          ...question.config,
                          max_rating: newMax,
                          ...(isLikert ? { scale_labels: newLabels } : {}),
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 estrelas</SelectItem>
                      <SelectItem value="4">4 estrelas</SelectItem>
                      <SelectItem value="5">5 estrelas</SelectItem>
                      <SelectItem value="10">10 pontos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Rótulo mínimo</Label>
                  <Input
                    placeholder="Ex: Muito ruim"
                    value={question.config?.min_label || ''}
                    onChange={(e) => updateConfig('min_label', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-sm">Rótulo máximo</Label>
                <Input
                  placeholder="Ex: Excelente"
                  value={question.config?.max_label || ''}
                  onChange={(e) => updateConfig('max_label', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* --- Toggle Modo Likert --- */}
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border-l-4 border-l-purple-500">
              <input
                type="checkbox"
                id={`likert-mode-${question.id}`}
                checked={isLikert}
                onChange={(e) => toggleLikertMode(e.target.checked)}
              />
              <Label htmlFor={`likert-mode-${question.id}`} className="text-sm font-medium">
                📊 Modo Likert (matriz de avaliação)
              </Label>
            </div>

            {isLikert && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                {/* Seletor de estilo visual */}
                <div>
                  <Label className="text-sm font-medium">Estilo visual no formulário</Label>
                  <Select
                    value={question.config?.likert_style || 'radio'}
                    onValueChange={(value) => updateConfig('likert_style', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radio">Radio buttons em tabela</SelectItem>
                      <SelectItem value="stars">Estrelas por item</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {question.config?.likert_style === 'stars'
                      ? 'Cada item será exibido com uma fileira de estrelas clicáveis.'
                      : 'Tabela com itens nas linhas e escala nas colunas com radio buttons.'}
                  </p>
                </div>

                {/* Lista de itens (afirmações / aspectos a avaliar) */}
                <div>
                  <Label className="text-sm font-medium">Itens a avaliar</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Adicione os aspectos que o respondente deve avaliar (mínimo 2).
                  </p>
                  <div className="space-y-2">
                    {likertItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Item ${idx + 1} (ex: Recepção)`}
                          value={item}
                          onChange={(e) => updateLikertItem(idx, e.target.value)}
                        />
                        {likertItems.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLikertItem(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addLikertItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>
                </div>

                {/* Labels da escala */}
                <div>
                  <Label className="text-sm font-medium">Rótulos da escala ({maxRating} pontos)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Defina o rótulo de cada ponto da escala (ex: 1 = Péssimo, 5 = Excelente).
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {scaleLabels.map((label, idx) => (
                      <div key={idx}>
                        <Label className="text-xs text-muted-foreground">Ponto {idx + 1}</Label>
                        <Input
                          placeholder={`Rótulo ${idx + 1}`}
                          value={label}
                          onChange={(e) => updateScaleLabel(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Configuração do Campo de Texto</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-sm">Tipo de entrada</Label>
                  <Select
                    value={question.config?.input_type || 'textarea'}
                    onValueChange={(value) => updateConfig('input_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="textarea">Texto longo (múltiplas linhas)</SelectItem>
                      <SelectItem value="input">Texto curto (uma linha)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Limite de caracteres</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 500"
                    value={question.config?.max_length || ''}
                    onChange={(e) => updateConfig('max_length', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">Pergunta {index + 1}</Badge>
            <Badge variant="secondary">
              {getQuestionTypeLabel(question.question_type)}
            </Badge>
            {question.is_primary_nps && (
              <Badge variant="default" className="bg-blue-600 text-white">
                ⭐ NPS Principal
              </Badge>
            )}
            {question.section_id && (
              <Badge variant="outline" className="bg-blue-50">
                {sections.find(s => s.id === question.section_id)?.title || 'Seção'}
              </Badge>
            )}
            {sections.length > 0 && !question.section_id && (
              <Badge variant="destructive" className="text-xs">
                Seção obrigatória
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(question.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <Label>Título da Pergunta *</Label>
              <ContextualTags
                questions={questions}
                currentQuestionIndex={index}
                onInsertTag={(tag) => insertTagInField(tag, 'title')}
              />
            </div>
            <Input
              value={question.title}
              onChange={(e) => onUpdate(question.id, { title: e.target.value })}
              placeholder="Ex: O quanto você recomendaria nossos serviços?"
            />
          </div>
          <div>
            <Label>Tipo de Pergunta</Label>
            <Select
              value={question.question_type}
              onValueChange={(value) => {
                let defaultConfig = {};
                
                // Definir configurações padrão por tipo de pergunta
                switch (value) {
                  case 'multiple_choice':
                    // Idempotente: preserva opções já digitadas se houver,
                    // evitando perda de dados ao trocar de tipo e voltar.
                    defaultConfig = {
                      options: question.config?.options?.length ? question.config.options : [''],
                      allow_multiple: question.config?.allow_multiple ?? true,
                      allow_other: question.config?.allow_other ?? true,
                    };
                    break;
                  case 'nps_scale':
                    defaultConfig = { 
                      is_primary_nps: false 
                    };
                    break;
                  case 'rating':
                    defaultConfig = { 
                      max_rating: 5 
                    };
                    break;
                  default:
                    defaultConfig = {};
                }
                
                onUpdate(question.id, { 
                  question_type: value as any,
                  config: defaultConfig,
                  conditional_logic: { enabled: false, rules: [] }
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nps_scale">Escala NPS (0-10)</SelectItem>
                <SelectItem value="text">Texto Livre</SelectItem>
                <SelectItem value="multiple_choice">Escolha Múltipla/Radiobox</SelectItem>
                <SelectItem value="rating">Avaliação (1-5 estrelas)</SelectItem>
                <SelectItem value="contact_points">Pontos de Contato</SelectItem>
                <SelectItem value="problems">Problemas Reportados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <Label>Descrição/Instruções</Label>
              <ContextualTags
                questions={questions}
                currentQuestionIndex={index}
                onInsertTag={(tag) => insertTagInField(tag, 'description')}
              />
            </div>
            <Textarea
              value={question.description || ''}
              onChange={(e) => onUpdate(question.id, { description: e.target.value })}
              placeholder="Instruções adicionais para esta pergunta (opcional)"
            />
          </div>
          <div>
            <Label>Seção {sections.length > 0 && <span className="text-red-500">*</span>}</Label>
            <Select
              value={question.section_id || 'no-section'}
              onValueChange={(value) => onUpdate(question.id, { section_id: value === 'no-section' ? undefined : value })}
            >
              <SelectTrigger className={sections.length > 0 && !question.section_id ? 'border-red-300' : ''}>
                <SelectValue placeholder={sections.length > 0 ? "Selecione uma seção" : "Sem seção específica"} />
              </SelectTrigger>
              <SelectContent>
                {sections.length === 0 && <SelectItem value="no-section">Sem seção específica</SelectItem>}
                {sections
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((section, index) => (
                    <SelectItem key={section.id} value={section.id}>
                      {index + 1}. {section.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {sections.length > 0 && !question.section_id && (
              <p className="text-xs text-red-600 mt-1">
                A seção é obrigatória quando há seções definidas na pesquisa.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) => onUpdate(question.id, { required: !!checked })}
            />
            <Label htmlFor={`required-${question.id}`}>
              Pergunta obrigatória
            </Label>
          </div>

          {question.question_type === 'multiple_choice' && sections.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`conditional-${question.id}`}
                checked={showConditionalLogic}
                onCheckedChange={(checked) => {
                  setShowConditionalLogic(!!checked);
                  updateConditionalLogic(!!checked, question.conditional_logic?.rules || []);
                }}
              />
              <Label htmlFor={`conditional-${question.id}`} className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                Lógica condicional
              </Label>
            </div>
          )}
        </div>

        {renderQuestionTypeConfig() && (
          <>
            <Separator />
            {renderQuestionTypeConfig()}
          </>
        )}

        {/* Lógica Condicional */}
        {showConditionalLogic && question.question_type === 'multiple_choice' && (
          <>
            <Separator />
            <ConditionalLogic
              options={options.filter(opt => opt.trim())}
              sections={sections}
              rules={question.conditional_logic?.rules || []}
              onUpdate={(rules) => updateConditionalLogic(true, rules)}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}