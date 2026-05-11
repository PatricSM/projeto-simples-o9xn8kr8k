import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, MessageSquare, TrendingUp, Activity, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  totalHospitals: number
  activeHospitals: number
  totalCampaigns: number
  activeCampaigns: number
  totalResponses: number
  totalUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalHospitals: 0,
    activeHospitals: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalResponses: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch hospitals stats
        const { data: hospitals, error: hospitalsError } = await supabase
          .from('hospitals')
          .select('id, active')

        if (hospitalsError) throw hospitalsError

        // Fetch campaigns stats
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('id, status')

        if (campaignsError) throw campaignsError

        // Fetch responses stats
        const { count: responsesCount, error: responsesError } = await supabase
          .from('nps_responses')
          .select('*', { count: 'exact', head: true })

        if (responsesError) throw responsesError

        // Fetch users stats
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (usersError) throw usersError

        setStats({
          totalHospitals: hospitals?.length || 0,
          activeHospitals: hospitals?.filter((h) => h.active)?.length || 0,
          totalCampaigns: campaigns?.length || 0,
          activeCampaigns: campaigns?.filter((c) => c.status === 'active')?.length || 0,
          totalResponses: responsesCount || 0,
          totalUsers: usersCount || 0,
        })
      } catch (error: unknown) {
        console.error('Error fetching dashboard stats:', error)
        toast({
          title: 'Erro ao carregar estatísticas',
          description: 'Não foi possível carregar as estatísticas do dashboard.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  const statCards = [
    {
      title: 'Hospitais Ativos',
      value: `${stats.activeHospitals}/${stats.totalHospitals}`,
      description: 'Hospitais cadastrados e ativos na plataforma',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Campanhas Ativas',
      value: `${stats.activeCampaigns}/${stats.totalCampaigns}`,
      description: 'Campanhas NPS em execução',
      icon: Activity,
      color: 'text-green-600',
    },
    {
      title: 'Total de Respostas',
      value: stats.totalResponses.toLocaleString(),
      description: 'Respostas coletadas em todas as campanhas',
      icon: MessageSquare,
      color: 'text-purple-600',
    },
    {
      title: 'Usuários Cadastrados',
      value: stats.totalUsers.toLocaleString(),
      description: 'Total de usuários na plataforma',
      icon: Users,
      color: 'text-orange-600',
    },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Visão geral da plataforma NPS</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </CardTitle>
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral da plataforma NPS</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo da Plataforma
            </CardTitle>
            <CardDescription>Principais métricas de desempenho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Hospitais Ativos</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalHospitals > 0
                  ? `${Math.round((stats.activeHospitals / stats.totalHospitals) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Campanhas Ativas</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalCampaigns > 0
                  ? `${Math.round((stats.activeCampaigns / stats.totalCampaigns) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Média de Respostas por Campanha</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalCampaigns > 0
                  ? Math.round(stats.totalResponses / stats.totalCampaigns)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>Links para principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <NavLink
              to="/admin/hospitals"
              className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="font-medium">Gerenciar Hospitais</div>
              <div className="text-sm text-muted-foreground">Cadastrar e configurar hospitais</div>
            </NavLink>
            <NavLink
              to="/admin/users"
              className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="font-medium">Gerenciar Usuários</div>
              <div className="text-sm text-muted-foreground">
                Administrar usuários da plataforma
              </div>
            </NavLink>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
