const firebaseAdmin = require('firebase-admin');
const SERVICE_ACCOUNT = require('../../config/firebase-credentials');

const firebase = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(SERVICE_ACCOUNT),
});

module.exports = firebase;
