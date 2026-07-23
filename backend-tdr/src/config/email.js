const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = process.env.SMTP_FROM_NAME || 'Sistema TdR';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;

/**
 * Envía un email de notificación.
 * @param {object} options
 * @param {string} options.para - Email del destinatario
 * @param {string} options.asunto - Asunto del email
 * @param {string} options.html - Cuerpo en HTML
 */
async function enviarEmail({ para, asunto, html }) {
  if (!process.env.SMTP_USER) {
    console.warn('[email] SMTP no configurado, omitiendo envío a:', para);
    return { ok: false, skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: para,
      subject: asunto,
      html,
    });
    console.log('[email] Enviado:', info.messageId);
    return { ok: true };
  } catch (err) {
    console.error('[email] Error enviando a', para, ':', err.message);
    return { ok: false, error: err.message };
  }
}

function plantillaTdR({ codigo, denominacion, accion, nombreAdmin, observaciones }) {
  const esAprobado = accion === 'Validacion';
  const color = esAprobado ? '#16a34a' : '#ea580c';
  const titulo = esAprobado ? 'TdR Aprobado' : 'TdR Observado';
  const icono = esAprobado ? '&#9989;' : '&#9888;&#65039;';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${color}; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">${icono} ${titulo}</h2>
      </div>
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; margin: 0 0 12px;">Estimado/a usuario/a,</p>
        <p style="color: #374151; margin: 0 0 16px;">
          El Término de Referencia con código <strong>${codigo}</strong> ha sido
          <strong style="color: ${color};">${esAprobado ? 'aprobado' : 'observado'}</strong>
          por <strong>${nombreAdmin}</strong>.
        </p>
        <div style="background: white; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Denominación</p>
          <p style="margin: 4px 0 0; color: #111827;">${denominacion}</p>
        </div>
        ${observaciones ? `
        <div style="background: #fff7ed; padding: 12px 16px; border-radius: 6px; border: 1px solid #fed7aa; margin-bottom: 16px;">
          <p style="margin: 0; color: #9a3412; font-size: 12px; text-transform: uppercase; font-weight: bold;">Observaciones</p>
          <p style="margin: 4px 0 0; color: #7c2d12;">${observaciones}</p>
        </div>
        ` : ''}
        <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0;">
          Este es un correo automático del Sistema de Gestión de TdR. No responda directamente a este mensaje.
        </p>
      </div>
    </div>
  `;
}

module.exports = { enviarEmail, plantillaTdR };
