exports.logIt = function (sh, trueOrFalse, what, subject, anyError) {
  // if (subject.length > 15) subject = subject.substring(0, 15);
  sh.select('log')
    .from('manager_lines')
    .where('name', '=', what)
    .run()
    .then((currentLog) => {
      const timestamp = Date.now();

      let problems = trueOrFalse;
      if (anyError) problems = true;

      if (currentLog[0].log == null) {
        // first time log
        const logText = `[{"timestamp":${timestamp},"cont":${problems},"sub":"${subject}"}]`;
        sh.update('manager_lines')
          .set('log', `'${logText}'`)
          .where('name', '=', what)
          .run();
      } else {
        // appending log
        let now = JSON.parse(currentLog[0].log);
        if (now.length > 25) now = now.slice(0, 24);
        now.unshift({ timestamp, cont: problems, sub: subject });
        sh.update('manager_lines')
          .set('log', `'${JSON.stringify(now)}'`)
          .where('name', '=', what)
          .run();
      }
    })
    .catch((e) => {
      logger.error(e);
    });
};

exports.logCrawlerEvent = function (sh, what, subject, logObject) {
  // if (subject.length > 15) subject = subject.substring(0, 15);
  sh.select('log')
    .from('manager_lines')
    .where('name', '=', what)
    .run()
    .then((currentLog) => {
      const timestamp = Date.now();

      let description = '';
      // eslint-disable-next-line eqeqeq
      if (logObject.fatalError != null) {
        description = `<strong><span color="red">Fatal error: ${logObject.fatalError}</span></strong>`;
      } else {
        description = logObject.intercepted + ': '
          + ((logObject.inserted > 0) ? '<strong>' + logObject.inserted + ' inserted</strong>'
            : logObject.inserted + ' inserted') + ', '
          + ((logObject.updated !== undefined) ? logObject.updated + ' updated,  ' : ' ')
          + logObject.existed + ' existed,  '
          + ((logObject.errored > 0) ? '<span color="red"><u>' + logObject.errored + ' errored</u></span>'
            : logObject.errored + ' errored') + ', ';
      }

      if (currentLog[0].log == null) {
        // first time log
        const logText = `[{"timestamp":${timestamp},"cont":"${description}","sub":"${subject}"}]`;
        sh.update('manager_lines')
          .set('log', `'${logText}'`)
          .where('name', '=', what)
          .run();
      } else {
        // appending log
        let now = JSON.parse(currentLog[0].log);
        if (now.length > 25) now = now.slice(0, 24);
        now.unshift({ timestamp, cont: description, sub: subject });
        sh.update('manager_lines')
          .set('log', `'${JSON.stringify(now)}'`)
          .where('name', '=', what)
          .run();
      }
    })
    .catch((e) => {
      logger.error(e);
    });
};
