import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const tasks = [
  { id: 't1', title: 'Ajustar layout da home', priority: 'Alta', done: false },
  { id: 't2', title: 'Escrever copy do email', priority: 'Média', done: false },
  { id: 't3', title: 'Revisar paleta de cores', priority: 'Baixa', done: true },
  { id: 't4', title: 'Reunião de alinhamento', priority: 'Alta', done: false },
  { id: 't5', title: 'Atualizar documentação API', priority: 'Média', done: false },
]

export function RecentTasks() {
  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader>
        <CardTitle>Tarefas Urgentes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center space-x-4 rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <Checkbox id={task.id} checked={task.done} />
            <div className="flex-1 space-y-1">
              <p
                className={cn(
                  'text-sm font-medium leading-none',
                  task.done && 'line-through text-muted-foreground',
                )}
              >
                {task.title}
              </p>
            </div>
            <Badge
              variant={
                task.priority === 'Alta'
                  ? 'destructive'
                  : task.priority === 'Média'
                    ? 'default'
                    : 'secondary'
              }
              className={task.priority === 'Média' ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              {task.priority}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
