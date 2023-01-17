const express = require("express");
const {
  getUsersList,
  getUserInfo,
  getUserAvatarById,
} = require("../../controllers/v1/userControllers");
const router = express.Router();
const { verifyAuthorizationToken } = require("../../utils");

router.get("/user/:id", verifyAuthorizationToken, getUserInfo);
router.get("/user/getuserlist", getUsersList);
router.get("/user/get_user_avatar", getUserAvatarById);

module.exports = router;
