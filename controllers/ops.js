/* eslint-disable no-unused-vars */
const { Router } = require('express');
const generalExpress = require('express');

const managerCrawling = require('../jobmanagers/manager-crawling');
const managerIndexing = require('../jobmanagers/manager-indexing');
const managerCorrecting = require('../jobmanagers/manager-correcting');
const managerIcing = require('../jobmanagers/manager-icing');
const managerNotifying = require('../jobmanagers/manager-notifying');

const server = Router();

server.get('/discover', (request, response) => {
  response.send('Started job');
  managerCrawling.start();
});
server.get('/index', (request, response) => {
  response.send('Started job');
  managerIndexing.start();
});
server.get('/correct', (request, response) => {
  response.send('Started job');
  managerCorrecting.start();
});
server.get('/ice', (request, response) => {
  response.send('Started job');
  managerIcing.start(request.query.force || 0);
});
server.get('/notify', (request, response) => {
  response.send('Started job');
  managerNotifying.start();
});

exports.routes = server;
