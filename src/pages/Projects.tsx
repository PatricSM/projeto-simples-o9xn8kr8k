import { ProjectCard, ProjectType } from '@/components/projects/project-card'
import { NewProjectDialog } from '@/components/projects/new-project-dialog'

const mockProjects: ProjectType[] = [
  {
    id: '1',
    name: 'Redesign do Website',
    progress: 75,
    status: 'Ativo',
    icon: 'Globe',
    team: [1, 2, 3],
  },
  {
    id: '2',
    name: 'Lançamento de Campanha',
    progress: 30,
    status: 'Atrasado',
    icon: 'Megaphone',
    team: [4, 5],
  },
  {
    id: '3',
    name: 'App Mobile v2',
    progress: 10,
    status: 'Em Planejamento',
    icon: 'Smartphone',
    team: [6, 1, 2],
  },
  {
    id: '4',
    name: 'Integração API',
    progress: 100,
    status: 'Concluído',
    icon: 'Server',
    team: [3],
  },
]

export default function Projects() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus fluxos de trabalho e equipes.</p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
