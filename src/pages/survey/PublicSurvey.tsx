import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { publicSupabase as supabase } from '@/integrations/supabase/public-client'
import { useToast } from '@/hooks/use-toast'
import { getNPSButtonClasses } from '@/lib/nps-color-profiles'

interface BannerConfigData {
  position: 'first_section' | 'top_first_section' | 'top_all_sections' | 'none'
  height?: number
}

interface Campaign {
  id: string
  name: string
  public_title?: string
  description: string | null
  welcome_message: string | null
  thank_you_message: string | null
  primary_color: string | null
  status: string
  hospital_id: string
  expires_at: string | null
  banner_url: string | null
  banner_config: BannerConfigData | null
}

interface Question {
  id: string
  title: string
  description: string | null
  question_type: string
  required: boolean | null
  order_index: number
  config: any
  section_id?: string | null
}

interface Section {
  id: string
  title: string
  description: string | null
  order_index: number
  questions: Question[]
}

interface Response {
  questionId: string
  value: any
}

export default function PublicSurvey() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { toast } = useToast()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [npsScore, setNpsScore] = useState<number | null>(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId])

  // Atualizar título da página quando a campanha for carregada
  useEffect(() => {
    if (campaign) {
      const pageTitle = `${campaign.public_title || campaign.name} - Powered by Plataforma NPS Exímio`
      document.title = pageTitle
    }

    // Limpeza ao desmontar o componente
    return () => {
      document.title = 'Plataforma NPS Exímio'
    }
  }, [campaign])

  const fetchCampaignData = async () => {
    try {
      setLoading(true)

      // Buscar dados da campanha
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('status', 'active')
        .maybeSingle()

      if (campaignError) {
        throw campaignError
      }

      if (!campaignData) {
        throw new Error('Esta pesquisa não existe ou não está mais disponível.')
      }

      // Verificar se a campanha não expirou
      if (campaignData.expires_at && new Date(campaignData.expires_at) < new Date()) {
        throw new Error('Esta pesquisa já expirou.')
      }

      setCampaign(campaignData as unknown as Campaign)

      // Buscar seções e perguntas da campanha
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('campaign_sections')
        .select(`
          id,
          title,
          description,
          order_index,
          campaign_questions (
            id,
            title,
            description,
            question_type,
            required,
            order_index,
            config,
            section_id
          )
        `)
        .eq('campaign_id', campaignId)
        .order('order_index')

      if (sectionsError) throw sectionsError

      // Buscar perguntas sem seção
      const { data: questionsWithoutSection, error: questionsError } = await supabase
        .from('campaign_questions')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('active', true)
        .is('section_id', null)
        .order('order_index')

      if (questionsError) throw questionsError

      // Organizar seções com suas perguntas
      const organizedSections: Section[] = []

      // Adicionar seção para perguntas sem seção, se existirem
      if (questionsWithoutSection && questionsWithoutSection.length > 0) {
        organizedSections.push({
          id: 'no-section',
          title: 'Pesquisa',
          description: null,
          order_index: -1,
          questions: questionsWithoutSection,
        })
      }

      // Adicionar seções com perguntas
      if (sectionsData) {
        sectionsData.forEach((section: any) => {
          organizedSections.push({
            id: section.id,
            title: section.title,
            description: section.description,
            order_index: section.order_index,
            questions: (section.campaign_questions || []).sort(
              (a: any, b: any) => a.order_index - b.order_index,
            ),
          })
        })
      }

      // Ordenar seções por order_index
      organizedSections.sort((a, b) => a.order_index - b.order_index)

      console.log(
        '📚 Seções carregadas:',
        organizedSections.map((s) => ({
          title: s.title,
          questions: s.questions.map((q) => ({
            title: q.title,
            type: q.question_type,
            config: q.config,
            is_primary_nps: q.config?.is_primary_nps,
          })),
        })),
      )

      setSections(organizedSections)

      // Inicializar respostas vazias para todas as perguntas de todas as seções
      const allQuestions = organizedSections.flatMap((section) => section.questions)
      setResponses(
        allQuestions.map((q) => ({
          questionId: q.id,
          value: null,
        })),
      )
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar pesquisa',
        description: error.message || 'Esta pesquisa não está disponível no momento.',
        variant: 'destructive',
      })
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const updateResponse = (questionId: string, value: any) => {
    setResponses((prev) => prev.map((r) => (r.questionId === questionId ? { ...r, value } : r)))

    // Se for uma pergunta NPS PRINCIPAL, armazenar o score
    const question = sections.flatMap((s) => s.questions).find((q) => q.id === questionId)

    console.log('🔍 Resposta atualizada:', {
      questionId,
      value,
      questionType: question?.question_type,
      isPrimary: question?.config?.is_primary_nps,
      questionTitle: question?.title,
    })

    if (question?.question_type === 'nps_scale' && question.config?.is_primary_nps === true) {
      console.log('✅ Atualizando NPS Score para:', value)
      setNpsScore(value)
    }

    // Se for resposta para pergunta contextual, adicionar/atualizar na lista de respostas
    if (questionId.includes('_contextual')) {
      const baseQuestionId = questionId.replace('_contextual', '')
      setResponses((prev) => {
        const existingIndex = prev.findIndex((r) => r.questionId === questionId)
        if (existingIndex >= 0) {
          return prev.map((r) => (r.questionId === questionId ? { ...r, value } : r))
        } else {
          return [...prev, { questionId, value }]
        }
      })
    }
  }

  // Verificar se deve mostrar pergunta contextual baseada na pontuação NPS
  const shouldShowFollowUpQuestion = (question: Question, response: Response | undefined) => {
    if (question?.question_type !== 'nps_scale') return false

    if (response?.value === null || response?.value === undefined) return false

    // Verificar se há perguntas contextuais configuradas
    const config = question.config
    return !!(config?.detractor_question || config?.neutral_question || config?.promoter_question)
  }

  const getFollowUpQuestion = (question: Question, response: Response | undefined) => {
    if (!question || response?.value === null || response?.value === undefined) {
      return null
    }

    const score = response.value
    const config = question.config

    let contextualQuestion = ''

    if (score <= 6 && config?.detractor_question) {
      contextualQuestion = config.detractor_question
    } else if (score <= 8 && config?.neutral_question) {
      contextualQuestion = config.neutral_question
    } else if (score >= 9 && config?.promoter_question) {
      contextualQuestion = config.promoter_question
    }

    // Retornar um objeto simulando uma pergunta para ser compatível com o renderQuestion
    return contextualQuestion
      ? {
          id: `${question.id}_contextual`,
          title: contextualQuestion,
          description: null,
          question_type: 'text',
          required: false,
          order_index: -1,
          config: {},
        }
      : null
  }

  const getCurrentSection = () => sections[currentSectionIndex]
  const getCurrentResponse = (questionId: string) =>
    responses.find((r) => r.questionId === questionId)

  const canProceed = () => {
    const currentSection = getCurrentSection()
    if (!currentSection || !currentSection.questions) return false

    // Verificar se todas as perguntas obrigatórias da seção foram respondidas
    for (const question of currentSection.questions) {
      const response = getCurrentResponse(question.id)
      if (question.required && !response?.value && response?.value !== 0) {
        return false
      }

      // Se está mostrando pergunta contextual e ela é obrigatória, verificar se foi respondida
      if (shouldShowFollowUpQuestion(question, response)) {
        const followUpQuestion = getFollowUpQuestion(question, response)
        if (followUpQuestion?.required) {
          const contextualResponse = responses.find((r) => r.questionId === followUpQuestion.id)
          if (!contextualResponse?.value) {
            return false
          }
        }
      }
    }

    return true
  }

  const nextSection = () => {
    // Verificar se há lógica condicional nas respostas da seção atual
    const currentSection = getCurrentSection()
    if (!currentSection) return

    // Procurar por perguntas com lógica condicional ativada
    for (const question of currentSection.questions) {
      if (question.question_type === 'multiple_choice') {
        const conditionalLogic = question.config?.conditional_logic

        if (conditionalLogic?.enabled && conditionalLogic?.rules?.length > 0) {
          const response = getCurrentResponse(question.id)
          const selectedValue = response?.value

          // Verificar se há regra aplicável para a resposta selecionada
          const applicableRule = conditionalLogic.rules.find(
            (rule: any) => rule.option_value === selectedValue,
          )

          if (applicableRule) {
            if (applicableRule.action === 'skip_to_end') {
              // Pular para submissão
              submitSurvey()
              return
            } else if (
              applicableRule.action === 'go_to_section' &&
              applicableRule.target_section_id
            ) {
              // Ir para seção específica
              const targetSectionIndex = sections.findIndex(
                (s) => s.id === applicableRule.target_section_id,
              )
              if (targetSectionIndex !== -1) {
                setCurrentSectionIndex(targetSectionIndex)
                return
              }
            }
          }
        }
      }
    }

    // Navegação padrão (sequencial)
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    } else {
      submitSurvey()
    }
  }

  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  // Função para substituir valores dinâmicos no texto
  const replaceDynamicValues = (text: string) => {
    return text.replace(/\{\{VALUE_Q(\d+)\}\}/g, (match, questionNumber) => {
      // Q1 = order_index 0, Q2 = order_index 1, etc.
      const targetOrderIndex = parseInt(questionNumber) - 1
      const allQuestions = sections.flatMap((s) => s.questions)
      const targetQuestion = allQuestions.find((q) => q.order_index === targetOrderIndex)

      if (targetQuestion) {
        const response = responses.find((r) => r.questionId === targetQuestion.id)
        if (response?.value !== undefined && response?.value !== null) {
          return response.value
        }
      }

      return match // Retorna o placeholder original se não encontrar o valor
    })
  }

  const submitSurvey = async () => {
    if (!campaign) return

    setSubmitting(true)
    try {
      // Gerar ID único para a resposta (UUID v4)
      const responseId = crypto.randomUUID()

      console.log('📊 Enviando pesquisa com NPS Score:', npsScore)
      console.log('📋 Todas as respostas:', responses)

      // Usar RPC function para inserir resposta NPS (evita erro 401)
      const { data: npsSuccess, error: npsError } = await supabase.rpc(
        'insert_public_nps_response',
        {
          p_id: responseId,
          p_campaign_id: campaign.id,
          p_nps_score: npsScore || 5,
        },
      )

      if (npsError || !npsSuccess) {
        throw npsError || new Error('Falha ao salvar resposta NPS')
      }

      console.log('✅ Resposta NPS salva com sucesso')

      // Preparar respostas das perguntas
      const validResponses = responses
        .filter((r) => r.value !== null && r.value !== undefined && r.value !== '')
        .map((r) => ({
          nps_response_id: responseId,
          question_id: r.questionId.includes('_contextual')
            ? r.questionId.replace('_contextual', '')
            : r.questionId,
          response_value: r.value,
        }))

      // Usar RPC function para inserir respostas das perguntas
      if (validResponses.length > 0) {
        const { data: questionsSuccess, error: questionsError } = await supabase.rpc(
          'insert_public_question_responses',
          {
            p_responses: validResponses,
          },
        )

        if (questionsError || !questionsSuccess) {
          throw questionsError || new Error('Falha ao salvar respostas das perguntas')
        }
      }

      setCompleted(true)
      toast({
        title: 'Obrigado!',
        description: 'Sua resposta foi enviada com sucesso.',
      })
    } catch (error: any) {
      console.error('Erro ao enviar pesquisa:', error)
      toast({
        title: 'Erro ao enviar',
        description: error?.message || 'Não foi possível enviar sua resposta. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const currentResponse = getCurrentResponse(question.id)

    switch (question.question_type) {
      case 'nps_scale': {
        // Perfil de cores configurável por pergunta (fallback: traffic_light)
        const colorProfile = question.config?.nps_color_profile ?? 'traffic_light'

        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Em uma escala de 0 a 10, o quanto você recomendaria nossos serviços?
              </p>
              <div className="grid grid-cols-11 gap-2 max-w-2xl mx-auto">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => updateResponse(question.id, i)}
                    className={`
                      w-12 h-12 rounded-lg border-2 font-medium transition-all duration-200 transform hover:scale-105
                      ${getNPSButtonClasses(i, currentResponse?.value === i, colorProfile)}
                    `}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2 max-w-2xl mx-auto">
                <span>Muito improvável</span>
                <span>Muito provável</span>
              </div>
            </div>
          </div>
        )
      }

      case 'text':
        const inputType = question.config?.input_type || 'textarea'

        if (inputType === 'input') {
          return (
            <Input
              value={currentResponse?.value || ''}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="Digite sua resposta..."
              maxLength={question.config?.max_length}
            />
          )
        }

        return (
          <Textarea
            value={currentResponse?.value || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={4}
            maxLength={question.config?.max_length}
          />
        )

      case 'rating': {
        const ratingConfig = question.config || {}
        const maxRating = ratingConfig.max_rating || 5
        const isLikertMode =
          ratingConfig.display_mode === 'likert' && Array.isArray(ratingConfig.items)

        // --- Modo Likert (matriz) ---
        if (isLikertMode) {
          const likertItems: string[] = ratingConfig.items
          const scaleLabels: string[] = ratingConfig.scale_labels || []
          const likertStyle: string = ratingConfig.likert_style || 'radio'

          // Respostas armazenadas como objeto { item_0: 3, item_1: 5, ... }
          const likertValues: Record<string, number> =
            currentResponse?.value && typeof currentResponse.value === 'object'
              ? currentResponse.value
              : {}

          /** Atualiza a nota de um item específico */
          const setItemRating = (itemIndex: number, rating: number) => {
            const updated = { ...likertValues, [`item_${itemIndex}`]: rating }
            updateResponse(question.id, updated)
          }

          if (likertStyle === 'stars') {
            // --- Estrelas por item ---
            return (
              <div className="space-y-4">
                {likertItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm font-medium min-w-[140px]">{item}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: maxRating }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setItemRating(idx, i + 1)}
                          className="p-1"
                          title={scaleLabels[i] || `${i + 1}`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              (likertValues[`item_${idx}`] || 0) > i
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {scaleLabels.length > 0 && likertValues[`item_${idx}`] && (
                      <span className="text-xs text-muted-foreground">
                        {scaleLabels[(likertValues[`item_${idx}`] || 1) - 1] || ''}
                      </span>
                    )}
                  </div>
                ))}
                {/* Legenda da escala */}
                {scaleLabels.some((l) => l.trim()) && (
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
                    {scaleLabels.map(
                      (label, i) =>
                        label.trim() && (
                          <span key={i}>
                            {i + 1} = {label}
                          </span>
                        ),
                    )}
                  </div>
                )}
              </div>
            )
          }

          // --- Radio buttons em tabela (padrão) ---
          return (
            <div className="space-y-4">
              {/* Desktop: tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 min-w-[160px]"></th>
                      {Array.from({ length: maxRating }, (_, i) => (
                        <th key={i} className="p-2 text-center min-w-[60px]">
                          <div className="font-medium">{i + 1}</div>
                          {scaleLabels[i] && (
                            <div className="text-xs text-muted-foreground font-normal">
                              {scaleLabels[i]}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {likertItems.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="p-2 font-medium">{item}</td>
                        {Array.from({ length: maxRating }, (_, i) => (
                          <td key={i} className="p-2 text-center">
                            <input
                              type="radio"
                              name={`${question.id}-item-${idx}`}
                              checked={likertValues[`item_${idx}`] === i + 1}
                              onChange={() => setItemRating(idx, i + 1)}
                              className="h-4 w-4 accent-primary cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: empilhamento vertical */}
              <div className="md:hidden space-y-4">
                {likertItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <p className="font-medium text-sm mb-2">{item}</p>
                    <RadioGroup
                      value={likertValues[`item_${idx}`]?.toString() || ''}
                      onValueChange={(val) => setItemRating(idx, parseInt(val))}
                      className="flex flex-wrap gap-3"
                    >
                      {Array.from({ length: maxRating }, (_, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <RadioGroupItem
                            value={(i + 1).toString()}
                            id={`${question.id}-m-${idx}-${i}`}
                          />
                          <Label htmlFor={`${question.id}-m-${idx}-${i}`} className="text-xs">
                            {scaleLabels[i] || (i + 1).toString()}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // --- Modo padrão: estrelas simples (comportamento original, inalterado) ---
        return (
          <div className="flex justify-center gap-2">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => updateResponse(question.id, i + 1)}
                className="p-2"
              >
                <Star
                  className={`h-8 w-8 ${
                    (currentResponse?.value || 0) > i
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        )
      }

      case 'multiple_choice':
        const isMultipleChoice = question.config?.allow_multiple !== false
        const allowOther = question.config?.allow_other !== false
        // Filtro defensivo: garante que opções vazias (resíduo de edição
        // intermediária no admin) nunca sejam exibidas ao respondente.
        const options = ((question.config?.options as unknown[]) || []).filter(
          (opt): opt is string => typeof opt === 'string' && opt.trim().length > 0,
        )

        if (isMultipleChoice) {
          // Para múltipla escolha, usar checkboxes
          return (
            <div className="space-y-3">
              {options.map((option: string, index: number) => {
                const isChecked = Array.isArray(currentResponse?.value)
                  ? currentResponse.value.includes(option)
                  : currentResponse?.value === option

                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${question.id}-${index}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentValue = Array.isArray(currentResponse?.value)
                          ? currentResponse.value
                          : []

                        if (checked) {
                          updateResponse(question.id, [...currentValue, option])
                        } else {
                          updateResponse(
                            question.id,
                            currentValue.filter((v: string) => v !== option),
                          )
                        }
                      }}
                    />
                    <Label htmlFor={`${question.id}-${index}`} className="text-sm">
                      {option}
                    </Label>
                  </div>
                )
              })}

              {/* Opção "Outro(a)" para múltipla escolha */}
              {allowOther && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${question.id}-other`}
                      checked={
                        Array.isArray(currentResponse?.value) &&
                        currentResponse.value.some((v: any) => typeof v === 'object' && v.other)
                      }
                      onCheckedChange={(checked) => {
                        const currentValue = Array.isArray(currentResponse?.value)
                          ? currentResponse.value
                          : []

                        if (checked) {
                          updateResponse(question.id, [
                            ...currentValue.filter((v: any) => !(typeof v === 'object' && v.other)),
                            { other: '' },
                          ])
                        } else {
                          updateResponse(
                            question.id,
                            currentValue.filter((v: any) => !(typeof v === 'object' && v.other)),
                          )
                        }
                      }}
                    />
                    <Label htmlFor={`${question.id}-other`} className="text-sm font-medium">
                      Outro(a)
                    </Label>
                  </div>

                  {/* Campo de texto para "Outro(a)" */}
                  {Array.isArray(currentResponse?.value) &&
                    currentResponse.value.some(
                      (v: any) => typeof v === 'object' && v.other !== undefined,
                    ) && (
                      <Input
                        placeholder="Especifique..."
                        value={
                          currentResponse.value.find(
                            (v: any) => typeof v === 'object' && v.other !== undefined,
                          )?.other || ''
                        }
                        onChange={(e) => {
                          const currentValue = Array.isArray(currentResponse?.value)
                            ? currentResponse.value
                            : []

                          const otherIndex = currentValue.findIndex(
                            (v: any) => typeof v === 'object' && v.other !== undefined,
                          )
                          if (otherIndex >= 0) {
                            const newValue = [...currentValue]
                            newValue[otherIndex] = { other: e.target.value }
                            updateResponse(question.id, newValue)
                          }
                        }}
                        className="mt-2"
                      />
                    )}
                </div>
              )}
            </div>
          )
        } else {
          // Para escolha única, usar radio buttons
          return (
            <RadioGroup
              value={
                typeof currentResponse?.value === 'object' &&
                currentResponse.value?.other !== undefined
                  ? 'other'
                  : currentResponse?.value || ''
              }
              onValueChange={(value) => {
                if (value === 'other') {
                  updateResponse(question.id, { other: '' })
                } else {
                  updateResponse(question.id, value)
                }
              }}
            >
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                </div>
              ))}

              {/* Opção "Outro(a)" para escolha única */}
              {allowOther && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id={`${question.id}-other`} />
                    <Label htmlFor={`${question.id}-other`} className="font-medium">
                      Outro(a)
                    </Label>
                  </div>

                  {/* Campo de texto para "Outro(a)" */}
                  {typeof currentResponse?.value === 'object' &&
                    currentResponse.value?.other !== undefined && (
                      <Input
                        placeholder="Especifique..."
                        value={currentResponse.value.other || ''}
                        onChange={(e) => updateResponse(question.id, { other: e.target.value })}
                        className="mt-2"
                      />
                    )}
                </div>
              )}
            </RadioGroup>
          )
        }

      default:
        return (
          <Input
            value={currentResponse?.value || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando pesquisa...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Pesquisa não encontrada</h2>
            <p className="text-muted-foreground">
              Esta pesquisa não existe ou não está mais disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Obrigado!</h2>
            <p className="text-muted-foreground mb-4">
              {campaign.thank_you_message ||
                'Sua resposta foi enviada com sucesso. Agradecemos pelo seu feedback!'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentSection = getCurrentSection()
  const progress = ((currentSectionIndex + 1) / sections.length) * 100

  // Determina se o banner deve ser exibido na seção atual
  const bannerConfig = campaign.banner_config
  const bannerUrl = campaign.banner_url
  const bannerHeight = bannerConfig?.height || 300
  const showBanner = bannerUrl && bannerConfig && bannerConfig.position !== 'none'

  /** Renderiza a imagem do banner */
  const renderBannerImage = () => (
    <img
      src={bannerUrl!}
      alt="Banner da pesquisa"
      className="w-full h-auto rounded-lg"
      style={{
        maxHeight: bannerHeight ? `${bannerHeight}px` : undefined,
        objectFit: bannerHeight ? 'cover' : undefined,
      }}
    />
  )

  // Banner como seção independente: exibir antes da primeira seção
  const showBannerAsSection =
    showBanner && bannerConfig.position === 'first_section' && currentSectionIndex === 0
  // Banner no topo da primeira seção
  const showBannerTopFirst =
    showBanner && bannerConfig.position === 'top_first_section' && currentSectionIndex === 0
  // Banner no topo de todas as seções
  const showBannerTopAll = showBanner && bannerConfig.position === 'top_all_sections'

  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundColor: campaign.primary_color ? `${campaign.primary_color}10` : undefined,
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{campaign.public_title || campaign.name}</CardTitle>
            {currentSectionIndex === 0 && campaign.welcome_message && (
              <CardDescription className="text-base">{campaign.welcome_message}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Banner como seção independente */}
        {showBannerAsSection && (
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">{renderBannerImage()}</CardContent>
          </Card>
        )}

        {/* Seção atual */}
        {currentSection && (
          <Card>
            {/* Banner no topo da seção (primeira ou todas) */}
            {(showBannerTopFirst || showBannerTopAll) && (
              <div className="overflow-hidden rounded-t-lg">{renderBannerImage()}</div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentSection.title}</CardTitle>
                  {currentSection.description && (
                    <CardDescription className="mt-1">{currentSection.description}</CardDescription>
                  )}
                </div>
                <Badge variant="outline">
                  Seção {currentSectionIndex + 1} de {sections.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {currentSection.questions.map((question, questionIndex) => (
                <div key={question.id} className="space-y-4">
                  {questionIndex > 0 && <div className="border-t pt-6" />}

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">
                      {replaceDynamicValues(question.title)}
                      {question.required && <span className="text-destructive ml-1">*</span>}
                    </h3>
                    {question.description && (
                      <p className="text-sm text-muted-foreground">
                        {replaceDynamicValues(question.description)}
                      </p>
                    )}
                  </div>

                  {renderQuestion(question)}

                  {/* Pergunta contextual dinâmica após NPS */}
                  {shouldShowFollowUpQuestion(question, getCurrentResponse(question.id)) && (
                    <div className="mt-6 pt-4 border-t border-dashed">
                      <div className="mb-4">
                        <h4 className="text-base font-medium">
                          {replaceDynamicValues(
                            getFollowUpQuestion(question, getCurrentResponse(question.id))?.title ||
                              '',
                          )}
                        </h4>
                      </div>
                      {getFollowUpQuestion(question, getCurrentResponse(question.id)) &&
                        renderQuestion(
                          getFollowUpQuestion(question, getCurrentResponse(question.id))!,
                        )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={prevSection} disabled={currentSectionIndex === 0}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-32" />
                <span className="text-sm text-muted-foreground">
                  {currentSectionIndex + 1} de {sections.length}
                </span>
              </div>

              <Button
                onClick={nextSection}
                disabled={!canProceed() || submitting}
                style={{
                  backgroundColor: campaign.primary_color || undefined,
                }}
              >
                {currentSectionIndex === sections.length - 1 ? (
                  submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    'Finalizar'
                  )
                ) : (
                  <>
                    Próxima Seção
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
