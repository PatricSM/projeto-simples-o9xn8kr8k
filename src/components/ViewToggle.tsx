import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Building2, Eye, ArrowLeftRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';

export default function ViewToggle() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading while profile is being loaded
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Only show for platform admins
  if (profile?.role !== 'admin_platform') {
    return null;
  }

  const handleViewHospital = (hospitalSlug: string) => {
    navigate(`/hospital/${hospitalSlug}/`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <Badge>
            <Shield className="h-3 w-3 mr-1" />
            Admin da Plataforma
          </Badge>
          <span className="text-sm text-muted-foreground">
            Gerenciando toda a plataforma
          </span>
        </div>
        <HospitalViewDialog onSelectHospital={handleViewHospital} />
      </div>
      <AdminDashboard />
    </div>
  );
}

interface Hospital {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface HospitalViewDialogProps {
  onSelectHospital: (hospitalSlug: string) => void;
}

function HospitalViewDialog({ onSelectHospital }: HospitalViewDialogProps) {
  const [open, setOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name, slug, active')
        .eq('active', true)
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar hospitais:', error);
        return;
      }
      
      setHospitals(data || []);
    } catch (error) {
      console.error('Erro ao buscar hospitais:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHospitals();
    }
  }, [open]);

  const handleSelectHospital = (hospitalSlug: string) => {
    onSelectHospital(hospitalSlug);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Visualizar Hospital
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Hospital</DialogTitle>
          <DialogDescription>
            Escolha um hospital para acessar sua interface específica
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando hospitais...</span>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhum hospital ativo encontrado</p>
            </div>
          ) : (
            hospitals.map((hospital) => (
              <Card 
                key={hospital.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary/50 hover:border-l-primary"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {hospital.name}
                    </CardTitle>
                    <Button 
                      size="sm"
                      onClick={() => handleSelectHospital(hospital.slug)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Acessar
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>/{hospital.slug}</span>
                    <Badge variant="outline" className="ml-auto">
                      Ativo
                    </Badge>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}