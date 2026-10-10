import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js to prefer IPv4 over IPv6 for DNS lookups to fix ENETUNREACH errors
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

export const sendMail = async (to: string, subject: string, html: string) => {
  // In a real production app, configure these via environment variables
  // For this MVP/Demo we'll use a mocked setup or ethereal email if variables are missing
  const port = Number(process.env.SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.split(' ')[0] || 'smtp.ethereal.email',
    port: port,
    secure: port === 465, // true for 465, false for other ports
    // @ts-ignore - Nodemailer passes this to net.connect to force IPv4
    family: 4, // <-- Forces IPv4 to bypass ENETUNREACH for IPv6
    auth: {
      user: process.env.SMTP_USER?.split(' ')[0] || 'ethereal.user@ethereal.email',
      pass: process.env.SMTP_PASS?.split('#')[0].trim() || 'ethereal_password',
    },
  });

  try {
    // Log the email content explicitly so the developer can see the OTP if the network blocks it
    console.log('\n====== [ LOCAL DEV: OTP EMAIL ] ======');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    // Extract just the OTP number for easy copying in the console (matches 6 digits)
    const otpMatch = html.match(/\b\d{6}\b/);
    console.log(`OTP Code: ${otpMatch ? otpMatch[0] : 'Error parsing HTML'}`);
    console.log('======================================\n');

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SamaySetu" <noreply@samaysetu.demo>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error: any) {
    console.error('\n❌ SMTP Connection Failed (Likely blocked by your ISP/Firewall):', error.message);
    console.log('✅ BYPASSING ERROR FOR LOCAL DEV: Since the OTP was logged above, the app will continue as if the email was sent so you can test the UI!\n');
    return { messageId: 'mocked-due-to-network-error' };
  }
};
