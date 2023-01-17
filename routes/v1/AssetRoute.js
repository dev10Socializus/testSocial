const express = require("express");
const {
  getAllActivities,
  getAllLanguages,
} = require("../../controllers/v1/assetsControllers");
const router = express.Router();

router.get("/assets/activities", getAllActivities);
router.get("/assets/langues", getAllLanguages);

module.exports = router;
