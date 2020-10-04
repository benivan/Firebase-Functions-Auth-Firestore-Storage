const functions = require("firebase-functions");

const express = require("express");

const {
  getAllScreams,
  postOneScream,
  getUserScreams,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
} = require("./handlers/screams");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getUserDetails,
} = require("./handlers/users");

const verifyJwtToken = require("./util/verifyJwtToken");

const app = express();

app.use(express.json());

//Screams routes
app.get("/screams", getAllScreams);
app.post("/scream", verifyJwtToken, postOneScream);
app.get("/u/screams", verifyJwtToken, getUserScreams);
app.get("/scream/:screamId", getScream);
app.post("/scream/:screamId/comment", verifyJwtToken, commentOnScream);
app.post("/scream/:screamId/like", verifyJwtToken, likeScream);
app.post("/scream/:screamId/unlike", verifyJwtToken, unlikeScream);

//Users ROUTE
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", verifyJwtToken, uploadImage);
app.post("/user", verifyJwtToken, addUserDetails);
app.get("/user", verifyJwtToken, getUserDetails);

//Telling the firebase that all our routs are in the app
exports.api = functions.region("asia-south1").https.onRequest(app);
