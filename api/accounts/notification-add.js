const validator = require('validator');

exports.doYourJob = function (db, account, keywords, relevance, frequency, where) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(account)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isEmail(where)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isNumeric(relevance)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });
    if (!validator.isNumeric(frequency)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });

    db.insert({
      account,
      query: keywords,
      frequency,
      minrelevance: relevance,
      where,
      created: 'to_timestamp(' + (Date.now() / 1000) + ')',
      hiddenid: 'crypt(\'' + account + (Date.now() / 1000) + '\',gen_salt(\'bf\'))',
    }).into('accounts_notifications').run()
      .then(() => {
        logger.info('Created notification ' + keywords + '  for ' + account);
        resolve({ message: 'You have successfully set up new notification.' });
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
