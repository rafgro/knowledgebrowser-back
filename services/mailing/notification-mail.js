/* eslint-disable eqeqeq */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-lonely-if */
const nodemailer = require('nodemailer');
const loader = require('../../loaders');
const searchApi = require('../../api/search');
const mailStatus = require('../../api/accounts/userdata-mailstatus');

exports.doYourJob = function (ifFirst, whereToSend, aboutWhat, minRelevance, span, lastSent = 0) {
  // checking if we can even send mail to the user
  mailStatus.doYourJob(loader.database, whereToSend)
    .then((ifMail) => {
      if (ifMail == '0') logger.info('Notification not sent to ' + whereToSend + ' because mail not confirmed');
      else {
        // checking history of previous notifications
        loader.database.select('senthistory')
          .from('accounts_notifications')
          .where('account', '=', '$whereToSend')
          .and('query', '=', '$aboutWhat')
          .run({ whereToSend, aboutWhat })
          .then((res) => {
            let modifiedSpan = 12 + span;
            if (res[0].senthistory != null && ifFirst != 'first') modifiedSpan = 12 + span * 2; // for overlap
            // querying search api with params tailored for notifications
            searchApi
              .doYourJob(loader.database, aboutWhat, 10, 0, 0, 0, minRelevance, modifiedSpan, true)
              .then((results) => {
                if (results.results == undefined) {
                  logger.info('No new results to notify ' + whereToSend + ' about ' + aboutWhat);
                } else if (results.results.length == 0) {
                  logger.info('No new results to notify ' + whereToSend + ' about ' + aboutWhat);
                } else {
                  // cutting out duplicated preprints
                  if (res[0].senthistory != null) {
                    const allHistory = JSON.parse(res[0].senthistory);
                    const sentIds = allHistory.arr.map(v => v.ids).join(',') + ',';
                    const pubs = results.results.filter((v) => {
                      if (sentIds.includes('' + v.id + ',')) return false;
                      return true;
                    });
                    if (pubs.length == 0) {
                      logger.info('No new results to notify ' + whereToSend + ' about ' + aboutWhat);
                    } else {
                      sendThatMail(ifFirst, whereToSend, aboutWhat,
                        minRelevance, span, lastSent, pubs);
                    }
                  } else {
                    const pubs = results.results;
                    sendThatMail(ifFirst, whereToSend, aboutWhat,
                      minRelevance, span, lastSent, pubs);
                  }
                }
              })
              .catch((e) => {
                logger.error(e);
              });
          })
          .catch((e) => {
            logger.error(e);
          });
      }
    })
    .catch(e => logger.error(e));
};

function sendThatMail(ifFirst, whereToSend, aboutWhat, minRelevance, span, lastSent, pubs) {
  const transport = nodemailer.createTransport({
    host: 'ssd3.linuxpl.com',
    port: 587,
    auth: {
      user: 'hello@knowbrowser.org',
      pass: 'X4k2MfRCmvh63kak!',
    },
  });

  let textToSend = '';
  if (ifFirst === 'first') textToSend = 'Hello, This is your first update on preprints about ' + aboutWhat + '. Following list covers the last period specified by you - updates in the future will look similar. ';
  else textToSend = 'New preprints about ' + aboutWhat + ': ';

  let htmlToSend = '';
  if (ifFirst === 'first') htmlToSend = 'Hello,<br/><br/>This is your first update on preprints about ' + aboutWhat + '. Following list covers the last period specified by you - updates in the future will look similar.<br/><br/>';
  else htmlToSend = 'New preprints about ' + aboutWhat + ':<br/><br/>';

  const today = Date.now();

  const myHistory = { day: Date.now(), ids: [] };
  pubs.forEach((pub) => {
    const thatDate = (new Date(pub.date)).getTime();
    const days = (today - thatDate) / 86400000;
    let dateAgo = days.toFixed(0) + ' days ago';
    const hours = ((today - thatDate) / 3600000);
    if (days <= 1.99) dateAgo = hours.toFixed(0) + ' hours ago';
    else if (days < 2) dateAgo = '1 day ago';
    if (hours <= 1.1) dateAgo = 'less than hour ago';
    if (pub.relativeWeight >= 8) htmlToSend += '<small><strong>' + pub.relativeWeight + '/10 relevant</strong></small><br/>';
    else htmlToSend += '<small>' + pub.relativeWeight + '/10 relevant</small><br/>';
    htmlToSend += '<small>' + pub.date.toString().replace('T', ' ').substring(0, 18) + '(' + dateAgo + ') in ' + pub.server + '</small><br/><a href="' + pub.link + '">' + pub.title + '</a><br/>' + pub.abstract + '<br/><br/>';

    textToSend += '- (' + pub.relativeWeight + '/10 relevant, ' + dateAgo + ' in ' + pub.server + ') "' + pub.title + '" Abstract: ' + pub.abstract + ' (more at ' + pub.link + ') ';

    myHistory.ids.push(pub.id);
  });
  logger.info('Sending: ' + JSON.stringify(myHistory));

  textToSend += ' If you want to change settings of notifications, please log in to your account at knowledgebrowser.org/login. See you again! kb:preprints';
  htmlToSend += ' If you want to change settings of notifications, please log in to your account at <a href="https://knowledgebrowser.org/login">knowledgebrowser.org/login</a>.<br/><br/>See you again!<br/>kb:preprints';

  let titleThis = pubs.length + ' new preprints on ' + aboutWhat;
  if (pubs.length === 1) titleThis = pubs.length + ' new preprint on ' + aboutWhat;
  const mailOptions = {
    from: '"kb:preprints" <hello@knowledgebrowser.org>',
    to: whereToSend,
    subject: titleThis,
    text: textToSend,
    html: htmlToSend,
  };

  logger.info(whereToSend + ' notified about ' + pubs.length + ' new preprints on ' + aboutWhat);

  // eslint-disable-next-line consistent-return
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
      return logger.error(error);
    }
    logger.info(info);
  });

  loader.database.select('senthistory')
    .from('accounts_notifications')
    .where('account', '=', '$whereToSend')
    .and('query', '=', '$aboutWhat')
    .run({ whereToSend, aboutWhat })
    .then((res) => {
      if (res[0].senthistory == null) {
        loader.database.update('accounts_notifications')
          .set('lastone', pubs[0].id)
          .set('senthistory', '\'{"arr":[' + JSON.stringify(myHistory) + ']}\'')
          .where('account', '=', '$whereToSend')
          .and('query', '=', '$aboutWhat')
          .run({ whereToSend, aboutWhat })
          .then(() => logger.info('Ok'))
          .catch(e => logger.error(e));
      } else {
        const allHistory = JSON.parse(res[0].senthistory);
        // dumping old ones
        const now = Date.now();
        allHistory.arr = allHistory.arr.filter((v) => {
          if (now - v.day > ((24 + span * 3) * 60 * 60 * 1000)) return false;
          return true;
        });
        allHistory.arr.push(myHistory);
        loader.database.update('accounts_notifications')
          .set('lastone', pubs[0].id)
          .set('senthistory', '\'' + JSON.stringify(allHistory) + '\'')
          .where('account', '=', '$whereToSend')
          .and('query', '=', '$aboutWhat')
          .run({ whereToSend, aboutWhat })
          .then(() => logger.info('Ok'))
          .catch(e => logger.error(e));
      }
    })
    .catch(e => logger.error(e));
}
