import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Hospital {
  id: string;
  name: string;
  slug: string;
}

export function useHospitalRoute() {
  const { hospitalSlug } = useParams<{ hospitalSlug: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHospitalData = async () => {
      if (!profile) return;

      try {
        if (hospitalSlug) {
          // Buscar hospital pelo slug
          const { data: hospital, error } = await supabase
            .from('hospitals')
            .select('id, name, slug')
            .eq('slug', hospitalSlug)
            .eq('active', true)
            .single();

          if (error) {
            console.error('Hospital não encontrado:', error);
            navigate('/');
            return;
          }

          // Verificar se o usuário tem acesso a este hospital
          if (profile.role === 'admin_platform') {
            // Admin da plataforma pode ver qualquer hospital
            setCurrentHospital(hospital);
          } else if (profile.hospital_id === hospital.id) {
            // Usuário do hospital pode ver apenas seu próprio hospital
            setCurrentHospital(hospital);
          } else {
            // Usuário não tem acesso a este hospital
            console.error('Usuário não tem acesso a este hospital');
            navigate('/unauthorized');
            return;
          }
        } else {
          // Se não há slug na URL, redirecionar para o hospital do usuário
          if (profile.role !== 'admin_platform' && profile.hospital_id) {
            const { data: hospital, error } = await supabase
              .from('hospitals')
              .select('id, name, slug')
              .eq('id', profile.hospital_id)
              .eq('active', true)
              .single();

            if (hospital && !error) {
              const currentPath = location.pathname;
              const newPath = `/hospital/${hospital.slug}${currentPath}`;
              navigate(newPath, { replace: true });
              return;
            }
          } else if (profile.role === 'admin_platform') {
            // Admin da plataforma vai para dashboard geral
            setCurrentHospital(null);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do hospital:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadHospitalData();
  }, [hospitalSlug, profile, navigate, location.pathname]);

  const buildPath = (path: string) => {
    if (currentHospital) {
      return `/hospital/${currentHospital.slug}${path}`;
    }
    return path;
  };

  const goToHospital = (slug: string, path = '/') => {
    navigate(`/hospital/${slug}${path}`);
  };

  return {
    currentHospital,
    hospitalSlug,
    loading,
    buildPath,
    goToHospital,
  };
}