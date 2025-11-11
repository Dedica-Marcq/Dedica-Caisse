const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendFacture({ to, subject, message, pdfPath }) {
  const transporter = nodemailer.createTransport({
    host: 'mail.dedica-marcq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'contact@dedica-marcq.com',
      pass: '***',
    },
  });

  const mailFacture = fs.readFileSync(path.join(__dirname, 'mail.html'), 'utf-8');

  const mailOptions = {
    from: 'Festival Dédica\'Marcq <contact@dedica-marcq.com>',
    to,
    subject,
    replyTo: 'contact@dedica-marcq.com',
    encoding: 'utf-8',
    html: `${mailFacture}<br>`,
    attachments: [
      {
        filename: path.basename(pdfPath),
        path: pdfPath,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { sendFacture };