const validator = require('validator');
const confirmationMail = require('../../services/mailing/confirmation-mail');

exports.doYourJob = function (db, userMail, userPass, firstNotification) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(userMail)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });

    // 1. check if user exists
    db.select('email').from('accounts').where('email', '=', userMail)
      .run()
      .then((result) => {
        if (result.length === 0) {
          // 2. add to database
          const keyForUser = Math.random().toString(36).replace(/[^a-z]+/g, '');
          db.insert({
            email: userMail,
            pass: 'crypt(\'' + userPass + '\',gen_salt(\'bf\'))',
            mailconfirmation: keyForUser,
          }).into('accounts').run()
            .then(() => {
              // 3. add first notification if we need one
              // eslint-disable-next-line eqeqeq
              /* if (firstNotification != undefined) {
                db.insert({
                  account: userMail,
                  query: firstNotification,
                  frequency: 2,
                  minrelevance: 4,
                  where: userMail,
                  created: 'to_timestamp(' + (Date.now() / 1000) + ')',
                  hiddenid: 'crypt(\'' + userMail + (Date.now() / 1000) + '\',gen_salt(\'bf\'))',
                }).into('accounts_notifications').run()
                  .then(() => {
                    logger.info('Created account ' + userMail + ' with notification for ' + firstNotification);
                    resolve({ message: 'You have successfully signed up!' });
                  })
                  .catch((e) => {
                    logger.error(JSON.stringify(e));
                    reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
                  });
              } else { */
                logger.info('Created account ' + userMail);
                resolve({ message: 'You have successfully signed up!' });
              // }

              // 4. send confirmation mail
              confirmationMail.doYourJob(userMail, keyForUser);
            })
            .catch((e) => {
              logger.error(JSON.stringify(e));
              reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
            });
        } else {
          logger.error(userMail + ' exists');
          reject({ errorType: 'exists', message: 'Account with mail ' + userMail + ' exists.' });
        }
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
