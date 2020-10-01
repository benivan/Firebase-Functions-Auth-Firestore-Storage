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
    .where("userHandle", "==", req.user.handle)
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
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
