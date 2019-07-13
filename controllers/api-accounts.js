const loader = require('../loaders');

const apiAccountsCreateuser = require('../api/accounts/createuser');
const apiAccountsLoginuser = require('../api/accounts/loginuser');
const apiAccountsUserdataNotifications = require('../api/accounts/userdata-notifications');
const apiAccountsNotificationAdd = require('../api/accounts/notification-add');
const apiAccountsNotificationUpdate = require('../api/accounts/notification-update');
const apiAccountsNotificationDelete = require('../api/accounts/notification-delete');
const apiAccountsConfirmUser = require('../api/accounts/confirmuser');
const apiAccountsChangeUser = require('../api/accounts/changeuser');
const apiAccountUserdataMailstatus = require('../api/accounts/userdata-mailstatus');
const apiAccountsForgottenPass1 = require('../api/accounts/forgottenpass1');
const apiAccountsForgottenPass2 = require('../api/accounts/forgottenpass2');

/* USER AUTH */

exports.createUser = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsCreateuser
      .doYourJob(loader.database, request.body.email, request.body.pass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(403);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.loginUser = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsLoginuser
      .doYourJob(loader.database, request.body.email, request.body.pass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

/* NOTIFICATIONS */

exports.provideNotifications = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsUserdataNotifications
      .doYourJob(loader.database, request.body.email)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.addNotification = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsNotificationAdd
      .doYourJob(loader.database, request.body.account, request.body.keywords,
        request.body.relevance, request.body.frequency, request.body.where)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.updateNotification = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsNotificationUpdate
      .doYourJob(loader.database, request.body.account, request.body.keywords,
        request.body.relevance, request.body.frequency, request.body.where,
        request.body.hiddenid)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.deleteNotification = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsNotificationDelete
      .doYourJob(loader.database, request.body.account, request.body.hiddenid)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

/* MAIL STATUS */

exports.confirmUser = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsConfirmUser
      .doYourJob(loader.database, request.body.key)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.provideMailStatus = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountUserdataMailstatus
      .doYourJob(loader.database, request.body.email)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

/* CHANGING USER CREDENTIALS */

exports.changeUserMail = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsChangeUser
      .doChangeUserMail(loader.database, request.body.oldmail,
        request.body.pass, request.body.newmail)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.changeUserPass = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsChangeUser
      .doChangeUserPass(loader.database, request.body.mail,
        request.body.oldpass, request.body.newpass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.sendForgottenLink = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsForgottenPass1
      .doYourJob(loader.database, request.body.mail)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};

exports.changeForgottenPass = function (request, response) {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsForgottenPass2
      .doYourJob(loader.database, request.body.key, request.body.pass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
};
