const functions = require("firebase-functions");

const express = require("express");

const { json } = require("express");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login } = require("./handlers/users");

const verifyJwtToken = require("./util/verifyJwtToken");

const app = express();

app.use(express.json());

//Screams routes
app.get("/screams", getAllScreams);
app.post("/scream", verifyJwtToken, postOneScream);

//Users ROUTE
app.post("/signup", signup);
app.post("/login", login);

//Telling the firebase that all our routs are in the app
exports.api = functions.https.onRequest(app);
