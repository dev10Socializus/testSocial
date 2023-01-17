const express = require("express");
const fileUpload = require("express-fileupload");
const {
  createProfile,
  createProfileStepOne,
  createProfileStepTwo,
  createProfileStepThree,
} = require("../../controllers/v1/profileController");

const router = express.Router();
const { verifyAuthorizationToken } = require("../../utils");

router.post("/profile/createprofile", fileUpload(), createProfile);
router.post("/profile/editprofile/1", fileUpload(), createProfileStepOne);
router.post("/profile/editprofile/2", createProfileStepTwo);
router.post("/profile/editprofile/3", createProfileStepThree);

module.exports = router;
