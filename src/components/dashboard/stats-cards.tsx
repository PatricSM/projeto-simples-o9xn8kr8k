import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, FolderKanban, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: 'Tarefas Ativas',
    value: '24',
    description: '+3 desde ontem',
    icon: CheckCircle2,
    trend: 'up',
  },
  {
    title: 'Projetos em Andamento',
    value: '8',
    description: '2 próximos do prazo',
    icon: FolderKanban,
    trend: 'neutral',
  },
  {
    title: 'Horas Focadas',
    value: '32h',
    description: '+15% nesta semana',
    icon: Clock,
    trend: 'up',
  },
  {
    title: 'Taxa de Conclusão',
    value: '86%',
    description: 'Ótimo desempenho',
    icon: TrendingUp,
    trend: 'up',
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="hover-card-highlight border-none shadow-sm bg-card/50 backdrop-blur-sm"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
