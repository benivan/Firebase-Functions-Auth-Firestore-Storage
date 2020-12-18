const { db, admin } = require("../util/admin");
const firebase = require("firebase");

const config = require("../util/config");

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../util/validators");
const { getSignedJwtToken } = require("../util/SignedJwtToken");

firebase.initializeApp(config);

//Signup
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  const profileImage = "default-image.png";

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${profileImage}?alt=media`,
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
  return res.status(201);
};
//Login
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
      return res.status(200).json({token});
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
  return res.status(200);
};
exports.logout = (req,res) =>{
  res.status(220);
}
//Get UserDetails
exports.getUserDetails = (req, res) => {
  let userDetails = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userDetails.userCredentials = doc.data();
        return db
          .collection("notifications")
          .where("recipient", "==", req.user.handle)
          .orderBy("createdAt", "desc")
          .get();
      } else {
        return res.status(404).json({ error: `${req.user.handle} not found` });
      }
    })
    .then((snapshot) => {
      userDetails.notifications = [];
      snapshot.forEach((doc) => {
        userDetails.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          type: doc.data().type,
          screamId: doc.data().screamId,
          read: doc.data().read,
          notificationId: doc.id,
        });
      });
      return res.json(userDetails);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
//Add UserDetails
exports.addUserDetails = (req, res) => {
  // const userDetailFromReqBody = {
  //   bio: req.body.bio,
  //   website: req.body.website,
  //   location: req.body.location,
  // };
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details added Successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//Upload Image
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers, body: req.body });

  let imageFileName;
  let imageToBeUplaoded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (
      mimetype !== "image/jpg" &&
      mimetype !== "image/jpge" &&
      mimetype !== "image/png"
    ) {
      return res.status(400).json({ error: "Wrong File type!" });
    }
    //my.image.jpe
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    //random imange name  184445165486.png
    imageFileName = `${Date.now()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);

    imageToBeUplaoded = { filepath, mimetype };

    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUplaoded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUplaoded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image Uplaoded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
  return res.status(201);
};

exports.getOtheruserDetails = (req, res) => {
  let userDetails = {};
db.doc(`/users/${req.params.handle}`).get().then((doc) =>{
  if (doc.exists){
    userDetails = doc.data();
    return db.collection("screams").where("userHandle","==",req.params.handle).get();
  }else{
    return res.status(404).json({error:"User Dont Found!"})
  }
}).then((snapshot)=>{
  userDetails.screams = [];
  snapshot.forEach((doc)=>{
  userDetails.screams.push({
  screamId :doc.id,
  body:doc.data().body,
  createdAt:doc.data().createdAt,
  commentCount:doc.data().commentCount,
  likeCount: doc.data().likeCount,
  unlikeCount:doc.data().unlikeCount,
  image:doc.data().imageUrl,
  userHandle:doc.data().handle,
});
});
return userDetails;
}).then(()=>{
  return res.json(userDetails);
}).catch((err)=>{
  console.error(err);
  return res.status(500).json({error:"something went wrong!"});
});
};

exports.markNotificationRead = (req,res) =>{
}