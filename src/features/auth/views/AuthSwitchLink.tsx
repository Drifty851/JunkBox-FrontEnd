import { Link } from 'react-router'

interface AuthSwitchLinkProps {
  prompt: string
  label: string
  to: string
}

/**
 * Texto de AuthFooter: "¿Aún no tienes cuenta? Regístrate" / "¿Ya tienes una cuenta? Iniciar sesión".
 * Enlace en Body/14/SemiBold subrayado: negro en claro y brand/accent en oscuro.
 */
export function AuthSwitchLink({ prompt, label, to }: AuthSwitchLinkProps) {
  return (
    <>
      {`${prompt} `}
      <Link
        to={to}
        className="rounded font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {label}
      </Link>
    </>
  )
}
