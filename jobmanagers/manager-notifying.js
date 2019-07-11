const loader = require('../loaders');
const mailNotifier = require('../services/mailing/notification-mail');

exports.start = function () {
  logger.info('Checking notifications');
  loader.database
    .select('account', 'query', 'minrelevance', 'span', 'lastone', 'schdays', 'schhours')
    .from('accounts_notifications')
    .orderBy('lastone')
    .limit(100) // , result[0].value)
    .run()
    .then((results) => {
      const today = new Date().getUTCDate();
      const hour = new Date().getUTCHours();

      results.forEach((oneResult, index) => {
        setTimeout(() => {
          if ((oneResult.schdays.includes(' ' + today + ' ') || oneResult.schdays.includes(' 0 '))
            && (oneResult.schhours.includes(' ' + hour + ' ') || oneResult.schhours.includes(' 0 '))
            && oneResult.account !== 'deleted@deleted.deleted') {
            // logger.info('Notification scheduled for ' + oneResult.account);
            mailNotifier.doYourJob(
              'notfirst',
              oneResult.account,
              oneResult.query,
              oneResult.minrelevance,
              oneResult.span,
              oneResult.lastone,
            );
          }
        }, 200 * index); // slow requesting to avoid bombing own db
      });
    })
    .catch((e) => {
      logger.error(e);
    });
};
