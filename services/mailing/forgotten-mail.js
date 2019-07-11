const nodemailer = require('nodemailer');

exports.doYourJob = function (whereToSend, generatedKey) {
  const transport = nodemailer.createTransport({
    host: 'ssd3.linuxpl.com',
    port: 587,
    auth: {
      user: 'hello@knowbrowser.org',
      pass: 'X4k2MfRCmvh63kak!',
    },
  });

  const mailOptions = {
    from: '"kb:preprints" <hello@knowledgebrowser.org>',
    to: whereToSend,
    subject: 'Setting new password for account in kb:preprints',
    text: 'Hello, If you want to set new password, please click here: https://knowledgebrowser.org/forgotten-password?key=' + generatedKey,
    html: 'Hello,<br/><br/>If you want to set new password, please click here: <a href="https://knowledgebrowser.org/forgotten-password?key=' + generatedKey + '">https://knowledgebrowser.org/forgotten?key=' + generatedKey + '</a>.<br/><br/>Kind regards,<br/>kb:preprints team',
  };

  // eslint-disable-next-line consistent-return
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return logger.error(error);
    }
    logger.info(info);
  });
};
