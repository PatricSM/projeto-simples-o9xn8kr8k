import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Building2, Edit, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const hospitalSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor primária deve ser um hexadecimal válido').optional(),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor secundária deve ser um hexadecimal válido').optional(),
});

type HospitalFormData = z.infer<typeof hospitalSchema>;

interface Hospital {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
}

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: {
      primary_color: '#FACC15',
      secondary_color: '#E5E7EB',
    }
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHospitals(data || []);
    } catch (error: any) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: "Erro ao carregar hospitais",
        description: "Não foi possível carregar a lista de hospitais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: HospitalFormData) => {
    try {
      if (editingHospital) {
        const { error } = await supabase
          .from('hospitals')
          .update({
            name: data.name,
            slug: data.slug,
            contact_email: data.contact_email || null,
            contact_phone: data.contact_phone || null,
            address: data.address || null,
            primary_color: data.primary_color,
            secondary_color: data.secondary_color,
          })
          .eq('id', editingHospital.id);

        if (error) throw error;
        
        toast({
          title: "Hospital atualizado!",
          description: "As informações do hospital foram atualizadas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('hospitals')
          .insert([{
            name: data.name,
            slug: data.slug,
            contact_email: data.contact_email || null,
            contact_phone: data.contact_phone || null,
            address: data.address || null,
            primary_color: data.primary_color,
            secondary_color: data.secondary_color,
          }]);

        if (error) throw error;
        
        toast({
          title: "Hospital cadastrado!",
          description: "O hospital foi cadastrado com sucesso.",
        });
      }

      setDialogOpen(false);
      setEditingHospital(null);
      reset();
      fetchHospitals();
    } catch (error: any) {
      console.error('Error saving hospital:', error);
      toast({
        title: "Erro ao salvar hospital",
        description: error.message || "Ocorreu um erro ao salvar o hospital.",
        variant: "destructive",
      });
    }
  };

  const toggleHospitalStatus = async (hospital: Hospital) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ active: !hospital.active })
        .eq('id', hospital.id);

      if (error) throw error;

      toast({
        title: hospital.active ? "Hospital desativado" : "Hospital ativado",
        description: `O hospital foi ${hospital.active ? 'desativado' : 'ativado'} com sucesso.`,
      });

      fetchHospitals();
    } catch (error: any) {
      console.error('Error toggling hospital status:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do hospital.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (hospital: Hospital) => {
    setEditingHospital(hospital);
    reset({
      name: hospital.name,
      slug: hospital.slug,
      contact_email: hospital.contact_email || '',
      contact_phone: hospital.contact_phone || '',
      address: hospital.address || '',
      primary_color: hospital.primary_color,
      secondary_color: hospital.secondary_color,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingHospital(null);
    reset({
      primary_color: '#FACC15',
      secondary_color: '#E5E7EB',
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hospitais</h1>
            <p className="text-muted-foreground">Gerencie os hospitais cadastrados na plataforma</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando hospitais...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospitais</h1>
          <p className="text-muted-foreground">
            Gerencie os hospitais cadastrados na plataforma
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Hospital
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingHospital ? 'Editar Hospital' : 'Cadastrar Hospital'}
              </DialogTitle>
              <DialogDescription>
                {editingHospital 
                  ? 'Atualize as informações do hospital.'
                  : 'Preencha os dados para cadastrar um novo hospital.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Hospital *</Label>
                <Input
                  id="name" 
                  {...register('name')}
                  placeholder="Ex: Hospital São João"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="ex: hospital-sao-joao"
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register('contact_email')}
                  placeholder="contato@hospital.com"
                />
                {errors.contact_email && (
                  <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  {...register('contact_phone')}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Rua, Número, Bairro, Cidade"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    {...register('primary_color')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <Input
                    id="secondary_color"
                    type="color"
                    {...register('secondary_color')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? 'Salvando...' 
                    : editingHospital ? 'Atualizar' : 'Cadastrar'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Hospitais ({hospitals.length})
          </CardTitle>
          <CardDescription>
            Hospitais cadastrados e suas informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hospitals.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum hospital cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando o primeiro hospital da plataforma.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Hospital
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cores</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{hospital.name}</div>
                        <div className="text-sm text-muted-foreground">
                          /{hospital.slug}
                        </div>
                        {hospital.address && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {hospital.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {hospital.contact_email && (
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {hospital.contact_email}
                          </div>
                        )}
                        {hospital.contact_phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {hospital.contact_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hospital.active}
                          onCheckedChange={() => toggleHospitalStatus(hospital)}
                        />
                        <Badge variant={hospital.active ? "default" : "secondary"}>
                          {hospital.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: hospital.primary_color }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: hospital.secondary_color }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(hospital)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}