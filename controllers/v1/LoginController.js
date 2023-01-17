const { user, verifyEmail, otp } = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SHA256 = require("crypto-js/sha256");
const { generateCode, sendMail } = require("../../utils");
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const generateToken = require("../../middleware/token/GenerateToken");

// User Signin (sign in)
const signin = async (req, res) => {
  try {
    const passwordToHash = (pass, salt) => {
      return SHA256(pass + salt).toString(encBase64);
    };
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: "You must enter an email" });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "You must enter a password" });
      return;
    }

    const User = await user.findOne({ email: email });
    if (passwordToHash(password, User.salt) !== User.hash) {
      res.status(401).json({ error: "Password or email incorrect" });
      return;
    }
    User.lastActionTime = new Date().getTime();
    await User.save();

    //const userObj = createUserObj(user);
    const { salt, hash, ...userObj } = User._doc;

    res.status(200).json({
      result: "OK",
      User: userObj,
    });
  } catch (e) {
    res.status(402).json({ error: e.message });
  }
};

// create User Object
const createUserObj = (User) => {
  return {
    userName: User.userName,
    firstName: User.firstName,
    lastName: User.lastName,
    avatar: User.avatar,
    sexe: User.sexe,
    city: User.city,
    nativeLanguage: User.nativeLanguage,
    spokenLanguage: User.spokenLanguage,
    phone: User.phone,
    birthday: User.birthday,
    about: User.about,
    hobby: User.hobby,
    children: User.children,
    tobacco: User.tobacco,
    alcohol: User.alcohol,
    isPersonalAccount: User.isPersonalAccount,
    memberId: User.memberId,
    token: User.token,
    email: User.email,
  };
};

// user create account (sign up)
const signup = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    // empty fields
    if (email === "" || password === "") {
      res.status(400).json({ message: "Please fill all fields" });
    }
    // email type verification
    else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      res.status(400).json({ message: "Please enter a valid email" });
      //Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      )
    ) {
      res.status(400).json({ message: "Please enter a valid password" });
    } else {
      // if user is already registered
      user
        .find({ email: email })
        .then(async (result) => {
          if (result.length) {
            res
              .status(400)
              .json({ status: "Failed", message: "Email already registered" });
          } else {
            // try to create the user
            //Hash the password
            const passwordToHash = (pass, salt) => {
              return SHA256(pass + salt).toString(encBase64);
            };
            let memberId = await user.countDocuments({});
            memberId++;

            const token = uid2(32);
            const salt = uid2(16);
            const User = new user({
              email: email,
              salt: salt,
              token: token,
              hash: passwordToHash(password, salt),
              memberId: memberId,
              createdAt: new Date().getTime(),
              lastActionTime: new Date().getTime(),
            });
            await User.save();

            // geneate code after successful registration
            const code = generateCode();

            await new verifyEmail({
              email: email,
              token: jwt.sign(
                { email: email, code: code },
                process.env.SECRET_JWT,
                { expiresIn: "2d" }
              ),
            }).save();

            const template = await fs.readFile(
              path.join(
                __dirname,
                "/../../templates/VerificationCodeEmailTemplate.html"
              ),
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

            const userObj = createUserObj(User);
            res.status(200).json({
              statut: " Success",
              result: "Account successfuly created !",
              User: userObj,
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.json({
            status: "Failed",
            message: "An error occured while checking for existing user !",
          });
        });
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An error occured while creating user!",
    });
  }
};

//verification of a new user's email address (check code )

const sendEmailVerification = async (req, res) => {
  let data = await user.findOne({ email: req.body.email });
  console.log(data);
  const response = {};
  if (data) {
    let otpcode = generateCode();
    let otpData = new otp({
      email: req.body.email,
      code: otpcode,
      expireIn: new Date().getTime() + 300 * 1000,
    });
    let otpResponse = await otpData.save();
    response.statusText = "Success";
    response.message = "Please check your Email id";
  } else {
    response.statusText = "Error";
    response.message = "Email Id not Exist";
  }
  // the user receive the code from email

  res.status(200).json(response);
};

// user change password (change password )

const changePassword = async (req, res) => {
  let data = await otp.findOne({ email: req.body.email, code: req.body.otp });
  const responseType = {};
  if (data) {
    let currentTime = new Date().getTime();
    let diff = data.expireIn - currentTime;
    if (diff < 0) {
      responseType.statusText = "Error";
      responseType.message = "Token Expired";
    } else {
      let user = await user.findOne({ email: req.body.email });
      user.password = req.body.password;
      user.save();
      responseType.message = "Password Changed Successfully";
      responseType.statusText = "Success";
    }
  } else {
    responseType.message = "Invalid Otp";
    responseType.statusText = "Error";
  }
  res.status(200).json(responseType);
};

//vérification de l'email d'un nouveau compte (verify email)
const checkMail = async (req, res) => {
  try {
    const verifyEmail = await verifyEmail.findOne({ email: req.body.email });
    if (verifyEmail) {
      try {
        const { code } = jwt.verify(verifyEmail.token, process.env.JWT_KEY);
        console.log("The code is:", code);

        if (req.body.code === code) {
          await user.findOneAndUpdate(
            { email: req.body.email },
            {
              $set: {
                isVerified: true,
                verifiedAt: new Date().toLocaleString(),
              },
            }
          );
          await verifyEmail.findByIdAndDelete(verifyEmail._id);
          res.status(200).json("Your email has been verified");
        } else {
          return res.status(400).json("Incorrect verification code");
        }
      } catch (err) {
        return res.status(400).json("Expired verification code");
      }
    } else {
      return res
        .status(404)
        .json("The indicated email does not exist in the database");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

//send a verification code by email to change your password (sendcode)
const sendCode = async (req, res) => {
  let data = await user.findOne({ email: req.body.email });
};

module.exports = {
  signin,
  signup,
  sendEmailVerification,
  changePassword,
  checkMail,
  sendCode,
};
