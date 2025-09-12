// express
const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  getBalance,
  updateBalance,
  clearCookies,
} = require("../controllers/userController");
const { authToken } = require("../middleware/authToken");

//  imports
router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/getBalance", getBalance);
router.post("/updateBalance", updateBalance);
router.post("/logout", authToken, clearCookies);

module.exports = router;
