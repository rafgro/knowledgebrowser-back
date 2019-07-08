exports.doYourJob = function (db, userMail) {
  return new Promise((resolve, reject) => {
    db.select('query', 'frequency', 'minrelevance', 'where', 'created', 'hiddenid')
      .from('accounts_notifications')
      .where('account', '=', userMail)
      .orderBy('created', 'desc')
      .run()
      .then((result) => {
        resolve(result);
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
