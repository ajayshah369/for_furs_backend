const pug = require('pug');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.welcomeMessage = async (to) => {
  const html = pug.renderFile('../templates/mail/welcome.pug');
  const msg = {
    to: to,
    from: process.env.SENDGRID_FROM,
    subject: 'Welcome to the ForFurs',
    text: 'Welcome to the For Furs\nYou successfully registered.',
    html: html,
  };
  await sgMail.send(msg);
};

exports.senOtp = async (to, otp) => {
  const html = pug.renderFile('../templates/mail/otp.pug', {
    otp: otp,
  });
  const msg = {
    to: to,
    from: process.env.SENDGRID_FROM,
    subject: 'Mail verification',
    text: `Your ForFurs verification code is: ${otp}\nvalid for 10 minutes only.`,
    html: html,
  };
  await sgMail.send(msg);
};

exports.mailVerified = async (to) => {
  const html = pug.renderFile('../templates/mail/mailVerified.pug');
  const msg = {
    to: to,
    from: process.env.SENDGRID_FROM,
    subject: 'Mail Verification complete',
    text: 'You successfully verified you Mail',
    html: html,
  };
  await sgMail.send(msg);
};
