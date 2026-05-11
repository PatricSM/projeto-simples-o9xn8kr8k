import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Layers } from 'lucide-react'
import { Section } from './SectionManager'

interface QuickSectionCreatorProps {
  onCreateSection: (title: string) => string // Returns the created section ID
  sections: Section[]
}

export default function QuickSectionCreator({
  onCreateSection,
  sections,
}: QuickSectionCreatorProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  const handleCreate = () => {
    if (!title.trim()) return

    const sectionId = onCreateSection(title.trim())
    setTitle('')
    setOpen(false)
    return sectionId
  }

  const suggestedSections = [
    'Informações Pessoais',
    'Avaliação Geral',
    'Experiência com Atendimento',
    'Infraestrutura e Ambiente',
    'Sugestões e Melhorias',
    'Recomendação',
  ]

  const availableSuggestions = suggestedSections.filter(
    (suggestion) =>
      !sections.some(
        (section) =>
          section.title.toLowerCase().includes(suggestion.toLowerCase()) ||
          suggestion.toLowerCase().includes(section.title.toLowerCase()),
      ),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Criar Seção Rápida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Criar Nova Seção
          </DialogTitle>
          <DialogDescription>
            Crie uma nova seção para organizar suas perguntas de forma mais eficiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="section-title">Nome da Seção</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Avaliação do Atendimento"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {availableSuggestions.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground">Sugestões:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableSuggestions.slice(0, 4).map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTitle(suggestion)}
                    className="text-xs h-7"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleCreate} disabled={!title.trim()}>
            Criar Seção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
