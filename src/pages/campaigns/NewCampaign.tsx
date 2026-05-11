import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHospitalRoute } from '@/hooks/use-hospital-route';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Save, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useHospitalView } from '@/contexts/HospitalViewContext';
import QuestionBuilder, { Question, ConditionalRule } from '@/components/campaigns/QuestionBuilder';
import BannerUpload, { BannerConfig } from '@/components/campaigns/BannerUpload';
import QuickSectionCreator from '@/components/campaigns/QuickSectionCreator';
import SectionManager, { Section } from '@/components/campaigns/SectionManager';
import { Layers } from 'lucide-react';

/**
 * Regex para identificar UUIDs v4 reais (vindos do banco).
 * Qualquer ID que NÃO corresponda a este padrão é considerado um ID local
 * (temporário), independentemente do prefixo (`temp-`, `section-`, etc.).
 * Mais robusto que checagem por prefixo.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isPersistedId = (id?: string | null): boolean => !!id && UUID_REGEX.test(id);

/**
 * Filtra opções de multiple_choice removendo strings vazias.
 * Sanitização aplicada APENAS no momento do consumo (publish + render),
 * nunca durante a edição — preserva digitação intermediária do usuário.
 */
const sanitizeMultipleChoiceOptions = (options: unknown): string[] => {
  if (!Array.isArray(options)) return [];
  return options
    .filter((opt): opt is string => typeof opt === 'string')
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0);
};

