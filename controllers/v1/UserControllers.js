const { user } = require("../../models");

// @desc Get all users
// @route GET /users
// @access Private

const getUsersList = async (req, res) => {
  try {
    /*req.query contiens les arguments passer dans l'url :  ?<name>=<value>
        Par exemple : /api/user/getuserlist?limit=10&skip=5 donne 
        req.query => {limit : 10,skip :5}
        */
    const skip = Number(req.body.skip); // sauter les <skip> premières données
    const limit = Number(req.body.limit); //prendre au maximum <limit> données

    const result = await user.find().limit(limit).skip(skip);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

//get user informations
const getUserInfo = async (req, res) => {
  try {
    const User = await user.findById(req.params.id);

    const {
      token,
      hash,
      salt,
      verificationCode,
      verificationCodeTime,
      ...info
    } = User._doc;
    res.status(200).json(info);
  } catch (err) {
    res.status(500).json(err);
  }
};

//  EndPoint that retrieve a user avatar, his id given

const getUserAvatarById = async (req, res) => {
  try {
    if (req.query.id) {
      // si l'id est envoyé
      const avatar = await User.findById(req.query.id).select(["avatar"]);

      res.status(200).json(avatar);
    } else {
      // if the id is not send
      res
        .status(400)
        .json("A user id is required in the request's query string");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getUsersList,
  getUserInfo,
  getUserAvatarById,
};
