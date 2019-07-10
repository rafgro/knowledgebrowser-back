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
    subject: 'Confirm mail address for kb:preprints',
    text: 'Hello, Please confirm signing up by clicking here: https://knowledgebrowser.org/account/confirm?mail=' + generatedKey,
    html: 'Hello,<br/><br/>Please confirm signing up by clicking here: <a href="https://knowledgebrowser.org/account/confirm?mail=' + generatedKey + '">https://knowledgebrowser.org/account/confirm?mail=' + generatedKey + '</a>.<br/><br/>Kind regards,<br/>kb:preprints team',
  };

  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return logger.error(error);
    }
    logger.info(info);
    logger.info('Confirmation mail sent to ' + whereToSend);
  });
};
