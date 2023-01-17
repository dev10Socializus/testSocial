const express = require("express");
const router = express.Router();
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { sendMail, generateCode } = require("../utils");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const path = require("path");
//-------
const SHA256 = require("crypto-js/sha256");
//uid2 generator of id
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");

// mongo models --------
const { User, VerifyEmail } = require("../models");

//---------------------------------- SIGN UP ---------------------------------------
// Check the differents conditions to sign up

const checkMail = (mail) => {
  mail = mail.trim();
  if (mail.length == 0) return false; // empty string
  if (mail.indexOf(" ") != -1) return false; // contain a whitespace

  let temp = mail.indexOf("@");
  if (temp == -1) return false; //not contain the @ symbole

  const t = mail.split("@");
  if (t.length > 2) return false; // contain more @symbole

  const after = t[1];
  if (after.length < 4) return false; //text located after the @ is less than 4 letters

  temp = after.indexOf(".");
  if (temp == -1) return false; // text located after the @ doesn't contain dot sign.
  temp = after.slice(temp + 1);
  // check the domain extension
  if (temp.length < 2) return false; // Less than 2 letters
  if (temp.length > 4) return false; // more than 4 letters

  return true;
};

const findCharsInText = (text, chars) => {
  //cherche si une lettre contenu dans "text" est présente dans "chars"
  for (let i = 0; i < text.length; i++) {
    if (chars.indexOf(text[i]) != -1) {
      return true;
    }
  }
  return false;
};

//Password Verification .

const checkPass = (pass) => {
  pass = pass.trim();

  if (pass.length === 0) return false; //empty string
  if (pass.length < 8) return false; // password length is lower than 8 letters

  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (!findCharsInText(pass, chars)) return false; //pas de lettre minuscule
  chars = chars.toUpperCase();
  if (!findCharsInText(pass, chars)) return false; //pas de lettre majuscule
  if (!findCharsInText(pass, "0123456789")) return false; //pas de chiffre
  if (!findCharsInText(pass, `²&é~"#'{([-|è_ç^à@)]=}^¨$£ù%*µ,?;.:/!§`))
    return false; //pas de caractère spéciaux

  return true;
};

// Hash Password  based to enBase64 encoding.
const passwordToHash = (pass, salt) => {
  return SHA256(pass + salt).toString(encBase64);
};

