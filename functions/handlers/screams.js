const { db } = require("../util/admin");

//GetAllScreams
exports.getAllScreams = (req, res) => {
  return db
    .collection("screams")
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
};

//GetAllScream of Authorized user
exports.getUserScreams = (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .where("userHandle", "==", req.user.handle)
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          createdAt: doc.data().createdAt,
          body: doc.data().body,
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
};

//PostOneScream by Authorized User
exports.postOneScream = (req, res) => {
  //Request body
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
    //  admin.firestore.Timestamp.fromDate(new Date()),
    //Uses Firebae date stamp
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      res.json({ message: `Scream created successfully` });
      return res.status(201);
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};

exports.getScream = (req, res) => {
  let screamData = {};
  let reqParam = req.params.screamId.slice(0, -1);
  db.doc(`/screams/${reqParam}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ Error: `${reqParam} Scream not Found.` });
      }

      screamData = doc.data();
      screamData.screamId = doc.id;

      return (
        db
          .collection("comments")
          .where("screamId", "==", reqParam)
          // .orderBy("createdAt", "desc")
          .get()
      );
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.commentOnScream = (req, res) => {
  // let reqParam = req.params.screamId.slice(0,-1);
  if (req.body.body.trim() === "")
    return res.status(400).json({ error: "must not be empty" });
  const newComment = {
    body: req.body.body,
    userHandle: req.user.handle,
    screamId: req.params.screamId,
    createdAt: new Date().toISOString(),
  };

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res
          .status(404)
          .json({ error: "scream not fonund", screamId: req.params.screamId });
      }
      return db
        .collection("comments")
        .add(newComment)
        .then((doc) => {
          res.json({
            message: `Comment created successfully `,
          });
          return res.status(201);
        })
        .catch((err) => {
          res.status(500).json({ error: "somethig went wrong" });
          console.error(err);
        });
    });
};
