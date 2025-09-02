// express
const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  clearCookies,
} = require("../controllers/userController");
const { authToken } = require("../middleware/authToken");

//  imports
router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/logout", authToken, clearCookies);

module.exports = router;