const createUserObj = (user) => {
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

//------------------------------------------------------------

//Endpoint that create user accounts .
router.post("/api/login/signup", async (req, res) => {
  try {
    const o = req.body;
    const email = o.email;
    const pass = o.pass;
    console.log("User = ", User);
    //Conditions between email and pass.
    if (!email) {
      res.status(400).json("You must enter an email"); //Email is required
      return;
    }
    if (!checkMail(email)) {
      res.status(400).json("Invalid email"); // Invalid email
      return;
    }

    if (!pass) {
      res.status(400).json("You must enter a password"); //Check if user put a password
      return;
    }
    // if (!checkPass(pass)) {
    //     res.status(400).json("Invalid password")
    //     return;
    // }

    //const allUsers = await User.find();

    // Find if user exist
    const userExist = await User.findOne({ email: email });
    console.log("userExist = ", userExist);
    if (userExist !== null) {
      res.status(401).json("An account based on that email already exist"); // check if email already exist .
      return;
    }

    let memberId = await User.countDocuments({});
    memberId++;

    const token = uid2(32);
    const salt = uid2(16);
    const user = new User({
      email: email,
      salt: salt,
      token: token,
      hash: passwordToHash(pass, salt),
      lastActionTime: new Date().getTime(),
      memberId: memberId,
    });

    await user.save();

    const code = generateCode();
    // Verify Email;

    await new VerifyEmail({
      email: email,
      token: jwt.sign({ email: email, code: code }, process.env.JWT_KEY, {
        expiresIn: "2d",
      }),
    }).save();

    const template = await fs.readFile(
      path.join(__dirname, "/../templates/VerificationCodeEmailTemplate.html"),
      { encoding: "utf-8" }
    );

    const html = template.replace("{{CODE}}", code);
    await sendMail({
      from: `Socializus <${process.env.MAIL_FROM}>`,
      to: email,
      subject: "Email verification",
      text: `Here is your email verification code: ${code}`,
      html: html,
    });

    const userObj = createUserObj(user);
    res
      .status(200)
      .json({ result: "Account successfuly created !", user: userObj });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

//--------------------------------SIGN IN----------------------------------------

// EndPoint that allow user to sign in .

router.post("/api/login/signin", async (req, res) => {
  try {
    const o = req.body;
    const email = o.email;
    const pass = o.pass;

    if (!email) {
      res.status(400).json({ error: "You must enter an email" });
      return;
    }
    if (!pass) {
      res.status(400).json({ error: "You must enter a password" });
      return;
    }

    const User = await user.findOne({ email: email });
    if (passwordToHash(pass, user.salt) !== user.hash) {
      res.status(401).json({ error: "Password or email incorrect" });
      return;
    }
    User.lastActionTime = new Date().getTime();
    await User.save();

    //const userObj = createUserObj(user);
    const { salt, hash, ...userObj } = user._doc;

    res.status(200).json({
      result: "OK",
      user: userObj,
    });
  } catch (e) {
    res.status(402).json({ error: e.message });
  }
});

//------------ changement de mot de passe, envoi de mail avec code de vérification -----------------

// EndPoint that send code that mail associated with the user.
// User receive a code in mail.
router.post("/api/login/sendcode", async (req, res) => {
  try {
    const o = req.body;
    const email = o.email;
    const subject = o.email;
    let message = o.message;

    const user = await User.findOne({ email: email });
    // if user hasn't a account yet
    if (user === null) {
      res.status(404).json("No account uses this email"); // check mail address
      return;
    }

    const code = "" + Math.round(Math.random() * 999999);
    user.verificationCode = code;
    user.verificationCodeTime = new Date().getTime();
    await user.save();

    message = message.split("######").join(code);

    // const mailgun = new Mailgun(formData);

    // const client = mailgun.client({
    //     username: "Socializus",
    //     key: process.env.MAILGUN_PRIVATE_KEY
    // })

    // const messageData = {
    //     from: `socializus <noreply@socializus.com>`,
    //     to: email,
    //     subject: subject,
    //     text: message
    // }

    // try {
    //     await client.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    //     res.status(200).json({ result: "ok" })
    // } catch (e) {
    //     res.status(400).json({ error: e.message })
    // }

    try {
      await sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: subject,
        text: message,
      });
    } catch (err) {
      res.status(400).json({ error: e.message });
    }
  } catch (e) {
    res.status(402).json({ error: e.message });
  }
});

// EndPoint that check the code sending by mail.
router.post("/api/login/checkcode", async (req, res) => {
  try {
    const o = req.body;
    const code = o.code;
    const email = o.email;

    const user = await User.findOne({ email: email });
    if (user === null) {
      res.status(404).json("No account uses this email");
      return;
    }

    const verifTime = user.verificationCodeTime;
    const difTime = new Date().getTime() - verifTime;
    const difInSeconds = Math.round(difTime / 1000);
    const difInMinutes = Math.round(difInSeconds / 60);
    // timer to enter the right code
    if (difInMinutes > 30) {
      //
      res.status(402).json({
        error: "The verification code expired. You must generate a new one.",
      });
      return;
    }

    if (user.verificationCode !== "" + code) {
      res.status(402).json({ error: "wrong code !" });
      return;
    }

    res.status(200).json({ result: "OK", time: difInMinutes });
  } catch (e) {
    res.status(402).json({ error: e.message });
  }
});

//EndPoint that Change Password  if the user foget it  in login session
router.post("/api/login/changepassword", async (req, res) => {
  try {
    const o = req.body;
    const email = o.email;
    const pass = o.pass;
    const code = o.code;

    if (!checkPass(pass)) {
      res.status(400).json("Invalid password"); // Password is invalid
      return;
    }

    const user = await User.findOne({ email: email });
    if (user === null) {
      res.status(401).json("No account uses this email"); //  email is not associated with a user
      return;
    }

    if (code !== user.verificationCode) {
      res.statusCode(401).json("Incorrect verification code"); // if the code is incorrect
      return;
    }

    const verifTime = user.verificationCodeTime;
    const difTime = new Date().getTime() - verifTime;
    const difInSeconds = Math.round(difTime / 1000);
    const difInMinutes = Math.round(difInSeconds / 60);

    if (difInMinutes > 30) {
      res.status(402).json({
        error: "The verification code expired. You must generate a new one.",
      }); // Generate a new code
      return;
    }

    user.hash = passwordToHash(pass, user.salt);
    user.lastActionTime = new Date().getTime();
    await user.save();

    res.status(200).json({ result: "OK" });
  } catch (e) {
    res.status(402).json({ error: e.message });
  }
});

//--------------------------------------------------------------------------------

//Endpoint that sending mail to user accounts .
/*
router.post("/api/sendmail", (req, res) => {
    const o = req.body;
    const lastName = o.lastName;
    const firstName = o.firstName;
    const email = o.email;
    const subject = o.subject;
    const message = o.message;
    console.log("body = ", req.body);


    const mailgun = new Mailgun(formData);

    const client = mailgun.client({
        username: "Socializus",
        key: process.env.MAILGUN_PRIVATE_KEY
    })


    const messageData = {
        from: `${firstName} ${lastName} <${email}>`,
        to: "fanthomas.lecoz@gmail.com",
        subject: subject,
        text: message
    }

    client.messages.create(process.env.MAILGUN_DOMAIN, messageData)
        .then(res => console.log(res))
        .catch(err => console.log(err)); 

})
*/

//--------------------------------------------------------------------------------
//Endpoint that verify user email
router.post("/api/login/verify-email", async (req, res) => {
  try {
    const verifyEmail = await VerifyEmail.findOne({ email: req.body.email });
    if (verifyEmail) {
      try {
        const { code } = jwt.verify(verifyEmail.token, process.env.JWT_KEY);
        console.log("The code is:", code);

        if (req.body.code === code) {
          await User.findOneAndUpdate(
            { email: req.body.email },
            {
              $set: {
                isVerified: true,
                verifiedAt: new Date().toLocaleString(),
              },
            }
          );
          await VerifyEmail.findByIdAndDelete(verifyEmail._id);
          res.status(200).json("Votre email a bien été vérifié"); // check mail
        } else {
          return res.status(400).json("Code de vérification incorrect"); // incorrect vérification code
        }
      } catch (err) {
        return res.status(400).json("Code de vérification expiré"); // if the verification code expired
      }
    } else {
      return res
        .status(404)
        .json("L'email indiqué d'existe pas dans la base de données"); // check if the mail is already in the database
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
