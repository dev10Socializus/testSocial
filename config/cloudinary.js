// Connecto to cloudinary api
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // cloudinary name
  api_key: process.env.CLOUDINARY_API_KEY, // api key
  api_secret: process.env.CLOUDINARY_API_SECRET, // secret key
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
module.exports = { cloudinary, convertToBase64 };
