exports.doYourJob = function (db, key, pass) {
  return new Promise((resolve, reject) => {
    db.select('email').from('accounts').where('forgotten', '=', '$key')
      .run({ key })
      .then((res) => {
        // check if the mail is not present in db
        if (res.length === 0) {
          reject({ errorType: 'database', message: 'There is no account requesting that password change.' });
        } else {
          db.update('accounts').set({
            pass: 'crypt(\'' + pass + '\',gen_salt(\'bf\'))',
            forgotten: null,
          }).where('forgotten', '=', '$key')
            .run({ key })
            .then(() => {
              logger.info('Changed password of ' + key);
              resolve({ message: 'You have successfully changed password.' });
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
