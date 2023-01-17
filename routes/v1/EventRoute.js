const express = require("express");
const {
  createActivity,
  removeAllActivity,
  leaveActivity,
  joinActivity,
  getActivitiesList,
  forbidAccessPeopleInActivity,
  invitePeople,
  removeOneActivity,
  getActivityListByUserId,
} = require("../../controllers/v1/EventController");
const { verifyAuthorizationToken } = require("../../utils");
const fileUpload = require("express-fileupload");
const router = express.Router();

router.post(
  "/activities/createactivity",
  verifyAuthorizationToken,
  fileUpload(),
  createActivity
);
router.get("/activities/list", getActivitiesList);
router.get("/activities/list/:id", getActivityListByUserId);
router.post("/activities/join", joinActivity);
router.post("/activities/leave", leaveActivity);
router.post("/activities/invite", invitePeople);
router.post("/activities/forbidaccess", forbidAccessPeopleInActivity);
router.delete("/activities/remove", removeAllActivity);
router.delete("/activities/removeone/:id", removeOneActivity);

module.exports = router;
