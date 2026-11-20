import { FollowButton as SharedFollowButton, type FollowControl } from '../../../shared/ui/FollowButton'

/**
 * Seguir en Perfil (Figma · Button Follow 14296:3462). Reutiliza el botón compartido; sin `control`
 * queda sin acción hasta que Perfil use los endpoints de seguir (siguiente módulo).
 */
export function FollowButton({ name, control, className }: { name: string; control?: FollowControl; className?: string }) {
  return <SharedFollowButton name={name} control={control} className={className} />
}
