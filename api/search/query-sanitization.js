exports.sanitize = function (query) {
  let workingQuery = query;
  if (query.length > 60) workingQuery = workingQuery.substring(0, 60);
  workingQuery = workingQuery.replace(/\-/g, ' ');
  workingQuery = workingQuery.replace(/[^A-Za-z0-9 ]/g, '');
  return workingQuery;
};
