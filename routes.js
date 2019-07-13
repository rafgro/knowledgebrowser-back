/* eslint-disable no-unused-vars */
const { Router } = require('express');
const generalExpress = require('express');

const server = Router();

// Http errors
server.use((request, response) => {
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

exports.routesServer = server;
