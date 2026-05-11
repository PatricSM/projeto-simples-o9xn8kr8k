import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useHospitalRoute } from '@/hooks/useHospitalRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Play,
  Pause,
  BarChart3,
  ExternalLink,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useHospitalView } from '@/contexts/HospitalViewContext';
import CampaignShareModal from '@/components/campaigns/CampaignShareModal';

interface Campaign {
  id: string;
  name: string;
  public_title?: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  primary_color: string | null;
  hospital_id: string;
  created_by: string;
  _count?: {
    responses: number;
    questions: number;
  };
}

export default function Campaigns() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { hospitalContext } = useHospitalView();
  const { buildPath } = useHospitalRoute();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const getHospitalId = () => {
    if (hospitalContext) {
      return hospitalContext.hospitalId;
    }
    return profile?.hospital_id;
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const hospitalId = getHospitalId();
      
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          nps_responses!campaign_id(count),
          campaign_questions!campaign_id(count)
        `);

      // Filtrar por hospital se não for admin da plataforma visualizando tudo
      if (hospitalId || !profile?.role?.includes('admin_platform')) {
        query = query.eq('hospital_id', hospitalId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Processar contagens
      const processedCampaigns = data?.map(campaign => ({
        ...campaign,
        _count: {
          responses: campaign.nps_responses?.[0]?.count || 0,
          questions: campaign.campaign_questions?.[0]?.count || 0,
        }
      })) || [];

      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar campanhas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [profile, hospitalContext]);

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Rascunho' },
      active: { variant: 'default' as const, label: 'Ativa' },
      paused: { variant: 'outline' as const, label: 'Pausada' },
      completed: { variant: 'secondary' as const, label: 'Finalizada' },
      archived: { variant: 'secondary' as const, label: 'Arquivada' },
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      email_batch: 'Email',
      sms_batch: 'SMS',
      whatsapp_batch: 'WhatsApp',
      public_link: 'Link Público',
      integration_flow: 'Integração',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus as any })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, status: newStatus } : c
      ));

      toast({
        title: 'Sucesso!',
        description: `Campanha ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da campanha.',
        variant: 'destructive',
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.filter(c => c.id !== campaignId));

      toast({
        title: 'Sucesso!',
        description: 'Campanha excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir campanha.',
        variant: 'destructive',
      });
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.public_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando campanhas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campanhas NPS</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas de pesquisa de satisfação
          </p>
        </div>
        <Button onClick={() => navigate(buildPath('/campaigns/new'))}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="completed">Finalizadas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Campanhas */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {campaigns.length === 0 ? 'Nenhuma campanha criada' : 'Nenhuma campanha encontrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {campaigns.length === 0 
                ? 'Crie sua primeira campanha para começar a coletar feedback dos pacientes.'
                : 'Tente ajustar os filtros para encontrar as campanhas desejadas.'
              }
            </p>
            {campaigns.length === 0 && (
              <Button onClick={() => navigate(buildPath('/campaigns/new'))}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Campanha
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                      <Badge variant="outline">{getTypeBadge(campaign.type)}</Badge>
                    </div>
                    {campaign.public_title && campaign.public_title !== campaign.name && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Título público:</strong> {campaign.public_title}
                      </div>
                    )}
                    {campaign.description && (
                      <CardDescription>{campaign.description}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <NavLink to={buildPath(`/campaigns/${campaign.id}/responses`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Respostas
                        </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to={buildPath(`/campaigns/${campaign.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to={buildPath(`/campaigns/${campaign.id}/analytics`)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </NavLink>
                      </DropdownMenuItem>
                      {campaign.type === 'public_link' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShareModalOpen(true);
                            }}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <NavLink to={`/survey/${campaign.id}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Abrir Pesquisa
                            </NavLink>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => 
                          updateCampaignStatus(
                            campaign.id, 
                            campaign.status === 'active' ? 'paused' : 'active'
                          )
                        }
                      >
                        {campaign.status === 'active' ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteCampaign(campaign.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Perguntas</p>
                    <p className="font-medium">{campaign._count?.questions || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Respostas</p>
                    <p className="font-medium">{campaign._count?.responses || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criada em</p>
                    <p className="font-medium">
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expira em</p>
                    <p className="font-medium">
                      {campaign.expires_at 
                        ? new Date(campaign.expires_at).toLocaleDateString('pt-BR')
                        : 'Sem expiração'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de Compartilhamento */}
      {selectedCampaign && (
        <CampaignShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
        />
      )}
    </div>
  );
}