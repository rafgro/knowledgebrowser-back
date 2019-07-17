const loader = require('../loaders');

const crawlRssGeneric = require('../services/crawling/rssGeneric');
const crawlJsonGeneric = require('../services/crawling/jsonGeneric');

exports.start = function () {
  const currentHour = new Date().getUTCHours().toString();
  // logger.info(`------------------CRAWLING START at ${currentHour}------------------`);

  loader.database
    .select('*')
    .from('manager_lines')
    .run()
    .then((result) => {
      result.forEach((element) => {
        if (element.frequency != null) {
          if (element.frequency.split(',').includes(currentHour)) {
            if (element.mode === 'rss') {
              if (element.name === 'OSF') {
                const today = new Date(Date.now());
                const ago = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
                const todayString = today.getUTCFullYear()
                  + (today.getUTCMonth() + 1 < 10 ? '-0' : '-')
                  + (today.getUTCMonth() + 1)
                  + (today.getUTCDate() < 10 ? '-0' : '-')
                  + today.getUTCDate();
                const agoString = ago.getUTCFullYear()
                  + (ago.getUTCMonth() + 1 < 10 ? '-0' : '-')
                  + (ago.getUTCMonth() + 1)
                  + (ago.getUTCDate() < 10 ? '-0' : '-')
                  + ago.getUTCDate();
                crawlRssGeneric.start(
                  element.name,
                  element.mainurl
                    + '7D%7D%2C%22filter%22%3A%5B%7B%22range%22%3A%7B%22date%22%3A%7B%22gte%22%3A%22'
                    + agoString
                    + '%7C%7C%2Fd%22%2C%22lte%22%3A%22'
                    + todayString
                    + '%7C%7C%2Fd%22%7D%7D%7D%5D%7D%7D',
                );
              } else if (element.name === 'arXiv') {
                const ago = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
                const agoString = ago.getUTCFullYear()
                  + (ago.getUTCMonth() + 1 < 10 ? '-0' : '-')
                  + (ago.getUTCMonth() + 1)
                  + (ago.getUTCDate() < 10 ? '-0' : '-')
                  + ago.getUTCDate();
                logger.info(element.mainurl + agoString);
                crawlRssGeneric.start(
                  element.name,
                  element.mainurl + agoString + '&set=',
                  element.mainsuburls,
                );
              } else {
                crawlRssGeneric.start(
                  element.name,
                  element.mainurl,
                  element.mainsuburls,
                );
              }
            } else if (element.mode === 'json') {
              crawlJsonGeneric.start(
                element.name,
                element.mainurl,
                element.mainsuburls,
              );
            }
          }
        }
      });
    })
    .catch((e) => {
      logger.error(e);
    });
};
