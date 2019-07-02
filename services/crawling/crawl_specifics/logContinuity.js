exports.logIt = function (sh, trueOrFalse, what, subject) {
  sh.select('log')
    .from('manager_lines')
    .where('name', '=', what)
    .run()
    .then((currentLog) => {
      const timestamp = Date.now();

      if (currentLog[0].log == null) {
        // first time log
        const logText = `[{"timestamp":${timestamp},"cont":${trueOrFalse},"sub":"${subject}"}]`;
        sh.update('manager_lines')
          .set('log', `'${logText}'`)
          .where('name', '=', what)
          .run();
      } else {
        // appending log
        let now = JSON.parse(currentLog[0].log);
        if (now.length > 50) now = now.slice(0, 49);
        now.unshift({ timestamp, cont: trueOrFalse, sub: subject });
        sh.update('manager_lines')
          .set('log', `'${JSON.stringify(now)}'`)
          .where('name', '=', what)
          .run();
      }
    })
    .catch((e) => {
      logger.error(JSON.stringify(e));
    });
};
