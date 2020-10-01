const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.getSignedJwtToken = (userdata) => {
  const token = jwt.sign(userdata, process.env.ACCESS_TOKEN_SECRET);
  return token;
};
