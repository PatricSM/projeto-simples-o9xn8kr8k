import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Users as UsersIcon, Edit, Mail, Phone, Building2, Shield } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const userSchema = z.object({
  first_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  last_name: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.enum(['admin_platform', 'admin_hospital', 'user_hospital', 'viewer']),
  hospital_id: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface User {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: 'admin_platform' | 'admin_hospital' | 'user_hospital' | 'viewer'
  hospital_id: string | null
  active: boolean
  created_at: string
  hospital?: {
    name: string
  }
}

interface Hospital {
  id: string
  name: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  const selectedRole = watch('role')

  useEffect(() => {
    fetchUsers()
    fetchHospitals()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          hospital:hospitals(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setHospitals(data || [])
    } catch (error: any) {
      console.error('Error fetching hospitals:', error)
    }
  }

  const onSubmit = async (data: UserFormData) => {
    try {
      // Adjust hospital_id based on role
      const userData = {
        ...data,
        hospital_id: ['admin_platform'].includes(data.role) ? null : data.hospital_id,
      }

      if (editingUser) {
        const { error } = await supabase.from('profiles').update(userData).eq('id', editingUser.id)

        if (error) throw error

        toast({
          title: 'Usuário atualizado!',
          description: 'As informações do usuário foram atualizadas com sucesso.',
        })
      } else {
        // For new users, we would need to create the auth user first
        // This would typically be done through an admin function
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'A criação de novos usuários será implementada em breve.',
          variant: 'destructive',
        })
        return
      }

      setDialogOpen(false)
      setEditingUser(null)
      reset()
      fetchUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast({
        title: 'Erro ao salvar usuário',
        description: error.message || 'Ocorreu um erro ao salvar o usuário.',
        variant: 'destructive',
      })
    }
  }

  const toggleUserStatus = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !user.active })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: user.active ? 'Usuário desativado' : 'Usuário ativado',
        description: `O usuário foi ${user.active ? 'desativado' : 'ativado'} com sucesso.`,
      })

      fetchUsers()
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      hospital_id: user.hospital_id || '',
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    reset()
    setDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin_platform: { label: 'Admin Plataforma', variant: 'destructive' as const },
      admin_hospital: { label: 'Admin Hospital', variant: 'default' as const },
      user_hospital: { label: 'Usuário Hospital', variant: 'secondary' as const },
      viewer: { label: 'Visualizador', variant: 'outline' as const },
    }

    const roleInfo = roleMap[role as keyof typeof roleMap]
    return <Badge variant={roleInfo?.variant || 'secondary'}>{roleInfo?.label || role}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground">Gerencie os usuários da plataforma</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando usuários...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Atualize as informações do usuário.'
                  : 'Preencha os dados para cadastrar um novo usuário.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome *</Label>
                  <Input id="first_name" {...register('first_name')} placeholder="João" />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome *</Label>
                  <Input id="last_name" {...register('last_name')} placeholder="Silva" />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="joao@exemplo.com"
                  disabled={!!editingUser} // Don't allow email changes for existing users
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register('phone')} placeholder="(11) 99999-9999" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função *</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue('role', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_platform">Admin Plataforma</SelectItem>
                    <SelectItem value="admin_hospital">Admin Hospital</SelectItem>
                    <SelectItem value="user_hospital">Usuário Hospital</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>

              {selectedRole && !['admin_platform'].includes(selectedRole) && (
                <div className="space-y-2">
                  <Label htmlFor="hospital_id">Hospital *</Label>
                  <Select
                    value={watch('hospital_id')}
                    onValueChange={(value) => setValue('hospital_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingUser ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Lista de Usuários ({users.length})
          </CardTitle>
          <CardDescription>Usuários cadastrados na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Os usuários aparecerão aqui conforme forem se cadastrando.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone && (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {getRoleBadge(user.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.hospital ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.hospital.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.active}
                          onCheckedChange={() => toggleUserStatus(user)}
                        />
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
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
  )
}
