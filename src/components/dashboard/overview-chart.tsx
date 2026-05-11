import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartData = [
  { date: 'Seg', completas: 4, adicionadas: 6 },
  { date: 'Ter', completas: 7, adicionadas: 5 },
  { date: 'Qua', completas: 5, adicionadas: 8 },
  { date: 'Qui', completas: 10, adicionadas: 4 },
  { date: 'Sex', completas: 8, adicionadas: 7 },
  { date: 'Sab', completas: 3, adicionadas: 2 },
  { date: 'Dom', completas: 2, adicionadas: 1 },
]

const chartConfig = {
  completas: {
    label: 'Concluídas',
    color: 'hsl(var(--chart-1))',
  },
  adicionadas: {
    label: 'Novas',
    color: 'hsl(var(--chart-2))',
  },
}

export function OverviewChart() {
  return (
    <Card className="col-span-1 lg:col-span-2 border-none shadow-sm">
      <CardHeader>
        <CardTitle>Produtividade da Semana</CardTitle>
        <CardDescription>
          Comparativo de tarefas criadas vs concluídas nos últimos 7 dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCompletas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-completas)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-completas)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillAdicionadas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-adicionadas)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-adicionadas)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="adicionadas"
              stroke="var(--color-adicionadas)"
              fillOpacity={1}
              fill="url(#fillAdicionadas)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="completas"
              stroke="var(--color-completas)"
              fillOpacity={1}
              fill="url(#fillCompletas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
