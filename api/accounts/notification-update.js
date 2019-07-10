const validator = require('validator');
const notificationSchedule = require('./notification-schedule');

exports.doYourJob = function (db, account, keywords, relevance,
  frequency, where, hiddenid) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(account)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isEmail(where)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isNumeric(relevance)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });
    if (!validator.isNumeric(frequency)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });

    const schedule = notificationSchedule.generateSchedule(frequency);

    db.update('accounts_notifications').set({
      query: keywords,
      frequency,
      minrelevance: relevance,
      where,
      schdays: schedule.days,
      schhours: schedule.hours,
      span: schedule.span,
    }).where('account', '=', account)
      .and('hiddenid', '=', '\'' + hiddenid + '\'')
      .run()
      .then(() => {
        logger.info('Updated notification ' + keywords + '  for ' + account);
        resolve({ message: 'You have successfully updated notification.' });
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
