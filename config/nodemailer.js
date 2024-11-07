const nodemailer = require("nodemailer");

const { MAIL_SERVICE, MAIL_USER, MAIL_PASS } = process.env;

/*const transporter = nodemailer.createTransport({
    service: MAIL_SERVICE,
    secure: true, // use SSL
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});*/

// Looking to send emails in production? Check out our Email API/SMTP product!
var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "207fb16dd5d8ad",
      pass: "38a860cff86ade"
    }
  });

module.exports = { transporter };
