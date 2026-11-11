import type { LegalDocument } from '../models/legal.types'

/**
 * Aviso de Privacidad Integral (México, LFPDPPP). PROPUESTA para revisión del propietario:
 * los datos entre corchetes los completa el responsable, y el texto debe revisarlo un
 * profesional en derecho antes de publicarse. Describe solo lo que hoy hace Junkbox
 * (backend en el commit 6d77d4d y frontend con Spotify por PKCE).
 */
export const PRIVACY_NOTICE: LegalDocument = {
  title: 'Aviso de Privacidad',
  updatedAt: '6 de noviembre de 2026',
  intro:
    'En Junkbox protegemos tus datos personales. Este Aviso de Privacidad Integral explica qué datos recabamos, para qué los usamos y cómo puedes ejercer tus derechos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
  sections: [
    {
      heading: '1. Responsable',
      blocks: [
        '[Nombre del responsable o del equipo de Junkbox], con domicilio en [domicilio completo], es responsable del uso y protección de tus datos personales.',
        'Para cualquier asunto relacionado con este aviso, escríbenos a [correo de privacidad].',
      ],
    },
    {
      heading: '2. Datos personales que recabamos',
      blocks: [
        'Recabamos los datos que nos proporcionas directamente al usar Junkbox:',
        [
          'Identificación y contacto: nombre de usuario, nombre visible (opcional) y correo electrónico.',
          'Imagen de perfil: la que elijas o, si no eliges una, un avatar ilustrado generado a partir de tu nombre de usuario.',
          'Autenticación: tu contraseña, que guardamos cifrada de forma irreversible (nunca en texto plano), y los datos técnicos de tus sesiones.',
          'Actividad en la plataforma: las calificaciones y reseñas que publiques.',
          'Cuenta de Spotify, solo si decides vincularla: identificador y nombre de tu perfil de Spotify, tipo de suscripción y los permisos de acceso que Spotify nos otorga para reproducir música.',
        ],
        'No recabamos datos personales sensibles ni datos financieros.',
      ],
    },
    {
      heading: '3. Finalidades',
      blocks: [
        'Usamos tus datos para estas finalidades necesarias para el servicio:',
        [
          'Crear, administrar y proteger tu cuenta, e iniciar sesión.',
          'Mostrar tu perfil público (nombre visible, nombre de usuario e imagen), tus calificaciones y tus reseñas.',
          'Buscar música y, si vinculas Spotify, reproducirla desde Junkbox.',
          'Enviarte correos del servicio, como la verificación de tu correo y la recuperación de tu contraseña.',
          'Prevenir fraudes y usos indebidos de la plataforma.',
        ],
        'Además, con finalidades secundarias que no son necesarias para el servicio:',
        [
          'Generar recomendaciones musicales personalizadas a partir de tu actividad.',
          'Elaborar estadísticas para mejorar Junkbox.',
        ],
        'Si no quieres que usemos tus datos para las finalidades secundarias, escríbenos a [correo de privacidad]. Negarte no afecta tu acceso al servicio.',
      ],
    },
    {
      heading: '4. Transferencias y proveedores',
      blocks: [
        'No vendemos tus datos personales. Para operar Junkbox nos apoyamos en estos proveedores, que tratan datos por nuestra cuenta o a petición tuya:',
        [
          'Spotify AB: catálogo musical y, si vinculas tu cuenta, reproducción. Lo que Spotify haga con tus datos se rige por su propia política de privacidad.',
          'DiceBear: genera el avatar ilustrado a partir de tu nombre de usuario.',
          '[Proveedor de correo electrónico]: envío de los correos del servicio.',
          '[Proveedor de alojamiento]: servidores donde se guarda la información.',
        ],
        'Fuera de estos casos, solo compartiremos tus datos sin tu consentimiento en los supuestos que permite la LFPDPPP o cuando lo ordene una autoridad competente.',
      ],
    },
    {
      heading: '5. Derechos ARCO',
      blocks: [
        'Tienes derecho a conocer qué datos tenemos de ti (Acceso), a corregirlos (Rectificación), a pedir que los eliminemos (Cancelación) y a oponerte a su uso para fines específicos (Oposición).',
        'Para ejercerlos, envía una solicitud a [correo de privacidad] con:',
        [
          'Tu nombre y el correo de tu cuenta, para comunicarte la respuesta.',
          'Un documento que acredite tu identidad o, en su caso, la de tu representante.',
          'La descripción clara de los datos y del derecho que quieres ejercer.',
        ],
        'Te responderemos en un máximo de 20 días hábiles, y si la solicitud procede la haremos efectiva dentro de los 15 días hábiles siguientes, según los plazos de la LFPDPPP.',
      ],
    },
    {
      heading: '6. Revocación del consentimiento',
      blocks: [
        'Puedes revocar en cualquier momento el consentimiento que nos diste, con el mismo procedimiento de la sección anterior. Ten en cuenta que, si la revocación afecta a una finalidad necesaria, quizá no podamos seguir prestándote el servicio.',
        'Puedes desvincular tu cuenta de Spotify en cualquier momento desde Configuración.',
      ],
    },
    {
      heading: '7. Almacenamiento en tu navegador',
      blocks: [
        'Junkbox no usa cookies de publicidad ni de rastreo. Guardamos en el almacenamiento local de tu navegador los datos técnicos necesarios para mantener tu sesión y, si la vinculas, tu conexión con Spotify. Al cerrar sesión se borran los datos de la sesión.',
      ],
    },
    {
      heading: '8. Seguridad y conservación',
      blocks: [
        'Aplicamos medidas de seguridad administrativas, técnicas y físicas para proteger tus datos. Los conservamos mientras tu cuenta esté activa y, después, solo el tiempo que exijan las obligaciones legales aplicables.',
      ],
    },
    {
      heading: '9. Cambios a este aviso',
      blocks: [
        'Publicaremos cualquier cambio en esta misma página, con su fecha de actualización. Si el cambio es relevante, también te avisaremos por correo o dentro de Junkbox.',
      ],
    },
    {
      heading: '10. Autoridad',
      blocks: [
        'Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir a la autoridad competente en la materia ([autoridad garante vigente]).',
      ],
    },
  ],
}
