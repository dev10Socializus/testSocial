const { user } = require("../../models");
const uid2 = require("uid2");
const { cloudinary, convertToBase64 } = require("../../config/cloudinary");

//-----------------------------Handle characters-----------------------------------------------------

const specialChars = `²&é~"#'{([-|è_ç^à@)]=}^¨$£ù%*µ,?;.:/!§`;
const numbers = `0123456789`;
//manage invalid characters
const invalidChars = specialChars + numbers;

const findCharsInText = (text, chars) => {
  //cherche si une lettre contenu dans "text" est présente dans "chars"
  for (let i = 0; i < text.length; i++) {
    if (chars.indexOf(text[i]) !== -1) {
      return true;
    }
  }
  return false;
};
// declaration de la constante onlychar qui gere un texte et ses caracteres
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

// Create profile :
const createProfile = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", ""); // use bearer token to authorize the connection
    const user = await user.findOne({ token: authorizationToken });

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }
    const {
      sexe,
      isPersonalAccount,
      firstName,
      lastName,
      userName,
      city,
      nativeLanguage,
    } = req.body;

    try {
      if (!sexe || (sexe !== "male" && sexe != "female")) {
        res.status(410).json({ error: "sexe invalid" });
        return;
      }
      if (
        "" + isPersonalAccount != "true" &&
        "" + isPersonalAccount != "false"
      ) {
        res.status(411).json({ error: "isPersonalAccount invalid" });
        return;
      }
      if (
        !firstName ||
        firstName === "" ||
        findCharsInText(firstName, invalidChars)
      ) {
        res.status(412).json({ error: "Invalid firstName" });
        return;
      }
      if (
        !lastName ||
        lastName === "" ||
        findCharsInText(lastName, invalidChars)
      ) {
        res.status(413).json({ error: "Invalid lastName" });
        return;
      }
      if (
        !userName ||
        userName === "" ||
        findCharsInText(userName, specialChars)
      ) {
        res.status(414).json({ error: "Invalid userName" });
        return;
      }
      if (!city || city === "" || findCharsInText(city, invalidChars)) {
        res.status(415).json({ error: "Invalid city" });
        return;
      }
      if (
        !nativeLanguage ||
        nativeLanguage === "" ||
        findCharsInText(nativeLanguage, invalidChars)
      ) {
        res.status(416).json({ error: "Invalid nativeLanguage" });
        return;
      }

      if (!req.files.image) {
        res.status(417).json({ error: "no image found" });
        return;
      }
    } catch (e) {}
    user.sexe = sexe;
    user.isPersonalAccount = isPersonalAccount;
    user.firstName = firstName;
    user.lastName = lastName;
    user.userName = userName;
    user.city = city;
    user.nativeLanguage = nativeLanguage;

    /* const uploadImage = await cloudinary.uploader.upload(activityImage, {
        activityId: activityId,
        allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif"],
      });
      console.log(uploadImage);*/

    try {
      const pictureToUpload = req.files.image;
      const result = await cloudinary.uploader.upload(
        convertToBase64(pictureToUpload)
      );
      user.avatar = result.secure_url;
    } catch (e) {
      res.status(420).json({ error: e.message });
      return;
    }

    await user.save();

    const userObj = createUserObj(user);
    res.status(200).json({ result: "OK", user: userObj });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Create Profile Step 1
