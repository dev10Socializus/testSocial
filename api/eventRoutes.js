const express = require("express");
const router = express.Router();
const { Activity, User } = require("../models");
const fileUpload = require("express-fileupload");

const { verifyAuthorizationToken } = require("../utils");
const { cloudinary } = require("../cloudinaryConfig/cloudinary");

//--------------------------------------------------------------------------------------
const specialChars = `²&é~"#'{([-|è_ç^à@)]=}^¨$£ù%*µ,?;.:/!§`;
const numbers = `0123456789`;
const invalidChars = specialChars + numbers;

const findCharsInText = (text, chars) => {
  //cherche si une lettre contenu dans "text" est présente dans "chars"
  for (let i = 0; i < text.length; i++) {
    if (chars.indexOf(text[i]) != -1) {
      return true;
    }
  }
  return false;
};

const onlyChars = (text, chars) => {
  let temp = "" + text;

  while (temp.indexOf(" ") !== -1) {
    temp = temp.replace(" ", "");
  }

  for (let i = 0; i < text.length; i++) {
    if (chars.indexOf(text[i]) === -1) {
      return false;
    }
  }
  return true;
};

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data("base64")}`;
};

//-------------------------------------------------------------------------

// EndPoint that delete events .
//Suppression toutes les activités
router.delete("/api/activities/removeall", async (req, res) => {
  const result = await Activity.find();
  const nb = result.length;
  for (let i = 2; i < nb; i++) {
    await Activity.findByIdAndDelete(result[i]._id);
  }

  res.status(200).json("OK");
});

//Endpoint that retrieves one activity
//Suppression d'une activité
router.get("/api/activities/removeOne/:id", async (req, res) => {
  let id = req.params.id;
  console.log(id);

  Activity.deleteOne({ _id: id });
  res.status(200).json("ok");
});

// Endpoint that retrieve all activities
// Récupération de toutes les activités
router.get("/api/activities/getlist", async (req, res) => {
  const result = Activity.find().sort({ topic: -1 });

  res.status(200).json(result);
});

//----------------

// Endpoint that allow user to leave an activity.
router.post("/api/activities/leave", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token: authorizationToken });

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const o = req.body;
    const activityId = o.activityId;

    // find activity by search .
    const activity = await Activity.findOne({ _id: activityId });
    if (!activity) {
      res.status(401).json({ error: "Incorrect activityId" });
      return;
    }

    let id = activity.attendees.indexOf(user._id);
    if (id !== -1) {
      activity.attendees.splice(id, 1);
      await activity.save();
    }

    id = user.activities.indexOf(activityId);
    if (id !== -1) {
      user.activities.splice(id, 1);
      await user.save();
    }

    res.status(200).json({ result: "OK" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// EndPoint that allow user to join an activity.
router.post("/api/activities/join", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", ""); // token for authorization
    const user = await User.findOne({ token: authorizationToken });

    // Verify if user is always logged

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const o = req.body;
    const activityId = o.activityId;

    const activity = await Activity.findOne({ _id: activityId });
    if (!activity) {
      res.status(401).json({ error: "Incorrect activityId" });
      return;
    }

    if (activity.attendees.indexOf(user._id) === -1) {
      activity.attendees.push(user._id);
      await activity.save();
    }

    if (user.activities.indexOf(activityId) === -1) {
      user.activities.push(activityId);
      await user.save();
    }

    res.status(200).json({ result: "OK" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// EndPoint that allow  user to invite another user to join an activity.
router.post("/api/activities/invite", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token: authorizationToken });

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    // handle invitation
    const o = req.body;
    const activityId = o.activityId;
    const invitationList = o.invitationList;

    const activity = await Activity.findOne({ _id: activityId });
    if (!activity) {
      res.status(401).json({ error: "Incorrect activityId" });
      return;
    }

    if (!invitationList) {
      res.status(401).json({ error: "invalid invitationList" });
      return;
    }

    // manage the invitation list

    let invitations = [];
    for (let i = 0; i < invitationList.length; i++) {
      if (activity.invitations.indexOf(invitationList[i]) === -1) {
        activity.invitations.push(invitationList[i]);
        invitations.push(invitationList[i]);
      }
    }

    for (let i = 0; i < invitations; i++) {
      const people = await User.findOne({ _id: invitations[i] });
      if (!people) {
        res.status(401).json({ error: "Invalid invation userId" });
        return;
      }
      if (people.activityInvitations.indexOf(activityId) === -1) {
        people.activityInvitations.push(activityId);
        await people.save();
      }
    }

    await activity.save();

    res.status(200).json({ result: "OK", activity: activity });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// EndPoint to give a user access to an activity
router.post("/api/activities/forbiddenpeople", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token: authorizationToken });

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const o = req.body;
    const activityId = o.activityId;
    const forbiddenList = o.forbiddenList;

    const activity = await Activity.findOne({ _id: activityId });
    if (!activity) {
      res.status(401).json({ error: "Incorrect activityId" });
      return;
    }

    if (!forbiddenList) {
      res.status(401).json({ error: "invalid forbiddenList" });
      return;
    }

    // add the activity in the list forbidden
    for (let i = 0; i < forbiddenList.length; i++) {
      if (activity.forbiddenPeople.indexOf(forbiddenList[i]) === -1) {
        activity.forbiddenPeople.push(forbiddenList[i]);
      }
    }

    await activity.save();

    res.status(200).json({ result: "OK", activity: activity });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Endpoint that allow  to create an activity
router.post(
  "/api/activities/createactivity",
  verifyAuthorizationToken,
  fileUpload(),
  async (req, res) => {
    try {
      if (!req.headers.authorization) {
        res.status(402).json({ error: "Authorization header missing" });
        return;
      }

      const authorizationToken = req.headers.authorization.replace(
        "Bearer ",
        ""
      );
      const user = await User.findOne({ token: authorizationToken });

      if (!user) {
        res.status(403).json({ error: "Incorrect user token" });
        return;
      }

      const o = req.body;

      const activityId = o.activityId;
      const title = o.title;
      const isOnline = o.isOnline === "true";
      const address = o.address;
      const location = o.location;
      const date = o.date;
      const startTime = o.startTime;
      const isAttendeeLimited = o.isAttendeeLimited;
      const attendeeLimit = Number(o.attendeeLimit);
      const hasPrice = o.hasPrice;
      const price = o.price ? o.price : undefined;
      const ticketLink = o.ticketLink;
      const topic = Number(o.topic);
      const description = o.description;
      const howToFind = o.howToFind;
      const activityImage = o.activityImage;
      const repeatEvent = o.repeatEvent;
      const repeatEventFrequency = o.repeatEventFrequency;
      const repeatEventDays = o.repeatEventDays;
      const repeatEventEndDate = o.repeatEventEndDate;
      const helpForOrganizers = o.helpForOrganizers;
      const hasReminderName = o.hasReminderName;
      const reminderName = o.reminderName;
      const requestCoOrganizers = o.requestCoOrganizers;
      const coOrganizerRequests = o.coOrganizerRequests;
      const coOrganizerOffers = o.coOrganizerOffers;
      const coOrganizerGift = o.coOrganizerGift;
      // // const whatsapp = o.whatsapp;
      // // const fbGroup = o.fbGroup;
      // // const fbPage = o.fbPage;
      // // const meetup = o.meetup;
      // // const telegram = o.telegram;
      // // const otherPage = o.otherPage;
      const friendsOnly = o.friendsOnly;
      const selectPeople = o.selectPeople;
      const allowPhoneNumberDisplay = o.allowPhoneNumberDisplay;
      const allowCoOrganiser = o.allowCoOrganiser === "true";

      if (!title || title === "") {
        res.status(401).json({ error: "title is missing" });
        return;
      }

      if ("" + isOnline !== "true" && "" + isOnline !== "false") {
        res.status(402).json({ error: "isOnline must be a boolean" });
        return;
      }
      if (!isOnline) {
        if (!address || address === "") {
          res.status(403).json({ error: "address is missing" });
          return;
        }
        if (!location) {
          return res.status(403).json({ error: "location is required" });
        }
      }

      if (!date) {
        res.status(406).json({ error: "date is missing" });
        return;
      }
      if (isNaN(Number(date))) {
        res.status(407).json({ error: "date must be a number" });
        return;
      }

      if (Number(date) < Date.now()) {
        res.status(408).json({ error: "date cannot be a past date" });
        return;
      }

      if (!start) {
        res.status(409).json({ error: "start is missing" });
        return;
      }
      if (isNaN(Number(start))) {
        res.status(410).json({ error: "start must be a number" });
        return;
      }
      if (start < 0 || start > 2359) {
        res
          .status(411)
          .json({ error: "start must a number between 0 and 2359" });
        return;
      }

      if (!end) {
        res.status(412).json({ error: "end is missing" });
        return;
      }
      if (isNaN(Number(end))) {
        res.status(413).json({ error: "end must be a number" });
        return;
      }
      if (end < 0 || end > 2359) {
        res.status(414).json({ error: "end must a number between 0 and 2359" });
        return;
      }

      if (isAttendeeLimited && !attendeeLimit) {
        res.status(415).json({ error: "attendeeLimit is missing" });
        return;
      }

      if (isNaN(Number(attendeeLimit))) {
        res.status(416).json({ error: "attendeeLimit must be a number" });
        return;
      }

      if (hasPrice && !ticketLink) {
        res
          .status(417)
          .json({ error: "Activity with a price must show a ticketLink1" });
        return;
      }

      if (!topic || isNaN(Number(topic))) {
        res
          .status(418)
          .json({ error: "topic is missing or invalid (must be a number) " });
        return;
      }

      if (!description || description === "") {
        res.status(419).json({ error: "description is missing" });
        return;
      }

      if (!howToFind || howToFind === "") {
        res.status(420).json({ error: "howToFind is missing" });
        return;
      }

      const data = {
        author: user._id,
        title: title,
        type: topic,
        address: address,
        online: isOnline,
        location: location,
        mapLatitude: latitude,
        mapLongitude: longitude,
        date: date,
        startTime: startTime,
        isAttendeeLimited: isAttendeeLimited,
        attendeeLimit: attendeeLimit,
        hasPrice: hasPrice,
        price: price,
        ticketLink: ticketLink,
        activityImage: activityImage,

        description: description,
        howToFind: howToFind,
        repeatEvent: repeatEvent,
        repeatEventDays: repeatEventDays,
        repeatEventEndDate: repeatEventEndDate,
        repeatEventFrequency: repeatEventFrequency,
        helpForOrganizers,
        hasReminderName,
        reminderName,
        requestCoOrganizers,
        coOrganizerRequests,
        coOrganizerOffers,
        coOrganizerGift,
        // whatsapp: whatsapp,
        // fbGroup: fbGroup,
        // fbPage: fbPage,
        // meetup: meetup,
        // telegram: telegram,
        // otherPage: otherPage,
        friendsOnly: friendsOnly,
        selectPeople: selectPeople,
        allowPhoneNumberDisplay: allowPhoneNumberDisplay,
        allowCoOrganiser: allowCoOrganiser,
      };

      // API cloudinary
      const uploadImage = await cloudinary.uploader.upload(activityImage, {
        activityId: activityId,
        allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif"],
      });
      console.log(uploadImage);

      let activity;
      if (activityId) {
        activity = await Activity.findOne({ _id: activityId });
        if (!activity) {
          res.status(422).json({ error: "Incorrect activityId" });
          return;
        }

        for (let z in data) {
          activity[z] = data[z];
        }
      } else {
        activity = new Activity(data);
      }

      await activity.save();

      res.status(200).json({ result: "OK", activity: activity });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

module.exports = router;
