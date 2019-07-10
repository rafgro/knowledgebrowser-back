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
      account: '$account',
      query: '$keywords',
      frequency: '$frequency',
      minrelevance: '$relevance',
      where: '$where',
      created: 'to_timestamp(' + (Date.now() / 1000) + ')',
      hiddenid: 'crypt(\'' + account + (Date.now() / 1000) + '\',gen_salt(\'bf\'))',
      schdays: '$days',
      schhours: '$hours',
      span: '$span',
    }).into('accounts_notifications')
      .run({ account, keywords, frequency, relevance, where,
        days: schedule.days, hours: schedule.hours, span: schedule.span })
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
