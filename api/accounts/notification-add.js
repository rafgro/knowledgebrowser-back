const validator = require('validator');
const notificationMail = require('../../services/mailing/notification-mail');
const notificationSchedule = require('./notification-schedule');

exports.doYourJob = function (db, account, keywords, relevance, frequency, where) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(account)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isEmail(where)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isNumeric(relevance)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });
    if (!validator.isNumeric(frequency)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });

    const schedule = notificationSchedule.generateSchedule(frequency);

    db.insert({
      account,
      query: keywords,
      frequency,
      minrelevance: relevance,
      where,
      created: 'to_timestamp(' + (Date.now() / 1000) + ')',
      hiddenid: 'crypt(\'' + account + (Date.now() / 1000) + '\',gen_salt(\'bf\'))',
      schdays: schedule.days,
      schhours: schedule.hours,
      span: schedule.span,
    }).into('accounts_notifications').run()
      .then(() => {
        logger.info('Created notification ' + keywords + '  for ' + account);
        notificationMail.doYourJob('first', where, keywords, relevance, schedule.span);
        resolve({ message: 'You have successfully set up new notification.' });
      })
      .catch((e) => {
        logger.error(e);
        reject({ errorType: 'database', message: 'Sorry, we have encountered an error.' });
      });
  });
};
