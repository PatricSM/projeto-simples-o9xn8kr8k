import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListTodo, LayoutGrid, Filter, Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { useToast } from '@/hooks/use-toast'

export default function Tasks() {
  const [view, setView] = useState('quadro')
  const { toast } = useToast()

  const handleNewTask = () => {
    toast({
      title: 'Nova tarefa rápida',
      description: 'Funcionalidade em desenvolvimento.',
    })
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Input placeholder="Filtrar tarefas..." className="bg-background" />
            <Filter className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button onClick={handleNewTask} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full mt-2">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="lista" className="gap-2">
              <ListTodo className="h-4 w-4" /> Lista
            </TabsTrigger>
            <TabsTrigger value="quadro" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> Quadro
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="quadro" className="m-0 border-none outline-none">
          <KanbanBoard />
        </TabsContent>

        <TabsContent value="lista" className="m-0 border-none outline-none">
          <div className="rounded-md border bg-card text-center py-16">
            <ListTodo className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">Modo Lista</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize suas tarefas em um formato tabular detalhado.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
