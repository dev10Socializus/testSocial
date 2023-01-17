const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { verifyAuthorizationToken } = require("../utils");
/**
 *  Les routes pour la gestion des ulilisateurs
 *
 * */

// Endpoint to retrieve user list
// Récupérer tous les utilisateurs
router.get("/api/user/getuserlist", async (req, res) => {
  try {
    /*req.query contiens les arguments passer dans l'url :  ?<name>=<value>
        Par exemple : /api/user/getuserlist?limit=10&skip=5 donne 

        req.query => {limit : 10,skip :5}
        */

    const o = req.query;

    const skip = Number(o.skip); // sauter les <skip> premières données
    const limit = Number(o.limit); //prendre au maximum <limit> données

    const result = await User.find().limit(limit).skip(skip);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// End Point that retrieve list of user's avatar by id
// OFF :  A revoire , ne faire pas un post
router.post(
  "/api/user/getavatarlistfromids",
  verifyAuthorizationToken,
  async (req, res) => {
    try {
      const indexs = req.body.indexs;
      const result = await User.find({ _id: { $in: indexs } }).select([
        "_id",
        "avatar",
        "userName",
      ]);
      res.status(200).json({ result: result });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

//EndPoint that create list of user's avatar by id.
// Récuperer les avatars des utilisateurs dont leurs id sont envoyé dans le body de la requette
router.get(
  "/api/user/getavatarlistfromids",
  verifyAuthorizationToken,
  async (req, res) => {
    try {
      const indexs = req.body.indexs;
      const result = await User.find({ _id: { $in: indexs } }).select([
        "_id",
        "avatar",
        "userName",
      ]);
      res.status(200).json({ result: result });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

//  EndPoint that retrieve a user avatar, his id given
// Récupérer l'avatar d'un tuilisateur connaissant son id
router.get("/api/user/get_user_avatar", async (req, res) => {
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
});

// EndPoint that get a user informations
// Renvoyer les informations d'un user
router.get("/api/user/:id", verifyAuthorizationToken, async (req, res) => {
  /*
        req.params contient les donnée formaté dans l'url par (:<name>) (différent de req.query )
        Dans le cas /api/user/:id : /api/user/2 => req.params = {id : 2}
    */
  try {
    const user = await User.findById(req.params.id);

    const {
      token,
      hash,
      salt,
      verificationCode,
      verificationCodeTime,
      ...info
    } = user._doc;
    res.status(200).json(info);
  } catch (err) {
    res.status(500).json(err);
  }
});

// EndPoint that allow to start a discussion by sending a message.
router.put("/api/user/new_chat", verifyAuthorizationToken, async (req, res) => {
  try {
    // add message
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { chats: req.body.chat_id } },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

/*
router.put("/api/user/delete_chat", verifyAuthorizationToken, async (req, res) => {
    try {
        User.findById(req.user.id)
        // filter et choose the corresponding id
        .then(user => {
            user.chats = user.chats.filter(id => id !== req.body.chat_id)
            user.save()
            .then(() => res.status(200).json(user))
            .catch(err => res.status(500).json(err))
        })
        .catch(err => res.status(500).json(err))
    } catch(err) {
        res.status(500).json(err)
    }
})*/

// EndPoint that delete message
router.delete(
  "/api/user/delete_chat",
  verifyAuthorizationToken,
  async (req, res) => {
    try {
      User.findById(req.user.id)
        // filter et choose the corresponding id
        .then((user) => {
          user.chats = user.chats.filter((id) => id !== req.body.chat_id);
          user
            .save()
            .then(() => res.status(200).json(user))
            .catch((err) => res.status(500).json(err));
        })
        .catch((err) => res.status(500).json(err));
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

module.exports = router;