const createProfileStepOne = async (req, res) => {
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
    const isPersonalAccount = o.isPersonalAccount;
    const firstName = o.firstName;
    const userName = o.userName;
    const city = o.city;
    const nativeLanguage = o.nativeLanguage;

    // Conditions for the user profile

    if ("" + isPersonalAccount != "true" && "" + isPersonalAccount != "false") {
      res.status(401).json({ error: "Invalid isPersonalAccount" });
      return;
    }
    if (
      !firstName ||
      firstName === "" ||
      findCharsInText(firstName, invalidChars)
    ) {
      res.status(401).json({ error: "Invalid firstName" });
      return;
    }
    if (
      !userName ||
      userName === "" ||
      findCharsInText(userName, specialChars)
    ) {
      res.status(401).json({ error: "Invalid userName" });
      return;
    }
    if (!city || city === "" || findCharsInText(city, invalidChars)) {
      res.status(401).json({ error: "Invalid city" });
      return;
    }
    if (
      !nativeLanguage ||
      nativeLanguage === "" ||
      findCharsInText(city, invalidChars)
    ) {
      res.status(401).json({ error: "Invalid nativeLanguage" });
      return;
    }
    if (!req.files.image) {
      res.status(401).json({ error: "image not found" });
      return;
    }

    user.isPersonalAccount = isPersonalAccount;
    user.firstName = firstName;
    user.userName = userName;
    user.city = city;
    user.nativeLanguage = nativeLanguage;

    try {
      const image = req.files.image;
      const result = await cloudinary.uploader.upload(convertToBase64(image));
      user.avatar = result.secure_url;
    } catch (e) {
      res.status(402).json({ error: e.message });
      return;
    }

    await user.save();

    const userObj = createUserObj(user);
    res
      .status(200)
      .json({ result: "Create Profile step One Done", user: userObj });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Create Profile Step 1
const createProfileStepTwo = async (req, res) => {
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

    const { firstName, lastName, phone, birthday, email, security } = req.body;

    console.log(
      "BIRTHDAY = ",
      birthday,
      Number(birthday),
      isNaN(Number(birthday))
    );

    if (
      !firstName ||
      firstName === "" /*|| findCharsInText(firstName, invalidChars)*/
    ) {
      res.status(401).json({ error: "Invalid firstName" });
      return;
    }
    if (
      !lastName ||
      lastName === "" /*|| findCharsInText(lastName, invalidChars)*/
    ) {
      res.status(401).json({ error: "Invalid lastName" });
      return;
    }
    if (!phone || phone === "" || !onlyChars(phone, "+0123456789")) {
      res.status(401).json({ error: "Invalid phone" });
      return;
    }
    if (!birthday || isNaN(Number(birthday))) {
      res.status(401).json({ error: "Invalid birthday" });
      return;
    }
    if (
      !email ||
      email === "" ||
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
    ) {
      res.status(401).json({ error: "Invalid email" });
      return;
    }
    if (!security || security.length != 5 || !onlyChars(security, "01")) {
      res.status(401).json({ error: "Invalid security" });
    }

    User.firstName = firstName;
    User.lastName = lastName;
    User.phone = phone;
    User.birthday = birthday;
    User.email = email;
    User.askFriendSecurity = security;
    await User.save();

    res.status(200).json({ result: "Create Profile step Two Done" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// create profile step 3
const createProfileStepThree = async (req, res) => {
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

    const { about, spokenLanguage, hobbies, children, tobacco, alcohol } =
      req.body;

    if (!about) {
      res.status(401).json({ error: "Invalid about" });
      return;
    }
    if (!hobbies || hobbies instanceof Array === false) {
      res.status(401).json({ error: "Invalid hobbies" });
      return;
    }
    if (!spokenLanguage || spokenLanguage instanceof Array === false) {
      res.status(401).json({ error: "Invalid spokenLanguage" });
      return;
    }
    if (isNaN(children) || children < 0 || children >= 3) {
      res.status(401).json({ error: "Invalid children" });
      return;
    }
    if (isNaN(tobacco) || tobacco < 0 || tobacco >= 3) {
      res.status(401).json({ error: "Invalid tobacco" });
      return;
    }
    if (isNaN(alcohol) || alcohol < 0 || alcohol >= 3) {
      res.status(401).json({ error: "Invalid alcohol" });
      return;
    }

    User.about = about;
    User.hobbies = hobbies;
    User.spokenLanguage = spokenLanguage;
    User.children = children;
    User.tobacco = tobacco;
    User.alcohol = alcohol;
    await User.save();

    res.status(200).json({ result: "Create Profile step three Done" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

module.exports = {
  createProfile,
  createProfileStepOne,
  createProfileStepTwo,
  createProfileStepThree,
};
