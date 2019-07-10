const confirmationMail = require('../../services/mailing/confirmation-mail');

exports.doChangeUserMail = function (db, oldmail, pass, newmail) {
  return new Promise((resolve, reject) => {
    db.select('email').from('accounts').where('email', '=', newmail)
      .run()
      .then((res) => {
        // check if the mail is not present in db
        if (res.length > 0) {
          logger.error(oldmail + ' tried to change to existing mail ' + newmail);
          reject({ errorType: 'database', message: 'There is another account registered under this mail.' });
        } else {
          const keyForUser = Math.random().toString(36).replace(/[^a-z]+/g, '');
          db.update('accounts').set({
            email: newmail,
            mailconfirmation: keyForUser,
          }).where('email', '=', oldmail)
            .and('pass', '=', 'crypt(\'' + pass + '\',pass)')
            .run()
            .then(() => {
              confirmationMail.doYourJob(newmail, keyForUser);
              logger.info('Changed mail for ' + oldmail + ' to ' + newmail);

              // update notifications assigned to this mail
              db.update('accounts_notifications').set({
                account: newmail,
                where: newmail,
              }).where('account', '=', oldmail)
                .run()
                .then(() => {
                  logger.info('Updated notification for user');
                  resolve({ message: 'You have successfully changed mail.' });
                })
                .catch((e) => {
                  logger.error(e);
                  reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
                });
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

exports.doChangeUserPass = function (db, mail, oldpass, newpass) {
  return new Promise((resolve, reject) => {
    db.update('accounts').set({
      pass: 'crypt(\'' + newpass + '\',gen_salt(\'bf\'))',
    }).where('email', '=', mail)
      .and('pass', '=', 'crypt(\'' + oldpass + '\',pass)')
      .run()
      .then(() => {
        logger.info('Changed password for ' + mail);
        resolve({ message: 'You have successfully changed password.' });
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
