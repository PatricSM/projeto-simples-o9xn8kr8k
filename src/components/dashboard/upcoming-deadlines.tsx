import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const deadlines = [
  { project: 'Redesign do Website', date: 'Hoje, 18:00', status: 'Crítico' },
  { project: 'Lançamento de Campanha', date: 'Amanhã, 10:00', status: 'Atenção' },
  { project: 'App Mobile v2', date: 'Sexta, 14:00', status: 'No Prazo' },
]

export function UpcomingDeadlines() {
  return (
    <Card className="border-none shadow-sm h-full bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle>Prazos Próximos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {deadlines.map((item, i) => (
            <div
              key={i}
              className="flex flex-col space-y-1.5 relative pl-6 after:absolute after:left-1 after:top-2 after:bottom-[-24px] after:w-px after:bg-border last:after:hidden"
            >
              <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
              <span className="text-sm font-semibold">{item.project}</span>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.date}</span>
                <span className={item.status === 'Crítico' ? 'text-destructive font-medium' : ''}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
