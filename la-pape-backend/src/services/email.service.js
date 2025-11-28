import nodemailer from "nodemailer";

const smtpUser = process.env.BREVO_SMTP_USER;
const smtpPass = process.env.BREVO_SMTP_PASS;
const mailFrom = process.env.MAIL_FROM;

const smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = Number(process.env.BREVO_SMTP_PORT || 587);

const hasSMTP = Boolean(smtpUser && smtpPass && mailFrom);

let transporter = null;

if (hasSMTP) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log("📧 SMTP habilitado (Brevo).");
} else {
  console.log("📭 SMTP NO configurado. MODO DEV: los códigos se imprimirán en consola.");
}

export async function sendMail({ to, subject, html, devLog }) {
  if (!hasSMTP) {
    console.log("\n----- DEV MAIL -----");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);
    if (devLog) console.log(devLog);
    console.log("HTML:\n", html);
    console.log("--------------------\n");
    return { messageId: "dev-mail" };
  }

  return transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    html,
  });
}

export const templates = {
  otp: (code, title = "Tu código de seguridad") => `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>${title}</h2>
      <p>Tu código es:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
      <p>Este código expira en 10 minutos.</p>
      <p>Si tú no solicitaste este código, ignora este correo.</p>
    </div>
  `,
  accountVerified: (nombre) => `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>¡Hola ${nombre}!</h2>
      <p>Tu cuenta en <strong>La Pape</strong> ha sido verificada correctamente.</p>
      <p>Ya puedes iniciar sesión y continuar usando la plataforma.</p>
    </div>
  `,
};
