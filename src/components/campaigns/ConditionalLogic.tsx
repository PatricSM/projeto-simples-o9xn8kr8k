import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GitBranch } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ConditionalRule } from './QuestionBuilder';

interface ConditionalLogicProps {
  options: string[];
  sections: Array<{ id: string; title: string; order_index: number }>;
  rules: ConditionalRule[];
  onUpdate: (rules: ConditionalRule[]) => void;
}

export default function ConditionalLogic({ 
  options, 
  sections, 
  rules, 
  onUpdate 
}: ConditionalLogicProps) {
  const addRule = () => {
    const newRule: ConditionalRule = {
      option_value: '',
      target_section_id: '',
      action: 'go_to_section',
    };
    onUpdate([...rules, newRule]);
  };

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newRules = rules.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    );
    onUpdate(newRules);
  };

  const removeRule = (index: number) => {
    onUpdate(rules.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-orange-200 bg-orange-50/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <GitBranch className="h-4 w-4" />
          Lógica Condicional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700 mb-4">
          Configure para onde o usuário deve ir baseado na resposta selecionada.
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Nenhuma regra condicional configurada
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Regra
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <Card key={index} className="border-orange-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      Regra {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Quando resposta for:</Label>
                      <Select
                        value={rule.option_value}
                        onValueChange={(value) => updateRule(index, { option_value: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option, i) => (
                            <SelectItem key={i} value={option}>
                              {option || `Opção ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Ação:</Label>
                      <Select
                        value={rule.action}
                        onValueChange={(value) => updateRule(index, { action: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="go_to_section">Ir para seção</SelectItem>
                          <SelectItem value="skip_to_end">Pular para o fim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {rule.action === 'go_to_section' && (
                      <div>
                        <Label className="text-sm">Seção destino:</Label>
                        <Select
                          value={rule.target_section_id}
                          onValueChange={(value) => updateRule(index, { target_section_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seção" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Separator />
            
            <Button type="button" variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Regra
            </Button>
          </div>
        )}

        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
          💡 Dica: As regras condicionais só funcionam em perguntas de múltipla escolha (radiobox).
        </div>
      </CardContent>
    </Card>
  );
}