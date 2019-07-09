exports.doYourJob = function (db, userMail) {
  return new Promise((resolve, reject) => {
    db.select('mailconfirmation')
      .from('accounts')
      .where('email', '=', userMail)
      .run()
      .then((result) => {
        if (result[0].mailconfirmation.length > 5) resolve('0'); // key present in column
        else resolve('1'); // column cleared
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
