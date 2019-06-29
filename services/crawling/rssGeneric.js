const request = require('request');
const parseXml = require('xml2js').parseString;
const loader = require('../../loaders');

const rssArxiv = require('./crawl_specifics/rssArxiv');
const rssBiorxiv = require('./crawl_specifics/rssBiorxiv');
const rssChemrxiv = require('./crawl_specifics/rssChemrxiv');
const rssOsf = require('./crawl_specifics/rssOsf');
const rssEssoar = require('./crawl_specifics/rssEssoar');
const rssPreprintsorg = require('./crawl_specifics/rssPreprintsorg');
const rssNeprepec = require('./crawl_specifics/rssNeprepec');
const rssNber = require('./crawl_specifics/rssNber');
const rssVixra = require('./crawl_specifics/rssVixra');
const rssPhilsci = require('./crawl_specifics/rssPhilsci');
const rssMedrxiv = require('./crawl_specifics/rssMedrxiv');

exports.start = function (name, mainurl, mainsuburls = null) {
  logger.info(`hey ${name}`);

  if (mainsuburls !== null) {
    mainsuburls.forEach((subject, index) => {
      setTimeout(() => {
        logger.info(subject);
        request(mainurl + subject, { timeout: 20000 },
          (e, r, b) => processResponseOfRss(e, r, b, name));
      }, 3000 * index); // slow requesting to avoid one-time ddos
    });
  } else {
    logger.info('main');
    request(mainurl, { timeout: 20000 }, (e, r, b) => processResponseOfRss(e, r, b, name));
  }
};

function processResponseOfRss(error, response, body, name) {
  if (error) {
    logger.error(error.toString());
  } else {
    // logger.info(body.substring(0, 100));

    // eslint-disable-next-line no-useless-escape
    parseXml(body.replace(/\ \>/g, '').replace(/\<\ /g, ''), (e, r) => processAndUploadToDatabase(e, r, name));
  }
}

function processAndUploadToDatabase(err, result, name) {
  if (err) {
    logger.error(err.toString());
  } else {
    switch (name) {
      case 'arXiv':
        rssArxiv.processRssBody(loader.database, result, name);
        break;
      case 'bioRxiv':
        rssBiorxiv.processRssBody(loader.database, result, name);
        break;
      case 'chemRxiv':
        rssChemrxiv.processRssBody(loader.database, result, name);
        break;
      case 'OSF':
        rssOsf.processRssBody(loader.database, result, name);
        break;
      case 'ESSOAr':
        rssEssoar.processRssBody(loader.database, result, name);
        break;
      case 'Preprints.org':
        rssPreprintsorg.processRssBody(loader.database, result, name);
        break;
      case 'NEP RePEc':
        rssNeprepec.processRssBody(loader.database, result, name);
        break;
      case 'NBER':
        rssNber.processRssBody(loader.database, result, name);
        break;
      case 'viXra':
        rssVixra.processRssBody(loader.database, result, name);
        break;
      case 'PhilSci':
        rssPhilsci.processRssBody(loader.database, result, name);
        break;
      case 'medRxiv':
        rssMedrxiv.processRssBody(loader.database, result, name);
        break;
      default:
        logger.error(`Wrong source: ${name}`);
    }
  }
}
