const nodemailer = require('nodemailer');
const path = require('path');

const EmailEnums = Object.freeze({
  otp: 'otp',
  error: 'error',
  passwordReset: 'passwordReset',
});

const EmailTempletes = Object.freeze({
  otp: 'otp',
  error: 'error',
  passwordReset: 'passwordReset',
});

const handlebarsOptions = {
  viewEngine: {
    partialsDir: path.resolve('./views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./views/'),
};

// Create a function to get the handlebars middleware that uses dynamic import
async function getHandlebarsMiddleware() {
  // Dynamic import for nodemailer-express-handlebars (ESM module)
  const hbsModule = await import('nodemailer-express-handlebars');
  return hbsModule.default;
}

const sendMail = async ({ email, subject, otp, template, type, context }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Dynamically import and use the handlebars middleware
    const hbs = await getHandlebarsMiddleware();
    transporter.use('compile', hbs(handlebarsOptions));

    switch (type) {
      case EmailEnums.otp:
        // For sending Otp mail
        const mailOptions = {
          from: `"WebCom Solution" <${process.env.SMTP_MAIL}>`,
          template,
          to: email,
          subject: subject || 'Your Verification Code',
          context: {
            ...context,
            otp,
          },
        };
        await transporter.sendMail(mailOptions);
        break;

      case EmailEnums.passwordReset:
        // For sending password reset mail
        const resetOptions = {
          from: `"WebCom Solution" <${process.env.SMTP_MAIL}>`,
          template: template || 'passwordReset',
          to: email,
          subject: subject || 'Password Reset Request',
          context: {
            ...context,
            companyName: 'WebCom Solution',
            year: new Date().getFullYear(),
          },
        };
        await transporter.sendMail(resetOptions);
        break;

      case EmailEnums.error:
        // For sending error mail
        const errorOptions = {
          from: `"WebCom Solution" <${process.env.SMTP_MAIL}>`,
          template,
          to: 'solangimuqueet@gmail.com',
          subject: 'Error in API',
          context,
        };
        await transporter.sendMail(errorOptions);
        break;

      default:
        console.log(`Unhandled email type: ${type}`);
        break;
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendMail,
  EmailEnums,
  EmailTempletes,
};
