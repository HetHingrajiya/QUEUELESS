import nodemailer from 'nodemailer';

export const sendMail = async (to: string, subject: string, html: string) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"SamaySetu" <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully: %s', info.messageId);
    return info;
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};
