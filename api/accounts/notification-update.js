const validator = require('validator');

exports.doYourJob = function (db, account, keywords, relevance,
  frequency, where, hiddenid) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(account)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isEmail(where)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isNumeric(relevance)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });
    if (!validator.isNumeric(frequency)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });

    db.update('accounts_notifications').set({
      query: keywords,
      frequency,
      minrelevance: relevance,
      where,
    }).where('account', '=', account)
      .and('hiddenid', '=', '\'' + hiddenid + '\'')
      .run()
      .then(() => {
        logger.info('Updated notification ' + keywords + '  for ' + account);
        resolve({ message: 'You have successfully updated notification.' });
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
