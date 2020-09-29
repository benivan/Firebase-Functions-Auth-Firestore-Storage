const { db } = require("../util/admin");
const firebase = require("firebase");

const config = require("../util/config");
const { validateSignupData, validateLoginData } = require("../util/validators");
const { getSignedJwtToken } = require("../util/SignedJwtToken");

firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

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
      const accessToken = getSignedJwtToken(userForToken);
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
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  //Validation
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      const userDataForToken = {
        uid: data.user.uid,
        email: data.user.email,
      };
      return getSignedJwtToken(userDataForToken);
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
};
