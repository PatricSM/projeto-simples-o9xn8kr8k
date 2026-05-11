import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutDashboard, CheckSquare, Calendar, Settings, Hexagon } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Projetos', url: '/projetos', icon: LayoutDashboard },
  { title: 'Tarefas', url: '/tarefas', icon: CheckSquare },
  { title: 'Calendário', url: '#', icon: Calendar },
  { title: 'Configurações', url: '#', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r shadow-sm">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
            <Hexagon className="size-6 fill-primary/20" />
          </div>
          <span className="text-xl font-bold tracking-tight">Nexus</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url} className="h-10">
                        <item.icon className="size-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
