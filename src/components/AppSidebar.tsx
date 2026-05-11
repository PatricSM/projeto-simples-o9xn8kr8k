import {
  BarChart3,
  Building2,
  Megaphone,
  Heart,
  Home,
  MessageSquare,
  Settings,
  Users,
  LogOut,
  User,
  ArrowLeft,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useHospitalRoute } from '@/hooks/use-hospital-route'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AppSidebarProps {
  hospitalContext?: {
    hospitalId: string
    hospitalName: string
    onBackToPlatform: () => void
  } | null
}

// Menu items para diferentes tipos de usuário
const platformAdminItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Hospitais', url: '/hospitals', icon: Building2 },
  { title: 'Usuários', url: '/users', icon: Users },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Configurações', url: '/settings', icon: Settings },
]

const hospitalItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Campanhas', url: '/campaigns', icon: Megaphone },
  { title: 'Respostas NPS', url: '/responses', icon: MessageSquare },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Equipe', url: '/team', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
]

// Menu items para quando está visualizando um hospital específico
const hospitalViewItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Campanhas', url: '/campaigns', icon: Megaphone },
  { title: 'Respostas NPS', url: '/responses', icon: MessageSquare },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Equipe', url: '/team', icon: Users },
  { title: 'Configurações', url: '/settings', icon: Settings },
]

export function AppSidebar({ hospitalContext }: AppSidebarProps) {
  const { state } = useSidebar()
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const { buildPath, currentHospital } = useHospitalRoute()
  const collapsed = state === 'collapsed'

  const getMenuItems = () => {
    // Se estamos em rota específica do hospital, usa o menu do hospital
    if (currentHospital || hospitalContext) {
      return hospitalViewItems
    }

    // Senão, usa o menu baseado no role do usuário
    if (profile?.role === 'admin_platform') {
      return platformAdminItems
    }
    return hospitalItems
  }

  const getContextTitle = () => {
    if (currentHospital) {
      return currentHospital.name
    }
    if (hospitalContext) {
      return hospitalContext.hospitalName
    }
    return profile?.role === 'admin_platform' ? 'Admin Plataforma' : 'Hospital'
  }

  const getGroupLabel = () => {
    if (currentHospital || hospitalContext) {
      return !collapsed ? 'Menu do Hospital' : ''
    }
    return !collapsed
      ? profile?.role === 'admin_platform'
        ? 'Administração'
        : 'Menu Principal'
      : ''
  }

  const menuItems = getMenuItems()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === '/') {
      // Para dashboard, verifica se estamos na raiz do hospital ou plataforma
      if (currentHospital) {
        return (
          currentPath === `/hospital/${currentHospital.slug}/` ||
          currentPath === `/hospital/${currentHospital.slug}`
        )
      }
      return currentPath === '/'
    }

    // Para outras rotas, verifica se o path atual contém a rota
    if (currentHospital) {
      const fullPath = `/hospital/${currentHospital.slug}${path}`
      return currentPath.startsWith(fullPath)
    }
    return currentPath.startsWith(path)
  }

  const getNavClasses = (path: string) => {
    const active = isActive(path)
    return active
      ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
      : 'hover:bg-muted/50 text-foreground'
  }

  const getLinkPath = (path: string) => {
    // Se estamos em contexto de hospital específico, constrói o path completo
    if (currentHospital) {
      return buildPath(path)
    }
    // Senão, usa o path direto
    return path
  }

  const getUserInitials = () => {
    if (!profile) return 'U'
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'}>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <h1 className="font-bold text-lg">NPS Analytics</h1>
              <p className="text-xs text-muted-foreground">{getContextTitle()}</p>
            </div>
          )}
          {!collapsed && hospitalContext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={hospitalContext.onBackToPlatform}
              className="ml-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{getGroupLabel()}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={getLinkPath(item.url)} className={getNavClasses(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-3">
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink
                    to={currentHospital ? buildPath('/profile') : '/profile'}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink
                    to={currentHospital ? buildPath('/profile') : '/profile'}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
