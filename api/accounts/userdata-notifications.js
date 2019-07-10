exports.doYourJob = function (db, userMail) {
  return new Promise((resolve, reject) => {
    db.select('query', 'frequency', 'minrelevance', 'where', 'created', 'hiddenid')
      .from('accounts_notifications')
      .where('account', '=', '$userMail')
      .orderBy('created', 'desc')
      .run({ userMail })
      .then((result) => {
        resolve(result);
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
