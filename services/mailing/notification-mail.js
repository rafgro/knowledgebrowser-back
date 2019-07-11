/* eslint-disable eqeqeq */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-lonely-if */
const nodemailer = require('nodemailer');
const loader = require('../../loaders');
const searchApi = require('../../api/search');
const mailStatus = require('../../api/accounts/userdata-mailstatus');

exports.doYourJob = function (ifFirst, whereToSend, aboutWhat, minRelevance, span, lastSent = 0) {
  mailStatus.doYourJob(loader.database, whereToSend)
    .then((ifMail) => {
      if (ifMail == '0') logger.info('Notification not sent to ' + whereToSend + ' because mail not confirmed');
      else {
        searchApi
          .doYourJob(loader.database, aboutWhat, 10, 0, 0, 0, minRelevance, span, true)
          .then((results) => {
            if (results.results == undefined) {
              logger.info('No new results to notify ' + whereToSend);
            } else {
              if (results.results.length == 0) logger.info('No new results to notify ' + whereToSend);
              let pubs = results.results;
              if (lastSent != null) {
                let determinedPos = -1;
                for (let i = 0; i < pubs.length; i += 1) {
                  if (pubs[i].id == parseInt(lastSent, 10)) {
                    determinedPos = i;
                    break;
                  }
                }
                if (determinedPos != -1) {
                  pubs = pubs.slice(0, determinedPos);
                  if (pubs.length == 0) {
                    logger.info('No new results to notify ' + whereToSend);
                  } else {
                    sendThatMail(ifFirst, whereToSend, aboutWhat, minRelevance, span, lastSent, pubs);
                  }
                } else {
                  searchApi
                    .doYourJob(loader.database, aboutWhat, 10, 0, 0, 0,
                      minRelevance, (span * 2 + 24), true)
                    .then((results2) => {
                      let pubs2 = results2.results;
                      if (lastSent != 0) {
                        determinedPos = -1;
                        for (let i = 0; i < pubs2.length; i += 1) {
                          if (pubs2[i].id == parseInt(lastSent, 10)) {
                            determinedPos = i;
                            break;
                          }
                        }
                        if (determinedPos != -1) {
                          logger.info('Hole between notifications cut out');
                          pubs2 = pubs2.slice(0, determinedPos);
                        } else {
                          logger.error('Hole between notifications not cut out');
                        }
                      }

                      if (pubs2.length == 0) {
                        logger.info('No new results to notify ' + whereToSend);
                      } else {
                        sendThatMail(ifFirst, whereToSend, aboutWhat,
                          minRelevance, (span * 2 + 24), lastSent, pubs2);
                      }
                    })
                    .catch((e) => {
                      logger.error(e);
                    });
                }
              } else {
                if (pubs.length == 0) {
                  logger.info('No new results to notify ' + whereToSend);
                } else {
                  sendThatMail(ifFirst, whereToSend, aboutWhat, minRelevance, span, lastSent, pubs);
                }
              }
            }
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
    htmlToSend += '<small>' + dateAgo + ' in ' + pub.server + '</small><br/><a href="' + pub.link + '">' + pub.title + '</a><br/>' + pub.abstract + '<br/><br/>';

    textToSend += '- (' + pub.relativeWeight + '/10 relevant, ' + dateAgo + ' in ' + pub.server + ') "' + pub.title + '" Abstract: ' + pub.abstract + ' (more at ' + pub.link + ') ';
  });

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

  // eslint-disable-next-line consistent-return
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
      return logger.error(error);
    }
    logger.info(info);
  });

  loader.database.update('accounts_notifications')
    .set('lastone', pubs[0].id)
    .where('account', '=', '$whereToSend')
    .and('query', '=', '$aboutWhat')
    .run({ whereToSend, aboutWhat })
    .then(() => logger.info('Updated last one to ' + pubs[0].id))
    .catch(e => logger.error(e));
}
