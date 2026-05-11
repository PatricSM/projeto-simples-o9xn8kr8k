import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit2,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import QuickSectionCreator from './QuickSectionCreator'

export interface Section {
  id: string
  title: string
  description?: string
  order_index: number
}

interface SectionManagerProps {
  sections: Section[]
  onUpdate: (sections: Section[]) => void
}

export default function SectionManager({ sections, onUpdate }: SectionManagerProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set())

  const toggleCollapse = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

  const toggleEdit = (sectionId: string) => {
    const newEditing = new Set(editingSections)
    if (newEditing.has(sectionId)) {
      newEditing.delete(sectionId)
    } else {
      newEditing.add(sectionId)
    }
    setEditingSections(newEditing)
  }

  const addSection = (title?: string) => {
    const sectionTitle = title || newSectionTitle.trim()
    if (!sectionTitle) return ''

    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: sectionTitle,
      order_index: sections.length,
    }

    onUpdate([...sections, newSection])
    setNewSectionTitle('')
    return newSection.id
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    onUpdate(sections.map((section) => (section.id === id ? { ...section, ...updates } : section)))
  }

  const removeSection = (id: string) => {
    onUpdate(sections.filter((section) => section.id !== id))
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex((s) => s.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const newSections = [...sections]
    const [movedSection] = newSections.splice(currentIndex, 1)
    newSections.splice(newIndex, 0, movedSection)

    // Update order_index for all sections
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order_index: index,
    }))

    onUpdate(updatedSections)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Seções do Formulário
        </CardTitle>
        <CardDescription>
          Organize seu formulário em seções para uma melhor experiência do usuário. As perguntas
          serão agrupadas por seção e podem ter fluxos condicionais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome da nova seção"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSection()}
          />
          <Button onClick={() => addSection()} disabled={!newSectionTitle.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <QuickSectionCreator onCreateSection={(title) => addSection(title)} sections={sections} />
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhuma seção criada ainda.</p>
            <p className="text-sm">
              As perguntas ficarão em uma única página sem seções específicas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Separator />
            <div className="text-sm text-muted-foreground mb-2">
              As seções aparecerão nesta ordem no formulário:
            </div>

            {sections
              .sort((a, b) => a.order_index - b.order_index)
              .map((section, index) => (
                <Collapsible key={section.id} open={!collapsedSections.has(section.id)}>
                  <Card className="border-l-4 border-l-blue-500">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {collapsedSections.has(section.id) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              )}
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline">Seção {index + 1}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{section.title}</span>
                              {section.description && (
                                <span className="text-xs text-muted-foreground">
                                  - {section.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEdit(section.id)}
                              title="Editar seção"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                              title="Mover para cima"
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === sections.length - 1}
                              title="Mover para baixo"
                            >
                              ↓
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              title="Remover seção"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {editingSections.has(section.id) && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Título da Seção *</Label>
                              <Input
                                value={section.title}
                                onChange={(e) =>
                                  updateSection(section.id, { title: e.target.value })
                                }
                                placeholder="Ex: Informações Pessoais"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Descrição</Label>
                              <Textarea
                                value={section.description || ''}
                                onChange={(e) =>
                                  updateSection(section.id, { description: e.target.value })
                                }
                                placeholder="Descrição opcional da seção"
                                className="min-h-[38px]"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button type="button" size="sm" onClick={() => toggleEdit(section.id)}>
                              Concluir Edição
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </CollapsibleContent>
                  </Card>

                  {index < sections.length - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground ml-2">Próxima seção</span>
                    </div>
                  )}
                </Collapsible>
              ))}
          </div>
        )}

        {sections.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm text-blue-800">
              💡 <strong>Dicas para usar seções:</strong>
            </p>
            <ul className="text-xs text-blue-700 space-y-1 ml-4">
              <li>• Todas as perguntas devem ser associadas a uma seção</li>
              <li>
                • Use lógica condicional em perguntas de múltipla escolha para pular entre seções
              </li>
              <li>• Seções ajudam a organizar formulários longos e melhoram a experiência</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
