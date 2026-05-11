/**
 * Perfis de cores para a escala NPS (0–10) renderizada na pesquisa pública.
 *
 * A arquitetura é aberta: cada perfil é uma função pura que recebe (score, isSelected)
 * e devolve as classes Tailwind do botão. Para adicionar uma nova paleta, basta
 * registrar uma nova entrada no objeto `NPS_COLOR_PROFILES`.
 *
 * Backward compatibility: perguntas existentes sem `nps_color_profile` no `config`
 * usam o perfil `traffic_light`, preservando o visual original.
 */

export type NPSColorProfile = 'traffic_light' | 'mono_yellow'

type ProfileFn = (score: number, isSelected: boolean) => string

/**
 * Perfil "Semáforo" — comportamento original (vermelho/amarelo/verde).
 * Induz percepção emocional de nota boa/ruim.
 */
const trafficLight: ProfileFn = (score, isSelected) => {
  if (score <= 6) {
    return isSelected
      ? 'border-red-500 bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-500/25'
      : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 hover:border-red-400 text-red-600'
  }
  if (score <= 8) {
    return isSelected
      ? 'border-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/25'
      : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 hover:border-yellow-400 text-yellow-600'
  }
  return isSelected
    ? 'border-green-500 bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/25'
    : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 hover:border-green-400 text-green-600'
}

/**
 * Perfil "Monocromático Amarelo" — gradação suave em tons de amarelo,
 * neutro emocionalmente (não induz percepção bom/ruim pela cor).
 */
const monoYellow: ProfileFn = (score, isSelected) => {
  if (isSelected) {
    return 'border-yellow-600 bg-gradient-to-br from-yellow-500 to-yellow-700 text-white shadow-lg shadow-yellow-500/30'
  }
  if (score <= 3) {
    return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-300 text-yellow-700'
  }
  if (score <= 6) {
    return 'border-yellow-300 bg-yellow-100 hover:bg-yellow-200 hover:border-yellow-400 text-yellow-800'
  }
  if (score <= 8) {
    return 'border-yellow-400 bg-yellow-200 hover:bg-yellow-300 hover:border-yellow-500 text-yellow-900'
  }
  return 'border-yellow-500 bg-yellow-300 hover:bg-yellow-400 hover:border-yellow-600 text-yellow-900'
}

const NPS_COLOR_PROFILES: Record<NPSColorProfile, ProfileFn> = {
  traffic_light: trafficLight,
  mono_yellow: monoYellow,
}

/**
 * Lista de perfis disponíveis para uso no seletor do QuestionBuilder.
 * Manter ordem estável para previsibilidade na UI.
 */
export const NPS_COLOR_PROFILE_OPTIONS: Array<{ value: NPSColorProfile; label: string }> = [
  { value: 'traffic_light', label: 'Semáforo (vermelho/amarelo/verde)' },
  { value: 'mono_yellow', label: 'Monocromático amarelo' },
]

/**
 * Retorna as classes Tailwind do botão da escala NPS para um dado score,
 * estado de seleção e perfil escolhido. Faz fallback seguro para `traffic_light`
 * caso receba um perfil desconhecido (defesa contra dados antigos/inválidos).
 */
export function getNPSButtonClasses(
  score: number,
  isSelected: boolean,
  profile: NPSColorProfile | string | undefined | null,
): string {
  const fn = NPS_COLOR_PROFILES[(profile as NPSColorProfile) ?? 'traffic_light'] ?? trafficLight
  return fn(score, isSelected)
}
