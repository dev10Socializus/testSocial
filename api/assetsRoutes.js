const express = require("express");
const router = express.Router();

const { Asset } = require("../models");

// Endpoint that retrieve all activities 
router.get("/api/assets/activities", async (req, res) => {

    try {
        const assets = await Asset.find({ type: "activities" })
        //   Display activities lists in JSON format
        res.status(200).json(assets); 
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
})

 // Endpoint that retrieve all languages 
router.get("/api/assets/langues", async (req, res) => {

    try {
        const assets = await Asset.find({ type: "language" })
        res.status(200).json(assets);  // Display languages lists in JSON format
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
})

module.exports = router;