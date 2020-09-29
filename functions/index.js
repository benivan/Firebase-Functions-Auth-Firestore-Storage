const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const firebase = require("firebase");
// require("custom-env").env(true);
const jwt = require("jsonwebtoken");

//TODO add Jwt in Authentication

const firebaseConfig = {
  apiKey: "AIzaSyC3_xgD2wYolSXpYFxll-UBdfyS86EQDd4",
  authDomain: "react-firebase-358ad.firebaseapp.com",
  databaseURL: "https://react-firebase-358ad.firebaseio.com",
  projectId: "react-firebase-358ad",
  storageBucket: "react-firebase-358ad.appspot.com",
  messagingSenderId: "10120473699",
  appId: "1:10120473699:web:351e7ea06c48e62e4e9c56",
};

//Initailazing firebase-admin
admin.initializeApp();

//Initailazing firebase
firebase.initializeApp(firebaseConfig);

//
const db = admin.firestore();

const app = express();


//getting collection data Fom fire Store
// exports.getScreams = functions.https.onRequest((req, res) => {
// });
app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc") // this arrange all the data a\q to latest created date
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
});

//Post Req
app.post("/scream", (req, res) => {
  //Request body
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(),
    //  admin.firestore.Timestamp.fromDate(new Date()),
    //Uses Firebae date stamp
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
});

//Check  is empty.
const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

//Check Email Is v Valid Or Not.
const isValidEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};
// Check the Password Strength
const isStrongPassword = (password) => {
  if (password.length < 6) {
    return true;
  } else {
    return false;
  }
};

const jwtToken = (userdata) => {
  const token = jwt.sign(
    userdata,
    "ca49c3893cf65aad2b8ae2d5b070af25467b4627279fb70425f0c99e75fb4cd6715d32195a2da5c2c4ada8a216655f5e406d52b61e0ae1c0f44611ff8e6f6d8b"
  );
  return token;
};

//SignUp Route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  let errors = {};

  // Email validator
  if (isEmpty(newUser.email)) {
    errors.email = "Must not be empty";
  } else if (!isValidEmail(newUser.email)) {
    errors.email = "Please Enter a valid email";
  }

  //Password Validator
  if (isEmpty(newUser.password)) errors.password = "Must not be empty";

  if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = "Must be match";
  }

  //Password Strengh
  if (isStrongPassword(newUser.password)) errors.password = "Weak!!";

  // handle Validator
  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  //*** NEED TO UNDERSTAND ***
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      //Creating User for Token
      const userForToken = {
        userId: data.user.uid,
        handle: data.user.handle,
      };
      const accessToken = jwtToken(userForToken);
      return accessToken;
    })
    .then((tokenId) => {
      token = tokenId;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use" });
      } else {
        console.error(err);
        return res.status(500).json({ error: err.code });
      }
    });
});

//Login Route
app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};

  //Email Validation
  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isValidEmail(user.email)) {
    errors.email = "please enter a valid email";
  }

  //Password Validation
  if (isEmpty(user.password)) {
    errors.password = "Must not be empty";
  } else if (isStrongPassword(user.password)) {
    errors.password = "Weak!!";
  }

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      const userDataForToken = {
        uid: data.user.uid,
      };
      return jwtToken(userDataForToken);
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      if (err.code === "auth/wrong-password") {
        return res.status(403).json({ genaral: "Wrong Password" });
      } else if (err.code === "auth/user-not-found") {
        return res.status(404).json({ general: "Invalid user" });
      } else {
        console.error(err);
        return res.status(500).json({ error: err.code });
      }
    });
});

// Telling the firebase that all our routs are in the app
exports.api = functions.https.onRequest(app);
