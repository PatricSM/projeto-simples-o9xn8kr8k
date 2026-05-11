import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Globe, Smartphone, Megaphone, Server } from 'lucide-react'

export interface ProjectType {
  id: string
  name: string
  progress: number
  status: 'Em Planejamento' | 'Ativo' | 'Atrasado' | 'Concluído'
  icon: string
  team: number[]
}

const Icons: Record<string, any> = { Globe, Smartphone, Megaphone, Server }

export function ProjectCard({ project }: { project: ProjectType }) {
  const Icon = Icons[project.icon] || Globe

  return (
    <Card className="hover-card-highlight border-muted bg-card">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold leading-none mb-1">{project.name}</h3>
            <p className="text-xs text-muted-foreground">Atualizado há 2h</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 grid gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />

        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-2">
            {project.team.map((seed, i) => (
              <Avatar key={i} className="border-2 border-background h-8 w-8">
                <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${seed}`} />
                <AvatarFallback>U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Badge
            variant="outline"
            className={
              project.status === 'Atrasado'
                ? 'text-destructive border-destructive'
                : project.status === 'Concluído'
                  ? 'text-emerald-500 border-emerald-500'
                  : project.status === 'Ativo'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground'
            }
          >
            {project.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
