const readLastLines = require('read-last-lines');

exports.doYourJob = function (sh) {
  return new Promise((resolve, reject) => {
    const askForPubCount = sh
      .select('COUNT(*)')
      .from('content_preprints')
      .run();
    const askForIndexingOffset = sh
      .select('value')
      .from('manager')
      .where('option', '=', 'indexing_offset')
      .run();
    const askForIndexingOffsetAbstract = sh
      .select('value')
      .from('manager')
      .where('option', '=', 'indexing_offset_abstract')
      .run();
    const askForLastFiftyQueries = sh
      .select('query', 'lastquality', 'details', 'lastexectime')
      .from('query_stats')
      .orderBy('id', 'desc')
      .limit(20)
      .run();
    const askForLogsOfCrawling = sh
      .select('name', 'log')
      .from('manager_lines')
      .where('log', 'IS NOT', null)
      .orderBy('name', 'asc')
      .run();
    const askForAccCount = sh
      .select('COUNT(*)')
      .from('accounts')
      .run();
    const askForNotCount = sh
      .select('COUNT(*)')
      .from('accounts_notifications')
      .run();

    const arrayOfQueries = [
      askForPubCount,
      askForIndexingOffset,
      askForIndexingOffsetAbstract,
      askForLastFiftyQueries,
      askForLogsOfCrawling,
      askForAccCount,
      askForNotCount,
    ];

    Promise.all(arrayOfQueries)
      .then((arrayOfResults) => {
        const toResolve = [
          {
            text:
              (parseInt(arrayOfResults[5][0].count, 10) + ' accounts with '
                + parseInt(arrayOfResults[6][0].count, 10) + ' notifications'),
          },
          { text: '___' },
          {
            text:
              'Initial indexing queue: '
              + (parseInt(arrayOfResults[0][0].count, 10)
                - parseInt(arrayOfResults[1][0].value, 10)),
          },
          {
            text:
              'Deep indexing queue: '
              + (parseInt(arrayOfResults[0][0].count, 10)
                - parseInt(arrayOfResults[2][0].value, 10)),
          },
          { text: '___' },
          { text: 'Last queries:' },
        ];

        const today = Date.now();

        let sumOfLastTwentyTimes = 0;
        let iteratorOfSum = 0;
        arrayOfResults[3].forEach((query) => {
          const parsed = JSON.parse(query.details);
          const lastOne = parsed[parsed.length - 1];
          let lasted = query.lastexectime;
          // eslint-disable-next-line eqeqeq
          if (lasted == undefined) lasted = lastOne.executionTime;
          if (iteratorOfSum <= 20 && Number.isInteger(parseInt(lasted, 10))) sumOfLastTwentyTimes += parseInt(lasted, 10);
          iteratorOfSum += 1;

          const relevantOnes = lastOne.howManyRelevant;
          let newest = '';
          let thatDate = new Date(parseInt(lastOne.newestResult, 10)).getTime();
          let days = (today - thatDate) / 86400000;
          newest = days.toFixed(0) + ' days ago';
          let hours = (today - thatDate) / 3600000;
          if (days <= 1.25) newest = hours.toFixed(0) + ' hours ago';
          else if (days < 2) newest = '1 day ago';
          if (hours <= 1.1) newest = 'less than hour ago';
          else if (hours < 2) newest = '1 hour ago';
          let when = '';
          thatDate = new Date(parseInt(lastOne.timestamp, 10)).getTime();
          days = (today - thatDate) / 86400000;
          when = days.toFixed(0) + 'd ago';
          hours = (today - thatDate) / 3600000;
          const minutes = (today - thatDate) / 60000;
          if (days <= 1.25) when = hours.toFixed(0) + 'h ago';
          else if (days < 2) when = '1d ago';
          if (hours <= 2) when = minutes.toFixed(0) + 'm ago';

          // eslint-disable-next-line eqeqeq
          if (lastOne.error == undefined) {
            toResolve.push({
              text:
                when
                + ': <a href="https://knowledgebrowser.org/preprints/search?q='
                + unescape(query.query).replace(/ /g, '+')
                + '&stats=0" target="_blank">'
                + unescape(query.query)
                + '</a> (<strong>'
                + lasted
                + ' ms</strong>, '
                + query.lastquality
                + '/10, '
                + relevantOnes
                + ' relevant, newest '
                + newest
                + ')',
            });
          } else {
            toResolve.push({
              text:
                when
                + ': '
                + unescape(query.query)
                + ' (<strong>error:'
                + unescape(lastOne.error)
                + '</strong>)',
            });
          }
        });

        toResolve.unshift({ text: '___' });
        toResolve.unshift({ text: 'Average of exec time of the last twenty queries: ' + (sumOfLastTwentyTimes / 20) + ' ms' });

        toResolve.push({ text: '___' });
        toResolve.push({ text: 'Crawl monitoring:' });

        arrayOfResults[4].forEach((oneline) => {
          let whatText = oneline.name + ': ';
          const parsed = JSON.parse(oneline.log);
          parsed.forEach((ele) => {
            let when = '';
            const thatDate = new Date(parseInt(ele.timestamp, 10)).getTime();
            const days = (today - thatDate) / 86400000;
            when = days.toFixed(0) + 'd ago';
            const hours = (today - thatDate) / 3600000;
            if (days <= 1.25) when = hours.toFixed(0) + 'h ago';
            else if (days < 2) when = '1d ago';
            if (hours <= 1.1) when = 'under 1h ago';
            else if (hours < 2) when = '1h ago';
            // if (ele.cont === false) whatText += '<strong>PROBLEM</strong> ';
            // else whatText += 'ok ';
            whatText += ele.cont;
            whatText += ' (' + when + ') in ' + ele.sub + ' -|- ';
          });
          toResolve.push({ text: whatText });
        });

        toResolve.push({ text: '___' });
        toResolve.push({ text: 'Error log, 100 last lines:' });

        const fileReading = [
          readLastLines.read('winston-error.log', 2000),
          readLastLines.read('winston-combined.log', 1000),
        ];
        Promise.all(fileReading)
          .then((arrayOfRead) => {
            if (arrayOfRead[0].length > 0) {
              arrayOfRead[0]
                .split('\n')
                .reverse()
                .forEach(line => toResolve.push({ text: line }));
            }
            toResolve.push({ text: '___' });
            toResolve.push({ text: 'Combined log, 500 last lines:' });
            if (arrayOfRead[1].length > 0) {
              arrayOfRead[1]
                .split('\n')
                .reverse()
                .forEach(line => toResolve.push({ text: line }));
            }
            resolve(toResolve);
          })
          .catch((e) => {
            reject(e);
          });
      })
      .catch((e) => {
        reject(e);
      });
  });
};
