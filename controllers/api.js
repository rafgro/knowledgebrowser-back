const { Router } = require('express');
const generalExpress = require('express');

const ctrlSearch = require('./api-search');
const ctrlStats = require('./api-stats');
const ctrlAccounts = require('./api-accounts');

const server = Router();

server.get('/search', ctrlSearch.respond);

server.get('/stats', ctrlStats.respondToPublic);
server.get('/stats2', ctrlStats.respondToInternal);
server.get('/terms', ctrlStats.respondToTerms);

server.use(generalExpress.urlencoded());
server.post('/accounts/createuser', ctrlAccounts.createUser);
server.post('/accounts/loginuser', ctrlAccounts.loginUser);
server.post('/accounts/allnotifications', ctrlAccounts.provideNotifications);
server.post('/accounts/addonenotification', ctrlAccounts.addNotification);
server.post('/accounts/updatenotification', ctrlAccounts.updateNotification);
server.post('/accounts/deletenotification', ctrlAccounts.deleteNotification);
server.post('/accounts/confirmuser', ctrlAccounts.confirmUser);
server.post('/accounts/usermailstatus', ctrlAccounts.provideMailStatus);
server.post('/accounts/changeusermail', ctrlAccounts.changeUserMail);
server.post('/accounts/changeuserpass', ctrlAccounts.changeUserPass);
server.post('/accounts/forgottenpass1', ctrlAccounts.sendForgottenLink);
server.post('/accounts/forgottenpass2', ctrlAccounts.changeForgottenPass);

exports.routes = server;
