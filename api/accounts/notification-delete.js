const validator = require('validator');

exports.doYourJob = function (db, account, hiddenid) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(account)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });

    db.update('accounts_notifications').set({
      account: 'deleted@deleted.deleted',
    }).where('account', '=', '$account')
      .and('hiddenid', '=', '$hiddenid')
      .run({ account, hiddenid })
      .then(() => {
        logger.info('Deleted notification for ' + account);
        resolve({ message: 'You have successfully deleted notification.' });
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
