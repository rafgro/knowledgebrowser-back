const forgottenMail = require('../../services/mailing/forgotten-mail');

exports.doYourJob = function (db, mail) {
  return new Promise((resolve, reject) => {
    db.select('email').from('accounts').where('email', '=', '$mail')
      .run({ mail })
      .then((res) => {
        // check if the mail is not present in db
        if (res.length === 0) {
          reject({ errorType: 'database', message: 'There is no account registered under this mail.' });
        } else {
          const keyForUser = [...Array(15)].map(() => Math.random().toString(36)[2]).join('');
          db.update('accounts').set({
            forgotten: '$keyForUser',
          }).where('email', '=', '$mail')
            .run({ keyForUser, mail })
            .then(() => {
              forgottenMail.doYourJob(mail, keyForUser);
              logger.info('Sent forgotten mail to ' + mail);
              resolve({ message: 'You have requested change of password.' });
            })
            .catch((e) => {
              logger.error(e);
              reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
            });
        }
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
