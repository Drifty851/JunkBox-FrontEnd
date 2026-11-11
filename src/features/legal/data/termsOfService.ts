import type { LegalDocument } from '../models/legal.types'

/**
 * Términos de Servicio (México). PROPUESTA para revisión del propietario: los datos entre
 * corchetes los completa el responsable, y el texto debe revisarlo un profesional en derecho
 * antes de publicarse.
 */
export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Términos de Servicio',
  updatedAt: '6 de noviembre de 2026',
  intro:
    'Estos Términos regulan el uso de Junkbox, una red social para calificar, reseñar y descubrir música. Al crear una cuenta o usar Junkbox aceptas estos Términos y nuestro Aviso de Privacidad. Si no estás de acuerdo, no uses el servicio.',
  sections: [
    {
      heading: '1. Quién presta el servicio',
      blocks: [
        'Junkbox es un proyecto de [Nombre del responsable o del equipo de Junkbox], con domicilio en [domicilio completo]. Contacto: [correo de contacto].',
      ],
    },
    {
      heading: '2. Requisitos y cuenta',
      blocks: [
        [
          'Debes tener al menos [edad mínima] años o contar con la autorización de tu madre, padre o tutor.',
          'Los datos de tu cuenta deben ser verdaderos y mantenerse actualizados.',
          'Eres responsable de mantener tu contraseña en secreto y de la actividad que ocurra en tu cuenta. Avísanos de inmediato si detectas un uso no autorizado.',
          'Tu nombre de usuario es único y no debe suplantar a otra persona o marca.',
        ],
      ],
    },
    {
      heading: '3. Tu contenido',
      blocks: [
        'Las calificaciones y reseñas que publicas son tuyas y eres responsable de ellas. Al publicarlas nos das una licencia gratuita, no exclusiva y mundial para mostrarlas dentro de Junkbox mientras sigan publicadas.',
        'No está permitido publicar contenido que:',
        [
          'Sea ilegal, difamatorio, violento, discriminatorio o que acose a otras personas.',
          'Infrinja derechos de autor, marcas u otros derechos de terceros.',
          'Contenga datos personales de otras personas sin su consentimiento.',
          'Sea spam, publicidad no solicitada o engañosa.',
        ],
        'Podemos retirar contenido que incumpla estos Términos y, en casos graves o repetidos, suspender la cuenta.',
      ],
    },
    {
      heading: '4. Música y Spotify',
      blocks: [
        'El catálogo musical, las carátulas y los datos de canciones, álbumes y artistas provienen de Spotify y pertenecen a sus respectivos titulares. Junkbox no está afiliado, patrocinado ni respaldado por Spotify.',
        'La reproducción de canciones completas requiere vincular una cuenta de Spotify Premium y está sujeta a los términos de uso de Spotify. Puedes desvincular tu cuenta en cualquier momento desde Configuración.',
      ],
    },
    {
      heading: '5. Uso aceptable',
      blocks: [
        'No intentes vulnerar la seguridad de Junkbox, acceder a cuentas ajenas, extraer datos de forma automatizada ni interferir con el funcionamiento del servicio.',
      ],
    },
    {
      heading: '6. Propiedad intelectual de Junkbox',
      blocks: [
        'El nombre, el logotipo, el diseño y el software de Junkbox son propiedad de [Nombre del responsable o del equipo de Junkbox]. No puedes usarlos sin autorización previa y por escrito.',
      ],
    },
    {
      heading: '7. Disponibilidad y responsabilidad',
      blocks: [
        'Junkbox se ofrece "tal cual". Hacemos lo posible por mantenerlo disponible y seguro, pero no garantizamos que funcione sin interrupciones ni errores. En la medida que permita la ley, no somos responsables de daños indirectos derivados del uso del servicio ni del contenido publicado por los usuarios.',
      ],
    },
    {
      heading: '8. Baja de la cuenta',
      blocks: [
        'Puedes pedir la baja de tu cuenta escribiendo a [correo de contacto]. Nosotros podemos suspender o cancelar cuentas que incumplan estos Términos.',
      ],
    },
    {
      heading: '9. Cambios a estos Términos',
      blocks: [
        'Publicaremos cualquier cambio en esta página con su fecha de actualización. Si el cambio es relevante, te avisaremos por correo o dentro de Junkbox. Seguir usando el servicio después del aviso implica que aceptas los nuevos Términos.',
      ],
    },
    {
      heading: '10. Ley aplicable',
      blocks: [
        'Estos Términos se rigen por las leyes federales de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes de [ciudad], sin perjuicio de los derechos que te reconoce la Ley Federal de Protección al Consumidor.',
      ],
    },
  ],
}
