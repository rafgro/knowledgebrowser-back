const validator = require('validator');
const confirmationMail = require('../../services/mailing/confirmation-mail');

exports.doYourJob = function (db, userMail, userPass) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(userMail)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });

    // 1. check if user exists
    db.select('email').from('accounts').where('email', '=', '$userMail')
      .run({ userMail })
      .then((result) => {
        if (result.length === 0) {
          // 2. add to database
          // const keyForUser = Math.random().toString(36).replace(/[^a-z]+/g, '');
          const keyForUser = [...Array(15)].map(() => Math.random().toString(36)[2]).join('');
          db.insert({
            email: '$userMail',
            pass: 'crypt(\'' + userPass + '\', gen_salt(\'bf\'))',
            mailconfirmation: '$keyForUser',
          }).into('accounts')
            .run({ userMail, keyForUser })
            .then(() => {
              logger.info('Created account ' + userMail);
              resolve({ message: 'You have successfully signed up!' });
              // 3. send confirmation mail
              confirmationMail.doYourJob(userMail, keyForUser);
            })
            .catch((e) => {
              logger.error(e);
              reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
            });
        } else {
          logger.error(userMail + ' exists');
          reject({ errorType: 'exists', message: 'Account with mail ' + userMail + ' exists.' });
        }
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
