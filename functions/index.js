const functions = require("firebase-functions");

const express = require("express");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
} = require("./handlers/users");

const verifyJwtToken = require("./util/verifyJwtToken");

const app = express();

app.use(express.json());

//Screams routes
app.get("/screams", getAllScreams);
app.post("/scream", verifyJwtToken, postOneScream);

//Users ROUTE
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", verifyJwtToken, uploadImage);
app.post("/user", verifyJwtToken, addUserDetails);

//Telling the firebase that all our routs are in the app
exports.api = functions.https.onRequest(app);
