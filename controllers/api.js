const { Router } = require('express');
const generalExpress = require('express');

const ctrlSearch = require('./api-search');
const ctrlStats = require('./api-stats');
const ctrlAccounts = require('./api-accounts');

const server = Router();

server.get('/search', ctrlSearch.respond(request, response));

server.get('/stats', ctrlStats.respondToPublic(request, response));
server.get('/stats2', ctrlStats.respondToInternal(request, response));
server.get('/terms', ctrlStats.respondToTerms(request, response));

server.use(generalExpress.urlencoded());
server.post('/accounts/createuser', ctrlAccounts.createUser(request, response));
server.post('/accounts/loginuser', ctrlAccounts.loginUser(request, response));
server.post('/accounts/allnotifications', ctrlAccounts.provideNotifications(request, response));
server.post('/accounts/addonenotification', ctrlAccounts.addNotification(request, response));
server.post('/accounts/updatenotification', ctrlAccounts.updateNotification(request, response));
server.post('/accounts/deletenotification', ctrlAccounts.deleteNotification(request, response));
server.post('/accounts/confirmuser', ctrlAccounts.confirmUser(request, response));
server.post('/accounts/usermailstatus', ctrlAccounts.provideMailStatus(request, response));
server.post('/accounts/changeusermail', ctrlAccounts.changeUserMail(request, response));
server.post('/accounts/changeuserpass', ctrlAccounts.changeUserPass(request, response));
server.post('/accounts/forgottenpass1', ctrlAccounts.sendForgottenLink(request, response));
server.post('/accounts/forgottenpass2', ctrlAccounts.changeForgottenPass(request, response));

exports.router = server;
