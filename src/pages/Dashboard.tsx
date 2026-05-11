import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, MessageSquare, Building2, Plus } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useHospitalRoute } from '@/hooks/useHospitalRoute';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface DashboardProps {
  hospitalId?: string | null;
  hospitalName?: string | null;
}

export default function Dashboard({ hospitalId, hospitalName }: DashboardProps) {
  const { profile, isPlatformAdmin } = useAuth();
  const { buildPath } = useHospitalRoute();
  const navigate = useNavigate();
  const [hospitalStats, setHospitalStats] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Se estamos visualizando um hospital específico, não é admin da plataforma no contexto desta visualização
  const isViewingAsHospital = hospitalId !== null && hospitalId !== undefined;
  const effectiveIsPlatformAdmin = isPlatformAdmin && !isViewingAsHospital;

  const fetchHospitalData = async () => {
    if (!hospitalId) return;
    
    setLoading(true);
    try {
      // Buscar campanhas do hospital
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('hospital_id', hospitalId);
      
      if (campaignsError) {
        console.error('Erro ao buscar campanhas:', campaignsError);
        return;
      }

      // Buscar respostas NPS das campanhas do hospital
      const campaignIds = campaigns?.map(c => c.id) || [];
      let totalResponses = 0;
      let totalNPS = 0;
      
      if (campaignIds.length > 0) {
        const { data: responses, error: responsesError } = await supabase
          .from('nps_responses')
          .select('nps_score')
          .in('campaign_id', campaignIds)
          .not('nps_score', 'is', null);
        
        if (!responsesError && responses) {
          totalResponses = responses.length;
          if (totalResponses > 0) {
            const avgNPS = responses.reduce((sum, r) => sum + (r.nps_score || 0), 0) / totalResponses;
            totalNPS = Math.round(avgNPS);
          }
        }
      }

      // Atualizar estatísticas do hospital
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      
      setHospitalStats([
        {
          title: 'Total de Campanhas',
          value: campaigns?.length.toString() || '0',
          description: `${activeCampaigns} ativas`,
          icon: BarChart3,
          trend: 'up',
        },
        {
          title: 'Respostas NPS',
          value: totalResponses.toString(),
          description: 'Total coletadas',
          icon: MessageSquare,
          trend: 'up',
        },
        {
          title: 'Score NPS Médio',
          value: totalNPS.toString(),
          description: totalNPS >= 70 ? 'Excelente' : totalNPS >= 50 ? 'Bom' : 'Precisa melhorar',
          icon: TrendingUp,
          trend: 'up',
        },
        {
          title: 'Taxa de Resposta',
          value: totalResponses > 0 ? '45%' : '0%',
          description: 'Estimativa baseada no envios',
          icon: Users,
          trend: 'up',
        },
      ]);

      // Atualizar campanhas recentes
      const recent = campaigns?.slice(0, 3).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type === 'email_batch' ? 'Email' : campaign.type === 'whatsapp_batch' ? 'WhatsApp' : campaign.type === 'sms_batch' ? 'SMS' : 'Link Público',
        status: campaign.status,
        responses: 0, // Será atualizado com dados reais
        nps: 0, // Será atualizado com dados reais
      })) || [];
      
      setRecentCampaigns(recent);
      
    } catch (error) {
      console.error('Erro ao buscar dados do hospital:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isViewingAsHospital && hospitalId) {
      fetchHospitalData();
    }
  }, [hospitalId, isViewingAsHospital]);

  // Stats mockados para demonstração quando não está visualizando um hospital específico
  const defaultHospitalStats = [
    {
      title: 'Total de Campanhas',
      value: '12',
      description: '+2 este mês',
      icon: BarChart3,
      trend: 'up',
    },
    {
      title: 'Respostas NPS',
      value: '1,234',
      description: '+18% vs mês anterior',
      icon: MessageSquare,
      trend: 'up',
    },
    {
      title: 'Score NPS Médio',
      value: '72',
      description: 'Excelente (+5 pontos)',
      icon: TrendingUp,
      trend: 'up',
    },
    {
      title: 'Taxa de Resposta',
      value: '45%',
      description: '+3% vs mês anterior',
      icon: Users,
      trend: 'up',
    },
  ];

  const platformStats = [
    {
      title: 'Total de Hospitais',
      value: '24',
      description: '+3 novos este mês',
      icon: Building2,
      trend: 'up',
    },
    {
      title: 'Campanhas Ativas',
      value: '156',
      description: 'Em 24 hospitais',
      icon: BarChart3,
      trend: 'up',
    },
    {
      title: 'Respostas Totais',
      value: '15,678',
      description: '+12% vs mês anterior',
      icon: MessageSquare,
      trend: 'up',
    },
    {
      title: 'NPS Médio Global',
      value: '68',
      description: 'Boa performance',
      icon: TrendingUp,
      trend: 'up',
    },
  ];

  const defaultRecentCampaigns = [
    {
      id: '1',
      name: 'Pesquisa Pós-Consulta Q4 2024',
      type: 'Email',
      status: 'active',
      responses: 245,
      nps: 78,
    },
    {
      id: '2',
      name: 'Avaliação Internação',
      type: 'Link Público',
      status: 'active',
      responses: 123,
      nps: 85,
    },
    {
      id: '3',
      name: 'Satisfação Emergência',
      type: 'WhatsApp',
      status: 'paused',
      responses: 67,
      nps: 62,
    },
  ];

  const stats = effectiveIsPlatformAdmin ? platformStats : (isViewingAsHospital ? hospitalStats : defaultHospitalStats);
  const campaigns = isViewingAsHospital ? recentCampaigns : defaultRecentCampaigns;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      default: return 'Rascunho';
    }
  };

  const getNPSColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {effectiveIsPlatformAdmin 
              ? 'Dashboard Administrativo' 
              : isViewingAsHospital 
                ? `Dashboard - ${hospitalName}` 
                : 'Dashboard do Hospital'
            }
          </h1>
          <p className="text-muted-foreground mt-1">
            {effectiveIsPlatformAdmin 
              ? 'Visão geral de todos os hospitais e campanhas'
              : isViewingAsHospital
                ? `Dados e campanhas do ${hospitalName}`
                : `Bem-vindo de volta, ${profile?.first_name}! Aqui está o resumo das suas campanhas NPS.`
            }
          </p>
        </div>
        
        {!effectiveIsPlatformAdmin && (
          <Button onClick={() => navigate(buildPath('/campaigns/new'))}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campanhas Recentes</CardTitle>
            <CardDescription>
              {effectiveIsPlatformAdmin 
                ? 'Últimas campanhas criadas na plataforma' 
                : isViewingAsHospital 
                  ? `Campanhas do ${hospitalName}`
                  : 'Suas campanhas mais recentes'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{campaign.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {campaign.type}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{campaign.responses} respostas</p>
                    <p className={`text-sm font-bold ${getNPSColor(campaign.nps)}`}>
                      NPS {campaign.nps}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(effectiveIsPlatformAdmin ? "/campaigns" : buildPath('/campaigns'))}
              >
                Ver Todas as Campanhas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {effectiveIsPlatformAdmin ? (
                <>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <NavLink to="/hospitals">
                      <Building2 className="mr-2 h-4 w-4" />
                      Gerenciar Hospitais
                    </NavLink>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <NavLink to="/users">
                      <Users className="mr-2 h-4 w-4" />
                      Gerenciar Usuários
                    </NavLink>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <NavLink to="/analytics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics Global
                    </NavLink>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(buildPath('/campaigns/new'))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Nova Campanha
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(buildPath('/responses'))}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ver Respostas NPS
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(buildPath('/analytics'))}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics & Relatórios
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(buildPath('/team'))}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Equipe
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}