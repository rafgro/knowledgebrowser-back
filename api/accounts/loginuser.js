const validator = require('validator');

exports.doYourJob = function (db, userMail, userPass) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(userMail)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });

    db.select('id', 'email').from('accounts')
      .where('email', '=', '$userMail')
      .and('pass', '=', 'crypt(\'' + userPass + '\', pass)')
      .run({ userMail })
      .then((result) => {
        if (result.length === 0) {
          logger.error('Wrong try to login for ' + userMail);
          reject({ errorType: 'auth', message: 'Sorry, the mail and password do not match. If you forgot the password, <a href="https://knowledgebrowser.org/forgotten-password">click here</a>.' });
        } else {
          logger.info('Successful login for ' + userMail);
          resolve({ message: 'Welcome, ' + userMail + '!' });
        }
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
