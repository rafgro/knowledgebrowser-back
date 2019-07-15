exports.sanitize = function (query, withExact) {
  let workingQuery = query;
  if (query.length > 60) workingQuery = workingQuery.substring(0, 60);
  workingQuery = workingQuery.replace(/\-/g, ' ');
  workingQuery = workingQuery.replace(/[^A-Za-z0-9 ]/g, '');
  if (workingQuery.charAt(0) === ' ') workingQuery = workingQuery.substring(1);
  const theEnd = workingQuery.length - 1;
  if (workingQuery.charAt(theEnd) === ' ') workingQuery = workingQuery.substring(0, theEnd - 1);
  return workingQuery;
};
