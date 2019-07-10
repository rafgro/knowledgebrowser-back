const validator = require('validator');

exports.doYourJob = function (db, account, keywords, relevance,
  frequency, where, hiddenid) {
  return new Promise((resolve, reject) => {
    // 0. validation
    if (!validator.isEmail(account)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isEmail(where)) reject({ errorType: 'invalid', message: 'The e-mail seems invalid.' });
    if (!validator.isNumeric(relevance)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });
    if (!validator.isNumeric(frequency)) reject({ errorType: 'invalid', message: 'The request body seems invalid.' });

    const schedule = generateSchedule(frequency);

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

function generateSchedule(frequency) {
  const schedule = { days: '', hours: '', span: 0 };
  const day = new Date().getUTCDate();
  const hour = Math.floor(Math.random() * Math.floor(23));
  switch (frequency) {
    case '1':
      // asap
      schedule.days = ' 0 ';
      schedule.hours = ' 0 ';
      schedule.span = 2;
      break;
    case '2':
      // once a day
      schedule.days = ' 0 ';
      schedule.hours = ' ' + hour + ' ';
      schedule.span = 36;
      break;
    case '3':
      // once a few days
      for (let i = 0; i < 10; i += 1) { // 30/3
        let thatDay = day - 1 + i * 3;
        if (thatDay > 31) thatDay -= 30;
        if (thatDay < 1) thatDay = 31 + thatDay;
        schedule.days += ' ' + thatDay + ' ';
      }
      schedule.hours = ' ' + hour + ' ';
      schedule.span = 4 * 24;
      break;
    case '4':
      // once a week
      for (let i = 0; i < 4; i += 1) { // 30/7
        let thatDay = day - 1 + i * 7;
        if (thatDay > 31) thatDay -= 30;
        if (thatDay < 1) thatDay = 31 + thatDay;
        schedule.days += ' ' + thatDay + ' ';
      }
      schedule.hours = ' ' + hour + ' ';
      schedule.span = 9 * 24;
      break;
    default:
      // once a few weeks
      for (let i = 0; i < 2; i += 1) { // 30/15
        let thatDay = day - 1 + i * 15;
        if (thatDay > 31) thatDay -= 30;
        if (thatDay < 1) thatDay = 31 + thatDay;
        schedule.days += ' ' + thatDay + ' ';
      }
      schedule.hours = ' ' + hour + ' ';
      schedule.span = 21 * 24;
  }
  return schedule;
}
