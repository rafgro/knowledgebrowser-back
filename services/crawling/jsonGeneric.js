const request = require('request');
const loader = require('../../loaders');

const jsonPeerj = require('./crawl_specifics/jsonPeerj');

exports.start = function (name, mainurl, mainsuburls = null) {
  logger.info(`hey ${name}`);

  if (mainsuburls !== null) {
    mainsuburls.forEach((subject, index) => {
      setTimeout(() => {
        logger.info(subject);
        request(mainurl + subject, { timeout: 20000 },
          (e, r, b) => processResponseOfJson(e, r, b, name));
      }, 3000 * index); // slow requesting to avoid one-time ddos
    });
  } else {
    logger.info('main');
    request(mainurl, { timeout: 20000 }, (e, r, b) => processResponseOfJson(e, r, b, name));
  }
};

function processResponseOfJson(error, response, body, name) {
  if (error) {
    logger.error(JSON.stringify(error));
  } else {
    // logger.info(body.substring(0, 5));

    try {
      const res = JSON.parse(body);
      processAndUploadToDatabase(name, res);
    } catch (e) {
      logger.error(JSON.stringify(e));
    }
  }
}

function processAndUploadToDatabase(name, what) {
  switch (name) {
    case 'PeerJ Preprints':
      jsonPeerj.processJsonBody(loader.database, what, name);
      break;
    default:
      logger.error(`Wrong source: ${name}`);
  }
}
