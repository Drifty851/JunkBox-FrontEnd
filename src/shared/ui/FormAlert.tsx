import alertCircleIcon from '../../assets/icons/alert-circle.svg'

interface FormAlertProps {
  message: string
}

/**
 * Mensaje de error general del formulario (por ejemplo 401 "credenciales inválidas" o fallo de red).
 *
 * PROVISIONAL: Figma no tiene todavía un estado de error del servicio («No se define aquí
 * ciclo de sesión, errores del servicio ni destinos», nota del LoginForm). Se reutilizan el
 * icono alert-circle y el estilo del ErrorIndicator (Caption/12, text/primary) para no
 * inventar estilos nuevos. Hay que sustituirlo cuando diseño lo defina.
 */
export function FormAlert({ message }: FormAlertProps) {
  return (
    <p role="alert" className="flex w-full items-start gap-1 text-xs leading-[1.4] text-fg">
      <img src={alertCircleIcon} alt="" width={16} height={16} aria-hidden="true" className="shrink-0" />
      <span>{message}</span>
    </p>
  )
}
