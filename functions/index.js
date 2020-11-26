const functions = require("firebase-functions");

const express = require("express");

const { db } = require("./util/admin");

const {
  getAllScreams,
  postOneScream,
  getUserScreams,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
  getScreamByHandle,
} = require("./handlers/screams");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getUserDetails,
  getOtheruserDetails,
  markNotificationRead,
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
app.delete("/scream/:screamId/", verifyJwtToken, deleteScream);
app.get("/screams/:handle", verifyJwtToken, getScreamByHandle);

//Users ROUTE
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", verifyJwtToken, uploadImage);
app.post("/user", verifyJwtToken, addUserDetails);
app.get("/user", verifyJwtToken, getUserDetails);
app.get("/user/:handle", verifyJwtToken, getOtheruserDetails);
app.post("/notification",verifyJwtToken,markNotificationRead);

//Telling the firebase that all our routs are in the app
exports.api = functions.region("asia-south1").https.onRequest(app);

//Like Notification
exports.createNotificationOnLike = functions
  .region("asia-south1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db
            .doc(`/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "like",
              screamId: doc.id,
              read: false,
            })
            .then(() => {
              return;
            })
            .catch((err) => {
              console.error(err);
              return;
            });
        }
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//Dislike Notification
exports.createNotificationOnDislike = functions
  .region("asia-south1")
  .firestore.document("unlikes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db
            .doc(`/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "unlike",
              screamId: doc.id,
              read: false,
            })
            .then(() => {
              return;
            })
            .catch((err) => {
              console.error(err);
              return;
            });
        }
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//Comment Notification
exports.createNotificationOnComment = functions
  .region("asia-south1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db
            .doc(`/notifications/${snapshot.id}`)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "comment",
              screamId: doc.id,
              read: false,
            })
            .then(() => {
              return;
            })
            .catch((err) => {
              console.error(err);
              return;
            });
        }
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
