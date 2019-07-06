const validator = require('validator');

exports.doYourJob = function (db, userMail, userPass) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(userMail)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });

    // 1. check if user exists
    db.select('email').from('accounts').where('email', '=', userMail)
      .run()
      .then((result) => {
        if (result.length === 0) {
          // 2. add to database
          db.insert({
            email: userMail,
            pass: 'crypt(\'' + userPass + '\',gen_salt(\'bf\'))',
          }).into('accounts').run()
            .then(() => {
              // 3. return positive result
              logger.info('Created account ' + userMail);
              resolve({ message: 'You have successfully signed up!' });
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
