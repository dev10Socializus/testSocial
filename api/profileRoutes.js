const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const { User } = require("../models");
const uid2 = require("uid2");

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

//Check the regular expression for  the mail
const checkMail = (mail) => {
  mail = mail.trim();
  if (mail.length == 0) return false; // empty string
  if (mail.indexOf(" ") != -1) return false; // contain a whitespace

  let temp = mail.indexOf("@");
  if (temp == -1) return false; //ne contient pas d'arobase

  const t = mail.split("@");
  if (t.length > 2) return false; // plusieur arobase;

  const after = t[1];
  if (after.length < 4) return false; //texte situé après le arobase inférieur à 4 lettres

  temp = after.indexOf(".");
  if (temp == -1) return false; //texte situé après l'arobase ne contient pas de point

  temp = after.slice(temp + 1);
  // gerer l'extension du nom de domaine
  if (temp.length < 2) return false; //"l'extension" du domaine (.com , .fr , ... ) fait moins de 2 lettres
  if (temp.length > 4) return false; //"l'extension" du domaine (.com , .fr , ... ) fait plus de 4 lettres

  return true;
};

// Cloudinary to store images .
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  //La configuration du cloudinary qui permet de stocker les images grace une api qui se trouve au niveau du fichier .env disponible dans filezilla
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// permet de creer un objet de type user
const createUserObj = (user) => {
  // recupere les informations issues de la base de données de l'utilisateur
  return {
    userName: user.userName,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    sexe: user.sexe,
    city: user.city,
    nativeLanguage: user.nativeLanguage,
    spokenLanguage: user.spokenLanguage,
    phone: user.phone,
    birthday: user.birthday,
    about: user.about,
    hobby: user.hobby,
    children: user.children,
    tobacco: user.tobacco,
    alcohol: user.alcohol,
    isPersonalAccount: user.isPersonalAccount,
    memberId: user.memberId,
    token: user.token,
    email: user.email,
  };
};

//-----------------------------FAKE TEST ----------------------------------------------

// Creation d'un faux utilisateur pour effectuer des tests

// EndPoint that allow to create a profile for a user
router.post("/api/profile/createprofile", fileUpload(), async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(402).json({ error: "Authorization header missing" });
      return;
    }

    const authorizationToken = req.headers.authorization.replace("Bearer ", ""); // use bearer token to authorize the connection
    const user = await User.findOne({ token: authorizationToken });

    if (!user) {
      res.status(403).json({ error: "Incorrect user token" });
      return;
    }

    const o = req.body;
    const {
      sexe,
      isPersonalAccount,
      firstName,
      lastName,
      userName,
      city,
      nativeLanguage,
    } = o;

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
});

//-------------------- EDIT PROFILE STEP 1 -------------------------------------
//Endpoint that create profile
router.post("/api/profile/editprofile1", fileUpload(), async (req, res) => {
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
    res.status(200).json({ result: "OK", user: userObj });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//-------------------- EDIT PROFILE STEP 2 ------------------------------------
//Endpoint that create profile

router.post("/api/profile/editprofile2", async (req, res) => {
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
    const lastName = o.lastName;
    const phone = o.phone;
    const birthday = o.birthday;
    const email = o.email;
    const security = o.security;

    console.log(
      "BIRTHDAY = ",
      birthday,
      Number(birthday),
      isNaN(Number(birthday))
    );

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
    if (!email || email === "" || !checkMail(email)) {
      res.status(401).json({ error: "Invalid email" });
      return;
    }
    if (!security || security.length != 5 || !onlyChars(security, "01")) {
      res.status(401).json({ error: "Invalid security" });
    }

    user.lastName = lastName;
    user.phone = phone;
    user.birthday = birthday;
    user.email = email;
    user.askFriendSecurity = security;
    await user.save();

    res.status(200).json({ result: "OK" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//-------------------- EDIT PROFILE STEP 3 -------------------------------------

// Endpoint that create profile
router.post("/api/profile/editprofile3", async (req, res) => {
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
    const about = o.about;
    const hobbies = o.hobbies;
    const spokenLanguage = o.spokenLanguage;
    const children = o.children;
    const tobacco = o.tobacco;
    const alcohol = o.alcohol;

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

    user.about = about;
    user.hobbies = hobbies;
    user.spokenLanguage = spokenLanguage;
    user.children = children;
    user.tobacco = tobacco;
    user.alcohol = alcohol;
    await user.save();

    res.status(200).json({ result: "OK" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
