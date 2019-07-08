exports.doYourJob = function (db, userMail) {
  return new Promise((resolve, reject) => {
    db.select('mailconfirmation')
      .from('accounts')
      .where('email', '=', userMail)
      .run()
      .then((result) => {
        if (result[0].mailconfirmation.length < 5) resolve('1');
        else resolve('0');
      })
      .catch((e) => {
        logger.error('22 ' + JSON.stringify(e));
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
