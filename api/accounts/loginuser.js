const validator = require('validator');

exports.doYourJob = function (db, userMail, userPass, newNotification) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(userMail)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });

    db.select('id', 'email').from('accounts')
      .where('email', '=', userMail)
      .and('pass', '=', 'crypt(\'' + userPass + '\',pass)')
      .run()
      .then((result) => {
        if (result.length === 0) {
          logger.error('Wrong try to login for ' + userMail);
          reject({ errorType: 'auth', message: 'Sorry, the mail and password do not match.' });
        } else {
          // eslint-disable-next-line no-lonely-if
          if (newNotification != undefined) {
            db.insert({
              account: userMail,
              query: newNotification,
              frequency: 2,
              minrelevance: 4,
              where: userMail,
              created: 'to_timestamp(' + (Date.now() / 1000) + ')',
            }).into('accounts_notifications').run()
              .then(() => {
                logger.info('Successful login for ' + userMail + ' with new notification for ' + newNotification);
                resolve({ message: 'Welcome, ' + userMail + '!' });
              })
              .catch((e) => {
                logger.error(e.toString());
                reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
              });
          } else {
            logger.info('Successful login for ' + userMail);
            resolve({ message: 'Welcome, ' + userMail + '!' });
          }
        }
      })
      .catch((e) => {
        logger.error(e.toString());
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
