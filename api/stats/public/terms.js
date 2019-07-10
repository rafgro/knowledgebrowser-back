exports.doYourJob = function (sh, today, type) {
  return new Promise((resolve, reject) => {
    sh.select('processedterms').from('icing_stats').where('date', '=', today).and('type', '=', type)
      .run()
      .then((res) => {
        resolve(res[0].processedterms);
      })
      .catch((e) => {
        reject(e);
      });
  });
};
