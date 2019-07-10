exports.doYourJob = function (db, key) {
  return new Promise((resolve, reject) => {
    db.update('accounts').set({
      mailconfirmation: '1',
    }).where('mailconfirmation', '=', '$key')
      .run({ key })
      .then(() => {
        logger.info('Confirmed account of ' + key);
        resolve({ message: 'You have successfully verified account.' });
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