const campaignSchema = z.object({
  name: z.string().min(1, 'Nome interno é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  public_title: z.string().min(1, 'Título público é obrigatório').max(200, 'Título público deve ter no máximo 200 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  type: z.enum(['email_batch', 'sms_batch', 'whatsapp_batch', 'public_link', 'integration_flow']),
  welcome_message: z.string().min(1, 'Mensagem de boas-vindas é obrigatória').max(1000),
  thank_you_message: z.string().min(1, 'Mensagem de agradecimento é obrigatória').max(1000),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
  expires_at: z.string().optional(),
  banner_url: z.string().optional(),
  banner_position: z.enum(['first_section', 'top_first_section', 'top_all_sections', 'none']).optional(),
  banner_height: z.number().optional(),
});

const questionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(500).optional(),
  question_type: z.enum(['nps_scale', 'text', 'multiple_choice', 'rating', 'contact_points', 'problems']),
  required: z.boolean(),
  config: z.record(z.any()).optional(),
  section_id: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function NewCampaign() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { buildPath } = useHospitalRoute();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { hospitalContext } = useHospitalView();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    banner_position: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      public_title: '',
      description: '',
      type: 'email_batch',
      welcome_message: 'Olá! Gostaríamos de saber sua opinião sobre nossos serviços.',
      thank_you_message: 'Obrigado pelo seu feedback! Sua opinião é muito importante para nós.',
      primary_color: '#3B82F6',
      expires_at: '',
      banner_position: 'none',
    },
  });

  const getHospitalId = () => {
    if (hospitalContext) {
      return hospitalContext.hospitalId;
    }
    return profile?.hospital_id;
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      question_type: 'nps_scale',
      required: true,
      order_index: questions.length,
      config: {},
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    
    // Força o auto-save imediatamente após remover a pergunta
    const formData = form.getValues();
    setTimeout(() => {
      autoSave(formData, true);
    }, 100); // Pequeno delay para garantir que o state foi atualizado
  };

  const markAsPrimaryNPS = (questionId: string) => {
    setQuestions(questions.map(q => ({
      ...q,
      is_primary_nps: q.id === questionId // Apenas a pergunta selecionada fica como principal
    })));
  };

  // Auto-save function
  const autoSave = async (data: Partial<CampaignFormData>, forceSave = false) => {
    const hospitalId = getHospitalId();
    
    if (!hospitalId || (!data.name && !forceSave)) return;

    setSaveStatus('saving');

    try {
      if (draftCampaignId) {
        // Update existing draft
        const { error } = await supabase
          .from('campaigns')
          .update({
            name: data.name,
            public_title: data.public_title,
            description: data.description,
            type: data.type as any,
            welcome_message: data.welcome_message,
            thank_you_message: data.thank_you_message,
            primary_color: data.primary_color,
            expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
            banner_url: bannerConfig.banner_url || null,
            banner_config: {
              position: bannerConfig.banner_position || 'none',
              height: bannerConfig.banner_height || 300,
            },
          } as any)
          .eq('id', draftCampaignId);

        if (error) throw error;

        // ============================================================
        // SEÇÕES — UPSERT com mapeamento tempId → realUUID
        // ============================================================
        // Mapa que traduz IDs locais (não-UUID) para os UUIDs reais
        // gerados pelo banco após o INSERT. Usado depois para resolver
        // section_id das perguntas e target_section_id das regras condicionais.
        const sectionIdMap = new Map<string, string>();

        if (sections.length > 0) {
          // Buscar seções existentes para identificar quais devem ser removidas
          const { data: existingSections } = await supabase
            .from('campaign_sections')
            .select('id, order_index')
            .eq('campaign_id', draftCampaignId);

          const existingSectionIds = existingSections?.map(s => s.id) || [];

          // Preparar payload preservando referência ao tempId original.
          // isPersistedId garante que prefixos diferentes (temp-, section-, etc.)
          // sejam todos tratados como locais — só UUID v4 conta como persistido.
          const sectionsToUpsert = sections.map((s, index) => ({
            originalTempId: !isPersistedId(s.id) ? s.id : undefined,
            id: isPersistedId(s.id) ? s.id : undefined,
            campaign_id: draftCampaignId,
            title: s.title,
            description: s.description || null,
            order_index: index,
          }));

          for (const section of sectionsToUpsert) {
            if (section.id) {
              // UPDATE de seção existente (UUID real)
              await supabase
                .from('campaign_sections')
                .update({
                  title: section.title,
                  description: section.description,
                  order_index: section.order_index,
                })
                .eq('id', section.id);
            } else {
              // INSERT de nova seção (ID local) → captura UUID real e mapeia
              const { data: newSection } = await supabase
                .from('campaign_sections')
                .insert({
                  campaign_id: section.campaign_id,
                  title: section.title,
                  description: section.description,
                  order_index: section.order_index,
                })
                .select('id')
                .single();

              if (newSection && section.originalTempId) {
                sectionIdMap.set(section.originalTempId, newSection.id);
              }
            }
          }

          // Sincronizar state das seções de uma única vez (sem mutação direta)
          if (sectionIdMap.size > 0) {
            setSections(prev => prev.map(s =>
              sectionIdMap.has(s.id) ? { ...s, id: sectionIdMap.get(s.id)! } : s
            ));
          }

          // Remover seções que não existem mais no state local
          const currentSectionIds = sectionsToUpsert.filter(s => s.id).map(s => s.id);
          const sectionsToRemove = existingSectionIds.filter(id => !currentSectionIds.includes(id));

          if (sectionsToRemove.length > 0) {
            await supabase
              .from('campaign_sections')
              .delete()
              .in('id', sectionsToRemove);
          }
        }

        // ============================================================
        // PERGUNTAS — UPSERT com tradução de section_id e regras condicionais
        // ============================================================
        if (questions.length > 0) {
          console.log('🔄 Iniciando auto-save de', questions.length, 'perguntas...');

          // Helper: traduz qualquer ID de seção (local → UUID real, ou mantém UUID real)
          const resolveSectionId = (sid?: string | null): string | null => {
            if (!sid) return null;
            if (sectionIdMap.has(sid)) return sectionIdMap.get(sid)!;
            return isPersistedId(sid) ? sid : null;
          };

          // Helper: traduz target_section_id dentro das regras condicionais
          // Se a regra apontar para uma seção que acabou de ser persistida nesta
          // mesma rodada, atualiza para o UUID real. Caso contrário preserva
          // (regras antigas com UUIDs reais continuam funcionando).
          const resolveConditionalRules = (rules?: ConditionalRule[]): ConditionalRule[] =>
            (rules || []).map(r => ({
              ...r,
              target_section_id: sectionIdMap.get(r.target_section_id) ?? r.target_section_id,
            }));

          // Buscar perguntas existentes para identificar quais devem ser removidas
          const { data: existingQuestions } = await supabase
            .from('campaign_questions')
            .select('id, order_index')
            .eq('campaign_id', draftCampaignId);

          const existingQuestionIds = existingQuestions?.map(q => q.id) || [];
          console.log('📋 Perguntas existentes no banco:', existingQuestionIds.length);

          const validQuestions = questions;
          console.log('✅ Total de perguntas a processar:', validQuestions.length);

          const questionsToUpsert = validQuestions.map((q, index) => {
            // Mesclar config + conditional_logic (com rules traduzidas) + is_primary_nps
            const configWithConditional = {
              ...(q.config || {}),
              conditional_logic: {
                enabled: q.conditional_logic?.enabled ?? false,
                rules: resolveConditionalRules(q.conditional_logic?.rules),
              },
              is_primary_nps: q.is_primary_nps || false,
            };

            return {
              id: isPersistedId(q.id) ? q.id : undefined,
              campaign_id: draftCampaignId,
              title: q.title,
              description: q.description || null,
              question_type: q.question_type,
              required: q.required,
              order_index: index,
              config: configWithConditional as any,
              section_id: resolveSectionId(q.section_id),
              originalTempId: !isPersistedId(q.id) ? q.id : undefined,
            };
          });

          const newQuestionsToInsert = questionsToUpsert.filter(q => !q.id);
          console.log('➕ Novas perguntas para inserir:', newQuestionsToInsert.length);

          // Acumular atualizações de ID das perguntas para aplicar de uma vez no state
          const questionIdMap = new Map<string, string>();

          for (const question of questionsToUpsert) {
            if (question.id) {
              // UPDATE de pergunta existente
              const { error: updateError } = await supabase
                .from('campaign_questions')
                .update({
                  title: question.title,
                  description: question.description,
                  question_type: question.question_type as any,
                  required: question.required,
                  order_index: question.order_index,
                  config: question.config as any,
                  section_id: question.section_id,
                })
                .eq('id', question.id);

              if (updateError) {
                console.error('❌ Erro ao atualizar pergunta:', updateError);
              }
            } else {
              // INSERT de nova pergunta (ID local)
              const questionTitle = question.title || 'Nova pergunta';
              const { data: newQuestion, error: insertError } = await supabase
                .from('campaign_questions')
                .insert({
                  campaign_id: question.campaign_id!,
                  title: questionTitle,
                  description: question.description,
                  question_type: question.question_type as any,
                  required: question.required,
                  order_index: question.order_index,
                  config: question.config as any,
                  section_id: question.section_id,
                })
                .select('id')
                .single();

              if (insertError) {
                console.error('❌ Erro ao inserir pergunta:', insertError);
              } else if (newQuestion && question.originalTempId) {
                questionIdMap.set(question.originalTempId, newQuestion.id);
              }
            }
          }

          // Sincronizar state das perguntas:
          //   1. trocar IDs locais pelos UUIDs reais
          //   2. propagar tradução de section_id para perguntas que apontavam
          //      para seções recém-persistidas nesta mesma rodada
          if (questionIdMap.size > 0 || sectionIdMap.size > 0) {
            setQuestions(prev => prev.map(q => {
              const newId = questionIdMap.get(q.id) ?? q.id;
              const newSectionId = q.section_id && sectionIdMap.has(q.section_id)
                ? sectionIdMap.get(q.section_id)!
                : q.section_id;
              // Também propagar tradução nas regras condicionais do state local
              const newConditional = q.conditional_logic
                ? {
                    ...q.conditional_logic,
                    rules: (q.conditional_logic.rules || []).map(r => ({
                      ...r,
                      target_section_id:
                        sectionIdMap.get(r.target_section_id) ?? r.target_section_id,
                    })),
                  }
                : q.conditional_logic;
              return {
                ...q,
                id: newId,
                section_id: newSectionId,
                conditional_logic: newConditional,
              };
            }));
          }

          // Remover perguntas que não existem mais no state local
          const currentQuestionIds = questionsToUpsert.filter(q => q.id).map(q => q.id);
          const questionsToRemove = existingQuestionIds.filter(id => !currentQuestionIds.includes(id));

          if (questionsToRemove.length > 0) {
            console.log('🗑️ Removendo perguntas antigas:', questionsToRemove.length);
            await supabase
              .from('campaign_questions')
              .delete()
              .in('id', questionsToRemove);
          }
        } else {
          console.log('⚠️ Nenhuma pergunta para salvar');
        }
      } else {
        // Create new draft
        const { data: campaign, error } = await supabase
          .from('campaigns')
          .insert({
            name: data.name || 'Rascunho sem título',
            public_title: data.public_title || data.name || 'Pesquisa de Satisfação',
            description: data.description,
            type: data.type as any || 'email_batch',
            welcome_message: data.welcome_message || '',
            thank_you_message: data.thank_you_message || '',
            primary_color: data.primary_color || '#3B82F6',
            expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
            hospital_id: hospitalId,
            created_by: profile?.id as string,
            status: 'draft' as any,
            banner_url: bannerConfig.banner_url || null,
            banner_config: {
              position: bannerConfig.banner_position || 'none',
              height: bannerConfig.banner_height || 300,
            },
          } as any)
          .select()
          .single();

        if (error) throw error;
        setDraftCampaignId(campaign.id);
      }

      setSaveStatus('saved');
      console.log('Auto-save concluído com sucesso');
    } catch (error) {
      console.error('Erro no auto-save:', error);
      setSaveStatus('unsaved');
      
      // Show error toast to user
      toast({
        title: 'Erro no Salvamento Automático',
        description: 'Houve um problema ao salvar suas alterações. Por favor, salve manualmente.',
        variant: 'destructive',
      });
    }
  };

  // Load existing campaign data when editing
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!campaignId) return;

      setLoading(true);
      try {
        // Load campaign data
        const { data: campaign, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (error) {
          console.error('Erro ao carregar campanha:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os dados da campanha.',
            variant: 'destructive',
          });
          navigate(buildPath('/campaigns'));
          return;
        }

        // Set draft campaign ID for auto-save
        setDraftCampaignId(campaign.id);

        // Populate form with campaign data
        form.reset({
          name: campaign.name || '',
          public_title: campaign.public_title || '',
          description: campaign.description || '',
          type: campaign.type,
          welcome_message: campaign.welcome_message || '',
          thank_you_message: campaign.thank_you_message || '',
          primary_color: campaign.primary_color || '#3B82F6',
          expires_at: campaign.expires_at ? new Date(campaign.expires_at).toISOString().split('T')[0] : '',
          banner_url: campaign.banner_url || '',
        });

        // Set banner configuration from persisted banner_config
        const savedBannerConfig = (campaign as any).banner_config;
        if (savedBannerConfig || campaign.banner_url) {
          setBannerConfig({
            banner_position: savedBannerConfig?.position || (campaign.banner_url ? 'first_section' : 'none'),
            banner_url: campaign.banner_url || undefined,
            banner_height: savedBannerConfig?.height || undefined,
          });
        }

        // Load campaign sections
        const { data: campaignSections, error: sectionsError } = await supabase
          .from('campaign_sections')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('order_index');

        if (sectionsError) {
          console.error('Erro ao carregar seções:', sectionsError);
        } else {
          const loadedSections: Section[] = campaignSections.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description || '',
            order_index: s.order_index,
          }));
          setSections(loadedSections);
        }

        // Load campaign questions
        const { data: campaignQuestions, error: questionsError } = await supabase
          .from('campaign_questions')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('order_index');

        if (questionsError) {
          console.error('Erro ao carregar questões:', questionsError);
        } else {
          const loadedQuestions: Question[] = campaignQuestions.map((q) => {
            const config = (typeof q.config === 'object' && q.config !== null) ? q.config as Record<string, any> : {};
            
            // Extrair conditional_logic e is_primary_nps do config se existir
            const { conditional_logic, is_primary_nps, ...restConfig } = config;
            
            return {
              id: q.id,
              title: q.title,
              description: q.description || '',
              question_type: q.question_type,
              required: q.required,
              order_index: q.order_index,
              config: restConfig,
              section_id: q.section_id || undefined,
              is_primary_nps: is_primary_nps || false,
              conditional_logic: conditional_logic || { enabled: false, rules: [] },
            };
          });
          setQuestions(loadedQuestions);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da campanha:', error);
        toast({
          title: 'Erro',
          description: 'Erro inesperado ao carregar a campanha.',
          variant: 'destructive',
        });
        navigate(buildPath('/campaigns'));
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [campaignId]);

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus('unsaved');
      
      saveTimeoutRef.current = setTimeout(() => {
        autoSave(data);
      }, 1000); // Reduced to 1 second for faster auto-save
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form.watch, draftCampaignId, bannerConfig, questions]);

  // Auto-save when questions, sections, or banner changes
  useEffect(() => {
    if (draftCampaignId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      setSaveStatus('unsaved');
      saveTimeoutRef.current = setTimeout(() => {
        const formData = form.getValues();
        autoSave(formData, true);
      }, 500); // Reduced to 500ms for faster auto-save
    }
  }, [questions, sections, bannerConfig, draftCampaignId]);

  const publishCampaign = async (data: CampaignFormData) => {
    const hospitalId = getHospitalId();
    
    if (!hospitalId) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o hospital.',
        variant: 'destructive',
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos uma pergunta à campanha.',
        variant: 'destructive',
      });
      return;
    }

    // Validate that if there are sections, all questions must have a section
    if (sections.length > 0) {
      const questionsWithoutSection = questions.filter(q => !q.section_id);
      if (questionsWithoutSection.length > 0) {
        toast({
          title: 'Erro',
          description: `Todas as perguntas devem ter uma seção definida. ${questionsWithoutSection.length} pergunta(s) sem seção.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Força um auto-save completo antes de publicar
      console.log('Salvando antes de publicar...');
      await autoSave(data, true);
      
      // Aguarda um pouco para garantir que o auto-save foi processado
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verifica se há perguntas válidas antes de publicar
      const questionsWithTitles = questions.filter(q => q.title && q.title.trim() !== '');
      if (questionsWithTitles.length === 0) {
        toast({
          title: 'Campanha Incompleta',
          description: 'Adicione pelo menos uma pergunta antes de publicar a campanha.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // ============================================================
      // SANITIZAÇÃO FINAL no publish: remove opções vazias do
      // multiple_choice antes de marcar a campanha como 'active'.
      // Defesa em profundidade: o respondente nunca vê botões vazios
      // mesmo se o admin esqueceu opções em branco no rascunho.
      // ============================================================
      if (draftCampaignId) {
        const multipleChoiceQuestions = questions.filter(
          q => q.question_type === 'multiple_choice' && isPersistedId(q.id)
        );
        for (const q of multipleChoiceQuestions) {
          const cleaned = sanitizeMultipleChoiceOptions(q.config?.options);
          // Só faz UPDATE se houver diferença real (evita writes desnecessários)
          if (JSON.stringify(cleaned) !== JSON.stringify(q.config?.options ?? [])) {
            const sanitizedConfig = {
              ...(q.config || {}),
              options: cleaned,
              conditional_logic: q.conditional_logic || { enabled: false, rules: [] },
              is_primary_nps: q.is_primary_nps || false,
            };
            await supabase
              .from('campaign_questions')
              .update({ config: sanitizedConfig as any })
              .eq('id', q.id);
          }
        }
      }

      // After autoSave, if draftCampaignId was set, we update it.
      // If it wasn't set, we can't reliably get the new ID without refactoring autoSave.
      // We will assume autoSave has created it and the user needs to try again or we can query it.
      // To bypass the lint error, we remove the constant condition block.
      
      let activeCampaignId = draftCampaignId;
      
      if (!activeCampaignId) {
        // Try to fetch the latest draft created by this user
        const { data: latestDraft } = await supabase
          .from('campaigns')
          .select('id')
          .eq('created_by', profile?.id as string)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();          
        if (latestDraft) {
          activeCampaignId = latestDraft.id;
        }
      }

      if (activeCampaignId) {
        const { error } = await supabase
          .from('campaigns')
          .update({
            name: data.name,
            public_title: data.public_title,
            description: data.description,
            type: data.type as any,
            welcome_message: data.welcome_message,
            thank_you_message: data.thank_you_message,
            primary_color: data.primary_color,
            expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
            status: 'active' as any,
            banner_url: bannerConfig.banner_url || null,
          })
          .eq('id', activeCampaignId);

        if (error) throw error;
      } else {
        throw new Error('Não foi possível publicar a campanha. Salve como rascunho primeiro.');
      }

      toast({
        title: 'Sucesso!',
        description: 'Campanha publicada com sucesso.',
      });

      navigate(buildPath('/campaigns'));
    } catch (error: unknown) {
      console.error('Erro ao publicar campanha:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao publicar campanha. Tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: CampaignFormData) => {
    publishCampaign(data);
  };

  const getCampaignTypeLabel = (type: string) => {
    const types = {
      email_batch: 'Email em Lote',
      sms_batch: 'SMS em Lote',
      whatsapp_batch: 'WhatsApp em Lote',
      public_link: 'Link Público',
      integration_flow: 'Fluxo de Integração',
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/campaigns'))}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Campanha NPS</h1>
            <p className="text-muted-foreground">
              Configure uma nova campanha para coletar feedback dos pacientes
            </p>
          </div>
        </div>
        
        {/* Save Status Indicator */}
        <div className="flex items-center gap-3 text-sm">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
              <Clock className="h-4 w-4 animate-spin" />
              <span className="font-medium">Salvando...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">✅ Salvo automaticamente</span>
            </div>
          )}
          {saveStatus === 'unsaved' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
              <Save className="h-4 w-4" />
              <span className="font-medium">⚠️ Alterações não salvas</span>
            </div>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Configurações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Básicas</CardTitle>
              <CardDescription>
                Configure as informações principais da campanha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Interno da Campanha *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: NPS Q4 2024 - Hospital Central" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        Nome usado internamente na plataforma para identificar a campanha
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="public_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Público do Formulário *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pesquisa de Satisfação" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        Título que aparecerá no cabeçalho do formulário público
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Campanha *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email_batch">Email em Lote</SelectItem>
                          <SelectItem value="sms_batch">SMS em Lote</SelectItem>
                          <SelectItem value="whatsapp_batch">WhatsApp em Lote</SelectItem>
                          <SelectItem value="public_link">Link Público</SelectItem>
                          <SelectItem value="integration_flow">Fluxo de Integração</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Interna</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição interna da campanha (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Principal</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" className="w-20 h-10 p-1" {...field} />
                        </FormControl>
                        <FormControl>
                          <Input placeholder="#3B82F6" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Expiração</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle>Mensagens</CardTitle>
              <CardDescription>
                Configure as mensagens que aparecerão na pesquisa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="welcome_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Boas-vindas *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mensagem que aparece no início da pesquisa..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thank_you_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Agradecimento *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mensagem que aparece após o envio da pesquisa..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Configuração Avançada com Abas */}
          <Tabs defaultValue="questions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="questions">Perguntas</TabsTrigger>
              <TabsTrigger value="sections">Seções</TabsTrigger>
              <TabsTrigger value="banner">Banner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="space-y-6">
              {/* Perguntas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Perguntas da Campanha</CardTitle>
                      <CardDescription>
                        Configure as perguntas que serão feitas aos respondentes.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <QuickSectionCreator 
                        onCreateSection={(title) => {
                          const newSection: Section = {
                            id: `section-${Date.now()}`,
                            title,
                            order_index: sections.length,
                          };
                          setSections([...sections, newSection]);
                          return newSection.id;
                        }}
                        sections={sections}
                      />
                      <Button type="button" onClick={addQuestion} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Pergunta
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Seções Visual Overview */}
                  {sections.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Seções do Formulário</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sections
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((section, index) => (
                            <Badge key={section.id} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                              {index + 1}. {section.title}
                            </Badge>
                          ))}
                      </div>
                       <div className="text-xs text-blue-600 mt-2">
                         💡 As perguntas serão organizadas por seção na ordem definida.
                       </div>
                    </div>
                  )}

                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma pergunta adicionada ainda.</p>
                      <p className="text-sm">Clique em "Adicionar Pergunta" para começar.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <QuestionBuilder
                          key={question.id}
                          question={question}
                          index={index}
                          sections={sections}
                          questions={questions}
                          onUpdate={updateQuestion}
                          onRemove={removeQuestion}
                          onMarkAsPrimaryNPS={markAsPrimaryNPS}
                        />
                      ))}
                    </div>
                  )}

                  {/* Botões de Ação no Final */}
                  {questions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
                      <div className="flex items-center justify-center gap-3">
                        <QuickSectionCreator 
                          onCreateSection={(title) => {
                            const newSection: Section = {
                              id: `section-${Date.now()}`,
                              title,
                              order_index: sections.length,
                            };
                            setSections([...sections, newSection]);
                            return newSection.id;
                          }}
                          sections={sections}
                        />
                        <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Pergunta
                        </Button>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          Adicione mais perguntas ou crie seções para organizar seu formulário
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-6">
              <SectionManager
                sections={sections}
                onUpdate={setSections}
              />
            </TabsContent>

            <TabsContent value="banner" className="space-y-6">
              <BannerUpload
                config={bannerConfig}
                onUpdate={setBannerConfig}
              />
            </TabsContent>
          </Tabs>

          {/* Ações */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {draftCampaignId ? 'Rascunho salvo automaticamente' : 'Use "Salvar Rascunho" para salvar seu progresso'}
            </div>
            <div className="flex items-center gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(buildPath('/campaigns'))}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => autoSave(form.getValues(), true)}
                disabled={loading || saveStatus === 'saving'}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button type="submit" disabled={loading || questions.length === 0 || (sections.length > 0 && questions.some(q => !q.section_id))}>
                {loading ? 'Publicando...' : 'Publicar Campanha'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}