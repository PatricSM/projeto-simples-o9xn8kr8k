import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useHospitalRoute } from '@/hooks/use-hospital-route';
import { useAuth } from '@/hooks/use-auth';
import { HospitalViewProvider } from '@/contexts/HospitalViewContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Campaigns from '@/pages/campaigns/Campaigns';
import NewCampaign from '@/pages/campaigns/NewCampaign';
import CampaignResponses from '@/pages/campaigns/CampaignResponses';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEffect } from 'react';
import { useHospitalView } from '@/contexts/HospitalViewContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function HospitalContent() {
  const { currentHospital, loading } = useHospitalRoute();
  const { setHospitalContext } = useHospitalView();
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentHospital) {
      setHospitalContext({
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
      });
    } else {
      setHospitalContext(null);
    }

    return () => {
      // Limpar contexto ao sair
      if (!currentHospital) {
        setHospitalContext(null);
      }
    };
  }, [currentHospital, setHospitalContext]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentHospital) {
    return <Navigate to="/" replace />;
  }

  // Header para mostrar que estamos em contexto de hospital específico
  const HospitalHeader = () => {
    if (profile?.role === 'admin_platform') {
      return (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar à Administração
              </Button>
              <div className="h-6 w-px bg-blue-200" />
              <div>
                <span className="text-sm text-blue-600 font-medium">
                  Visualizando: {currentHospital.name}
                </span>
                <p className="text-xs text-blue-500">
                  Interface específica do hospital
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      <HospitalHeader />
      <Routes>
        <Route path="/" element={<Dashboard hospitalId={currentHospital.id} hospitalName={currentHospital.name} />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<NewCampaign />} />
        <Route path="/campaigns/:campaignId/edit" element={<NewCampaign />} />
        <Route
          path="/campaigns/:campaignId/responses"
          element={<CampaignResponses />}
        />
        <Route
          path="/campaigns/:campaignId/analytics"
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold">Analytics da Campanha - {currentHospital.name}</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          }
        />
        <Route
          path="/responses"
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold">Respostas NPS - {currentHospital.name}</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          }
        />
        <Route
          path="/analytics"
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold">Analytics - {currentHospital.name}</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute roles={['admin_hospital', 'admin_platform']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Equipe - {currentHospital.name}</h1>
                <p className="text-muted-foreground">Em desenvolvimento...</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold">Configurações - {currentHospital.name}</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          }
        />
        {/* Redirect para dashboard se nenhuma rota corresponder */}
        <Route path="*" element={<Navigate to={`/hospital/${currentHospital.slug}/`} replace />} />
      </Routes>
    </div>
  );
}

export default function HospitalRoutes() {
  return (
    <HospitalViewProvider>
      <Layout>
        <HospitalContent />
      </Layout>
    </HospitalViewProvider>
  );
}