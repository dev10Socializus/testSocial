const { asset } = require("../../models");

// Get all activities lists
const getAllActivities = async (req, res) => {
  try {
    const assets = await asset.find({ type: "activities" });
    res.status(200).json(assets);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

// get all languages
const getAllLanguages = async (req, res) => {
  try {
    const assets = await asset.find({ type: "language" });
    res.status(200).json(assets);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};
module.exports = { getAllActivities, getAllLanguages };
