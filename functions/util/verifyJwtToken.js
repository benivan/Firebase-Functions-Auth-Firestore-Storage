const { db } = require("./admin");
const jwt = require("jsonwebtoken");
const { json } = require("express");

require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token === null) return res.sendStatus(400);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;

    db.collection("users")
      .where("userId", "==", req.user.uid)
      .limit(1)
      .get()
      .then((doc) => {
        req.user.handle = doc.docs[0].data().handle;
        req.user.imageUrl = doc.docs[0].data().imageUrl;
        // console.log("Okay here-------------");
        return next();
      })
      .catch((err) => {
        console.error(err);
        return res.status(500);
      });
    return res.status(200);
  });
  return res.status(200);
};
