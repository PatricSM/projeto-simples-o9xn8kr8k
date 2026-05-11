import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, GripVertical } from 'lucide-react'

const boardData = {
  todo: [
    { id: 1, title: 'Análise de Requisitos', tags: ['Backend', 'P0'], subs: '0/3' },
    { id: 2, title: 'Criar repositório', tags: ['DevOps'], subs: '0/0' },
  ],
  inProgress: [
    { id: 3, title: 'Ajustar layout da home', tags: ['Frontend', 'P1'], subs: '2/5' },
    { id: 4, title: 'Escrever copy do email', tags: ['Marketing'], subs: '1/1' },
  ],
  done: [{ id: 5, title: 'Revisar paleta de cores', tags: ['Design'], subs: '3/3' }],
}

function KanbanCard({ task }: { task: any }) {
  return (
    <Card className="group relative border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium leading-tight pr-4">{task.title}</p>
          <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex gap-1.5 flex-wrap">
            {task.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
          {task.subs !== '0/0' && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
              {task.subs}
            </span>
          )}
        </div>
        <div className="absolute left-1 top-[50%] -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
          <GripVertical className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function KanbanBoard() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-220px)] items-start">
      <div className="flex-shrink-0 w-80 flex flex-col gap-3 bg-muted/30 p-3 rounded-xl">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm">
            A Fazer{' '}
            <span className="text-muted-foreground font-normal ml-2">{boardData.todo.length}</span>
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {boardData.todo.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 w-80 flex flex-col gap-3 bg-muted/30 p-3 rounded-xl">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm">
            Em Progresso{' '}
            <span className="text-muted-foreground font-normal ml-2">
              {boardData.inProgress.length}
            </span>
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {boardData.inProgress.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 w-80 flex flex-col gap-3 bg-muted/30 p-3 rounded-xl">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm">
            Concluído{' '}
            <span className="text-muted-foreground font-normal ml-2">{boardData.done.length}</span>
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {boardData.done.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  )
}
