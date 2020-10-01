const admin = require("firebase-admin");

//Initailazing firebase-admin
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };
