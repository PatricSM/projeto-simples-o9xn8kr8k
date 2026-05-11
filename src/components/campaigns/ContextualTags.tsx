import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tags, Copy, Check } from 'lucide-react';
import { Question } from './QuestionBuilder';

interface ContextualTagsProps {
  questions: Question[];
  currentQuestionIndex: number;
  onInsertTag: (tag: string) => void;
}

export default function ContextualTags({ 
  questions, 
  currentQuestionIndex, 
  onInsertTag 
}: ContextualTagsProps) {
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Filtra apenas perguntas anteriores que podem ser referenciadas
  const availableQuestions = questions
    .slice(0, currentQuestionIndex)
    .filter(q => ['nps_scale', 'rating', 'multiple_choice'].includes(q.question_type));

  const generateTag = (question: Question, type: 'value' | 'text' = 'value') => {
    const questionNumber = questions.findIndex(q => q.id === question.id) + 1;
    const prefix = type === 'text' ? 'TEXT' : 'VALUE';
    return `{{${prefix}_Q${questionNumber}}}`;
  };

  const getTagDescription = (question: Question, type: 'value' | 'text' = 'value') => {
    const descriptions = {
      nps_scale: type === 'value' ? 'Nota do NPS (0-10)' : 'Classificação (Detrator/Neutro/Promotor)',
      rating: type === 'value' ? 'Número de estrelas' : 'Texto da avaliação',
      multiple_choice: type === 'value' ? 'Valor selecionado' : 'Texto da opção selecionada',
    };
    return descriptions[question.question_type as keyof typeof descriptions] || 'Valor da resposta';
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
    onInsertTag(tag);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Tags className="h-4 w-4 mr-2" />
          Tags Contextuais
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tags className="h-4 w-4" />
              Variáveis de Perguntas Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableQuestions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Nenhuma pergunta anterior disponível para referência
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Perguntas NPS, Rating e Múltipla Escolha podem ser referenciadas
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {availableQuestions.map((q, index) => {
                    const questionNumber = questions.findIndex(question => question.id === q.id) + 1;
                    return (
                      <div key={q.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Q{questionNumber}
                          </Badge>
                          <span className="text-sm font-medium truncate flex-1">
                            {q.title || 'Pergunta sem título'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 ml-6">
                          {/* Tag de Valor */}
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                                {generateTag(q, 'value')}
                              </code>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getTagDescription(q, 'value')}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyTag(generateTag(q, 'value'))}
                            >
                              {copiedTag === generateTag(q, 'value') ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          {/* Tag de Texto para NPS e Rating */}
                          {['nps_scale', 'rating'].includes(q.question_type) && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                                  {generateTag(q, 'text')}
                                </code>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getTagDescription(q, 'text')}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyTag(generateTag(q, 'text'))}
                              >
                                {copiedTag === generateTag(q, 'text') ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💡 <strong>Como usar:</strong> Clique em uma tag para copiá-la e inseri-la no título ou descrição da pergunta. 
              Exemplo: "Baseado na sua nota VALUE_Q1, o que podemos melhorar?"
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}