import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { HospitalViewProvider } from "@/contexts/HospitalViewContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import ViewToggle from "@/components/ViewToggle";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Hospitals from "@/pages/admin/Hospitals";
import Users from "@/pages/admin/Users";
import PublicSurvey from "@/pages/survey/PublicSurvey";
import HospitalRoutes from "@/components/HospitalRoutes";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Component to route to correct dashboard based on user role
function DashboardRouter() {
  const { profile, loading } = useAuth();
  
  console.log('DashboardRouter - loading:', loading, 'profile:', profile);
  
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Route based on user role
  if (profile?.role === 'admin_platform') {
    console.log('Redirecionando para ViewToggle (admin_platform)');
    // Platform admins see the ViewToggle component (admin dashboard + hospital switching)
    return <ViewToggle />;
  } else if ((profile?.role === 'admin_hospital' || profile?.role === 'user_hospital') && profile?.hospital_id) {
    console.log('Redirecionando para hospital (admin/user_hospital)');
    // Hospital users should be redirected to their hospital-specific route
    // This will be handled by useHospitalRoute hook, so we show a loading state
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecionando para seu hospital...</p>
      </div>
    );
  } else {
    console.log('Fallback para Dashboard default');
    // Default fallback
    return <Dashboard />;
  }
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: false,
            v7_relativeSplatPath: false,
          }}
        >
          <AuthProvider>
            <Routes>
              {/* ========================================= */}
              {/* ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) */}
              {/* ========================================= */}
              
              {/* Rota pública de pesquisa - Qualquer pessoa pode acessar */}
              <Route
                path="/survey/:campaignId"
                element={<PublicSurvey />}
              />
              
              {/* Rota de autenticação - Login e cadastro */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Rota raiz - redireciona para auth */}
              <Route path="/" element={<Auth />} />
              
              {/* ========================================= */}
              {/* ROTAS PROTEGIDAS (REQUEREM AUTENTICAÇÃO) */}
              {/* ========================================= */}
              
              {/* Rotas específicas do hospital */}
              <Route
                path="/hospital/:hospitalSlug/*"
                element={
                  <ProtectedRoute>
                    <HospitalRoutes />
                  </ProtectedRoute>
                }
              />
              
              {/* Dashboard principal - rota padrão após login */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <HospitalViewProvider>
                      <Layout>
                        <DashboardRouter />
                      </Layout>
                    </HospitalViewProvider>
                  </ProtectedRoute>
                }
              />
              
              {/* Rotas da plataforma (admin) */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={['admin_platform']}>
                    <HospitalViewProvider>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="/hospitals" element={<Hospitals />} />
                          <Route path="/users" element={<Users />} />
                          <Route
                            path="/analytics"
                            element={
                              <div className="p-6">
                                <h1 className="text-2xl font-bold">Analytics Gerais</h1>
                                <p className="text-muted-foreground">Em desenvolvimento...</p>
                              </div>
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <div className="p-6">
                                <h1 className="text-2xl font-bold">Configurações da Plataforma</h1>
                                <p className="text-muted-foreground">Em desenvolvimento...</p>
                              </div>
                            }
                          />
                        </Routes>
                      </Layout>
                    </HospitalViewProvider>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/unauthorized"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                      <p className="text-muted-foreground mt-2">
                        Você não tem permissão para acessar esta página.
                      </p>
                    </div>
                  </div>
                }
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
