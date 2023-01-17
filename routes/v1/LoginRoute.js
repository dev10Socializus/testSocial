const express = require("express");
const {
  signin,
  signup,
  changePassword,
  sendEmailVerification,
  sendCode,
  checkMail,
} = require("../../controllers/v1/LoginController");
const router = express.Router();

router.post("/login", signin);
router.post("/email-send", sendEmailVerification);
router.post("/change-password", changePassword);
router.post("/signup", signup);
router.post("/verify-email", checkMail);
router.post("/sendcode", sendCode);

module.exports = router;
