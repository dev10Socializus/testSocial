const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (data) => {
  const token = jwt.sign(data, process.env.SECRET_JWT, { expiresIn: "30d" });
  return token;
};

module.exports = generateToken;
