import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHospitalRoute } from '@/hooks/use-hospital-route';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuestionResponse {
  id: string;
  question_id: string;
  response_value: any;
  question: {
    title: string;
    question_type: string;
  };
}

interface NPSResponse {
  id: string;
  nps_score: number | null;
  feedback_text: string | null;
  created_at: string;
  respondent_email: string | null;
  respondent_phone: string | null;
  additional_data: any;
  question_responses?: QuestionResponse[];
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function CampaignResponses() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { buildPath, currentHospital } = useHospitalRoute();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [responses, setResponses] = useState<NPSResponse[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<NPSResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) return;

      try {
        // Buscar dados da campanha
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, type, status')
          .eq('id', campaignId)
          .single();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        // Buscar perguntas da campanha para substituir tags contextuais
        const { data: questionsData, error: questionsError } = await supabase
          .from('campaign_questions')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('order_index');

        if (questionsError) {
          console.error('Erro ao carregar perguntas:', questionsError);
        } else {
          setQuestions(questionsData || []);
        }

        // Buscar respostas da campanha com as respostas às perguntas
        const { data: responsesData, error: responsesError } = await supabase
          .from('nps_responses')
          .select(`
            *,
            question_responses (
              id,
              question_id,
              response_value,
              question:campaign_questions (
                title,
                question_type
              )
            )
          `)
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });

        if (responsesError) throw responsesError;
        setResponses(responsesData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da campanha',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId, toast]);

  // Função para substituir tags contextuais por valores reais
  const replaceContextualTags = (text: string, responseData: NPSResponse) => {
    return text.replace(/\{\{VALUE_Q(\d+)\}\}/g, (match, questionNumber) => {
      const targetOrderIndex = parseInt(questionNumber) - 1;
      const targetQuestion = questions.find(q => q.order_index === targetOrderIndex);
      
      if (targetQuestion && responseData.question_responses) {
        const questionResponse = responseData.question_responses.find(
          (qr: any) => qr.question_id === targetQuestion.id
        );
        
        if (questionResponse?.response_value) {
          const value = questionResponse.response_value;
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return String(value);
        }
      }
      
      return match;
    });
  };

  const filteredResponses = responses.filter(response => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      response.feedback_text?.toLowerCase().includes(searchLower) ||
      response.respondent_email?.toLowerCase().includes(searchLower) ||
      response.respondent_phone?.includes(searchTerm)
    );
  });

  const getNPSCategory = (score: number | null) => {
    if (score === null) return { label: 'N/A', color: 'secondary' };
    if (score >= 9) return { label: 'Promotor', color: 'success' };
    if (score >= 7) return { label: 'Neutro', color: 'warning' };
    return { label: 'Detrator', color: 'destructive' };
  };

  const calculateNPS = () => {
    const validScores = responses.filter(r => r.nps_score !== null);
    if (validScores.length === 0) return 0;

    const promoters = validScores.filter(r => r.nps_score! >= 9).length;
    const detractors = validScores.filter(r => r.nps_score! <= 6).length;
    
    return Math.round(((promoters - detractors) / validScores.length) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(buildPath('/campaigns'))}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Campanhas
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Campanha não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(buildPath('/campaigns'))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">
              {currentHospital?.name} • {responses.length} respostas
            </p>
          </div>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score NPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{calculateNPS()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promotores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {responses.filter(r => r.nps_score && r.nps_score >= 9).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detratores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {responses.filter(r => r.nps_score && r.nps_score <= 6).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por feedback, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Respostas ({filteredResponses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResponses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhuma resposta encontrada para o filtro aplicado' : 'Nenhuma resposta ainda'}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Score NPS</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((response) => {
                    const npsCategory = getNPSCategory(response.nps_score);
                    return (
                      <TableRow key={response.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(response.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          {response.nps_score !== null && (
                            <Badge variant={npsCategory.color as any}>
                              {npsCategory.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {response.nps_score !== null && (
                            <span className="font-mono text-lg font-bold">
                              {response.nps_score}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {response.respondent_email && (
                              <div className="truncate max-w-[200px]">{response.respondent_email}</div>
                            )}
                            {response.respondent_phone && (
                              <div className="text-muted-foreground">{response.respondent_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {response.feedback_text && (
                            <div className="truncate max-w-[300px] text-sm text-muted-foreground">
                              {response.feedback_text}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedResponse(response);
                              setDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes da Resposta</DialogTitle>
          </DialogHeader>
          
          {selectedResponse && (
            <ScrollArea className="h-full max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* NPS Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Score NPS</h3>
                  <div className="flex items-center space-x-3">
                    {selectedResponse.nps_score !== null && (
                      <>
                        <Badge variant={getNPSCategory(selectedResponse.nps_score).color as any} className="text-base">
                          {getNPSCategory(selectedResponse.nps_score).label}
                        </Badge>
                        <span className="font-mono text-3xl font-bold">
                          {selectedResponse.nps_score}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Informações de Contato</h3>
                  <div className="space-y-1 text-sm">
                    {selectedResponse.respondent_email && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Email:</span>
                        <span>{selectedResponse.respondent_email}</span>
                      </div>
                    )}
                    {selectedResponse.respondent_phone && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Telefone:</span>
                        <span>{selectedResponse.respondent_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Data:</span>
                      <span>{new Date(selectedResponse.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                {selectedResponse.feedback_text && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Feedback</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedResponse.feedback_text}</p>
                    </div>
                  </div>
                )}

                {/* Question Responses */}
                {selectedResponse.question_responses && selectedResponse.question_responses.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Respostas às Perguntas</h3>
                    <div className="space-y-3">
                      {selectedResponse.question_responses.map((qr: any) => {
                        const questionTitle = qr.question?.title || 'Pergunta';
                        const titleWithValues = replaceContextualTags(questionTitle, selectedResponse);
                        
                        return (
                          <div key={qr.id} className="border rounded-lg p-3 space-y-1">
                            <p className="font-medium text-sm">{titleWithValues}</p>
                            <div className="text-sm text-muted-foreground">
                              {typeof qr.response_value === 'object' ? (
                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto">
                                  {JSON.stringify(qr.response_value, null, 2)}
                                </pre>
                              ) : (
                                <p>{String(qr.response_value)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Data */}
                {selectedResponse.additional_data && Object.keys(selectedResponse.additional_data).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">Dados Adicionais</h3>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(selectedResponse.additional_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}