// express
const express = require("express");
const router = express.Router();
const { authToken } = require("../middleware/authToken");

//  imports
const { getStockPrices, getStock } = require("../controllers/stockController");

router.get("/all", authToken, getStockPrices);
router.post("/:ticker", authToken, getStock);

module.exports = router;
