const { json } = require("express");
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
          likeCount:doc.data().likeCount,
          unlikeCount:doc.data().unlikeCount,
          imageUrl:doc.data().image,
          commentCount:doc.data().commentCount
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
    //data = querysnapshot
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          createdAt: doc.data().createdAt,
          body: doc.data().body,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          unlikeCount: doc.data().unlikeCount,
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
    image: req.user.imageUrl,
    likeCount: 0,
    unlikeCount: 0,
    commentCount: 0,
    //  admin.firestore.Timestamp.fromDate(new Date()),
    //Uses Firebae date stamp
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      const resScream = newScream;
      resScream.screamId = doc.id;
      res.json({ resScream });
      return res.status(201);
    })
    .catch((err) => {
      res.status(500).json({ error: "somethig went wrong" });
      console.error(err);
    });
};

exports.getScream = (req, res) => {
  let screamData = {};
  let reqParam = req.params.screamId;
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
        var commentData =  doc.data();
        commentData.commentId = doc.id;
        screamData.comments.push(commentData);
        // screamData.comments.push(commentId = doc.id);
        console.log(doc.id);
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
    imageUrl:req.user.imageUrl,
    screamId: req.params.screamId,
    createdAt: new Date().toISOString(),
  };
  //Gets the desire doc to updtate the data
  const screamDocument = db.collection("screams").doc(req.params.screamId);

  let screamData;

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res
          .status(404)
          .json({ error: "scream not fonund", screamId: req.params.screamId });
      }
      //copying Scream data
      screamData = doc.data();
      return db
        .collection("comments")
        .add(newComment)
        .then((doc) => {
          const resComment = newComment;
          resComment.commentId = doc.id;
          res.json({ resComment });
          screamData.commentCount++;
          return screamDocument.update({
            commentCount: screamData.commentCount,
          });
        })
        .then(() => {
          return res.status(201);
        })
        .catch((err) => {
          res.status(500).json({ error: "somethig went wrong" });
          console.error(err);
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
    });
};

exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("screamId", "==", req.params.screamId)
    .where("userHandle", "==", req.user.handle);

  const unlikeDocument = db
    .collection("unlikes")
    .where("screamId", "==", req.params.screamId)
    .where("userHandle", "==", req.user.handle);

  const screamDocument = db.collection("screams").doc(req.params.screamId);

  let screamData;
  let IsUnliked;
  let UnlikedDociD;

  unlikeDocument
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return (IsUnliked = false);
      } else {
        UnlikedDociD = snapshot.docs[0].id;
        return (IsUnliked = true);
      }
    })
    .catch((err) => {
      console.error(err);
    });
  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Scream not Found" });
      }
    })
    .then((snapshot) => {
      console.log(IsUnliked, UnlikedDociD);
      if (snapshot.empty) {
        return db
          .collection("likes")
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.handle,
            createdAt: new Date().toISOString(),
          })
          .then(() => {
            screamData.likeCount++;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            if (IsUnliked) {
              return db
                .doc(`/unlikes/${UnlikedDociD}`)
                .delete()
                .then(() => {
                  screamData.unlikeCount--;
                  return screamDocument
                    .update({ unlikeCount: screamData.unlikeCount })
                    .then(() => {
                      return res.json(screamData);
                    });
                });
            } else {
              return res.json(screamData);
            }
          });
      } else {
        return res.status(400).json({ error: "Scream already Liked" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "SOmething Went Wrong!" });
    });
};

exports.unlikeScream = (req, res) => {
  const unlikeDocument = db
    .collection("unlikes")
    .where("screamId", "==", req.params.screamId)
    .where("userHandle", "==", req.user.handle);

  const likeDocument = db
    .collection("likes")
    .where("screamId", "==", req.params.screamId)
    .where("userHandle", "==", req.user.handle);

  const screamDocument = db.collection("screams").doc(req.params.screamId);

  let screamData;
  let isLiked;
  let likeDociD;

  //checking for Likes
  likeDocument
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return (isLiked = false);
      } else {
        likeDociD = snapshot.docs[0].id;
        return (isLiked = true);
      }
    })
    .catch((err) => {
      console.error(err);
    });
  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return unlikeDocument.get();
      } else {
        return res.status(404).json({ error: "Scream not Found" });
      }
    })
    .then((snapshot) => {
      console.log(isLiked, likeDociD);
      if (snapshot.empty) {
        return db
          .collection("unlikes")
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.handle,
            createdAt: new Date().toISOString(),
          })
          .then(() => {
            screamData.unlikeCount++;
            return screamDocument
              .update({
                unlikeCount: screamData.unlikeCount,
              })
              .catch((er) => {
                console.error(err);
              });
          })
          .then(() => {
            if (isLiked) {
              return db
                .doc(`/likes/${likeDociD}`)
                .delete()
                .then(() => {
                  screamData.likeCount--;
                  return screamDocument
                    .update({ likeCount: screamData.likeCount })
                    .then(() => {
                      return res.json(screamData);
                    });
                });
            } else {
              return res.json(screamData);
            }
          });
      } else {
        return res.status(400).json({ error: "Scream already DisLiked" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "SOmething Went Wrong!" });
    });
};

// Delete Scream
exports.deleteScream = (req, res) => {
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);

  screamDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(400).json({ Error: "Scream Not Found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return screamDocument.delete();
      }
    })
    .then(() => {
      // TODO: Delete all comment of deleated screams.

      // db.collection("comments").where("screamId","==",req.params.screamId).get().then((snapshot) =>{
      //   snapshot.forEach((doc) =>{
      //     if(doc.exists){
      //       doc(doc.id).delete();
      //     }
      //   })
      // })
      return res.json({ message: "Scream Deleted" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};


exports.getScreamByHandle = (req, res) =>{

  db.collection("screams").where("userHandle","==",req.params.handle).get().then((snapshot) =>{
    screams = [];
    snapshot.forEach((doc) =>{
      screams.push({
        screamId: doc.id,
          createdAt: doc.data().createdAt,
          body: doc.data().body,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          unlikeCount: doc.data().unlikeCount,

      });
    });
    return res.json(screams);
  })
  .catch((err) =>{
    console.error(err);
    return res.status(500).json({error:err.code});
  })

}