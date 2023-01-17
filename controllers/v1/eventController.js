const { activity, user } = require("../../models");
const { cloudinary, convertToBase64 } = require("../../config/cloudinary");

// @desc Create a new activity
// @route POST /users
// @access Private

const createActivity = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const User = await user.findOne({ token: authorizationToken });

    if (!User) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const o = req.body;

    const activityId = o.activityId;
    const title = o.title;
    const isOnline = o.isOnline === "true";
    const address = o.address;
    const location = o.location;
    const latitude = o.latitude;
    const longitude = o.longitude;

    const date = o.date;
    const infoLine = o.infoLine;
    const startTime = o.startTime;
    const endTime = o.endTime;
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

    if (date < Date.now()) {
      res.status(408).json({ error: "date cannot be a past date" });
      return;
    }

    if (!startTime) {
      res.status(409).json({ error: "start is missing" });
      return;
    }
    if (isNaN(Number(startTime))) {
      res.status(410).json({ error: "start must be a number" });
      return;
    }
    if (startTime < 0 || startTime > 2359) {
      res.status(411).json({ error: "start must a number between 0 and 2359" });
      return;
    }

    if (!endTime) {
      res.status(412).json({ error: "end is missing" });
      return;
    }
    if (isNaN(Number(endTime))) {
      res.status(413).json({ error: "end must be a number" });
      return;
    }
    if (endTime < 0 || endTime > 2359) {
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
      atitude: latitude,
      longitude: longitude,
      date: date,
      startTime: startTime,
      endTime: endTime,
      isAttendeeLimited: isAttendeeLimited,
      attendeeLimit: attendeeLimit,
      hasPrice: hasPrice,
      price: price,
      ticketLink: ticketLink,
      activityImage: activityImage,
      infoLine: infoLine,
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

    let Activity;
    if (activityId) {
      Activity = await activity.findOne({ _id: activityId });
      if (!Activity) {
        res.status(422).json({ error: "Incorrect activityId" });
        return;
      }

      for (let z in data) {
        Activity[z] = data[z];
      }
    } else {
      Activity = new activity(data);
    }

    await Activity.save();

    res.status(200).json({ result: "OK", Activity: Activity });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
// @desc Leave  activity
// @route POST /users
// @access Private

const getActivityListByUserId = async (req, res) => {
  const activityId = req.params.id;

  activity
    .findById(activityId)
    .then((data) => {
      if (!data)
        res.status(404).send({ message: "Not found activity with id " + id });
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving activity with id=" + id });
    });
};

// @desc retrieve  all activities
// @route DELETE /users
// @access Private
const getActivitiesList = async (req, res) => {
  try {
    const result = activity.find().sort({ topic: -1 });

    res
      .status(200)
      .json({ statut: "Successfully retrieved list of activity", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc join activities
// @route get /activitie
// @access Private

const joinActivity = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", ""); // token for authorization
    const User = await user.findOne({ token: authorizationToken });

    // Verify if user is always logged

    if (!User) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const activityId = req.body;

    const Activity = await activity.findOne({ _id: activityId });
    if (!Activity) {
      res.status(401).json({ error: "Incorrect activityId" });
      return;
    }

    if (Activity.attendees.indexOf(user._id) === -1) {
      Activity.attendees.push(user._id);
      await Activity.save();
    }

    if (User.activities.indexOf(activityId) === -1) {
      User.activities.push(activityId);
      await user.save();
    }

    res.status(200).json({ result: "OK" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// @desc Leave Activity
// @route PATCH /users
// @access Private
const leaveActivity = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const User = await user.findOne({ token: authorizationToken });

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const activityId = req.body;

    // find activity by search .
    const Activity = await activity.findOne({ _id: activityId });
    if (!Activity) {
      res.status(401).json({ error: "Incorrect activityId" });
      return;
    }

    let id = activity.attendees.indexOf(User._id);
    if (id !== -1) {
      activity.attendees.splice(id, 1);
      await activity.save();
    }

    id = User.activities.indexOf(activityId);
    if (id !== -1) {
      User.activities.splice(id, 1);
      await User.save();
    }

    res.status(200).json({ result: "Leave activity : Success" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// @desc  remove all activity
// @route Delete /activity
// @access Private
const removeAllActivity = async (req, res) => {
  try {
    const result = await activity.find();
    const nb = result.length;
    for (let i = 2; i < nb; i++) {
      await activity.findByIdAndDelete(result[i]._id);
    }

    res.status(200).json({ status: "You have removed all activities" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc  forbid people all activity
// @route Post /activity
// @access Private

const forbidAccessPeopleInActivity = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const User = await user.findOne({ token: authorizationToken });

    if (!User) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const { activityId, forbiddenList } = req.body;

    const Activity = await activity.findOne({ _id: activityId });
    if (!Activity) {
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

    await Activity.save();

    res.status(200).json({ result: "OK", Activity: Activity });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// @desc  invite people in  activity
// @route Post /activity
// @access Private

const invitePeople = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", "");
    const User = await user.findOne({ token: authorizationToken });

    if (!User) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    // handle invitation
    const { activityId, invitationList } = req.body;

    const Activity = await activity.findOne({ _id: activityId });
    if (!Activity) {
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
      if (Activity.invitations.indexOf(invitationList[i]) === -1) {
        Activity.invitations.push(invitationList[i]);
        invitations.push(invitationList[i]);
      }
    }

    for (let i = 0; i < invitations; i++) {
      const people = await user.findOne({ _id: invitations[i] });
      if (!people) {
        res.status(401).json({ error: "Invalid invation userId" });
        return;
      }
      if (people.activityInvitations.indexOf(activityId) === -1) {
        people.activityInvitations.push(activityId);
        await people.save();
      }
    }

    await Activity.save();

    res.status(200).json({ result: "OK", Activity: Activity });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const removeOneActivity = async (req, res) => {
  const activityId = req.params.id;
  console.log(activityId);

  activity
    .findByIdAndRemove(activityId)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete activity with id=${id}. Maybe activity was not found!`,
        });
      } else {
        res.send({
          message: "activity was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Tutorial with id=" + id,
      });
    });
};

module.exports = {
  createActivity,
  getActivitiesList,
  joinActivity,
  leaveActivity,
  removeAllActivity,
  removeOneActivity,
  forbidAccessPeopleInActivity,
  invitePeople,
  getActivityListByUserId,
};
