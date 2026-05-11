import { StatsCards } from '@/components/dashboard/stats-cards'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { RecentTasks } from '@/components/dashboard/recent-tasks'
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines'

export default function Index() {
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Olá, Alex</h1>
        <p className="text-muted-foreground capitalize">
          {currentDate}. Você tem 4 tarefas para hoje.
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OverviewChart />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <RecentTasks />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UpcomingDeadlines />
        </div>
        <div className="lg:col-span-2 rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 flex items-center justify-center text-center">
          <div>
            <h3 className="text-lg font-medium">Espaço de Foco</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Nenhuma distração no momento. Continue o bom trabalho!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
