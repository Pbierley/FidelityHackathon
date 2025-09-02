const { connectToDB } = require("../db/mongoClient");
const axios = require("axios");

// Utility: Fetch stock metadata from Polygon
async function fetchPolygonStockMeta(ticker) {
  const apiKey = process.env.POLYGON_API_KEY;
  const url = `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${apiKey}`;
  const response = await axios.get(url);
  const { results } = response.data;

  return {
    ticker: results.ticker,
    name: results.name,
    description: results.description,
    market_cap: results.market_cap,
    logo: results.branding.icon_url,
  };
}

// Utility: Fetch stock trading data from AlphaVantage
async function fetchAlphaVantageQuote(ticker) {
  const ApiKey = process.env.A_KEY;
  console.log("api key -", ApiKey);
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${ApiKey}`;
  const response = await axios.get(url);
  console.log("fetchAlphaVantageQuote response", response);
  return response.data["Time Series (Daily)"];
}

// GET /api/stocks — return all stock entries from DB
const getStockPrices = async (req, res) => {
  try {
    const db = await connectToDB();
    const stocks = await db.collection("stocks").find({}).toArray();
    res.json(stocks);
  } catch (error) {
    console.error("Error fetching stock prices:", error);
    res.status(500).json({ error: "Failed to retrieve stock data." });
  }
};

// POST /api/stocks — upsert a stock entry
const getStock = async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ error: "Ticker is required." });
  }

  const upperTicker = ticker.trim().toUpperCase();

  try {
    const db = await connectToDB();
    const stocks = db.collection("stocks");

    // Check if already in DB
    let existing = await stocks.findOne({ ticker: upperTicker });

    // If not found, fetch and insert
    if (!existing) {
      console.log(
        `Ticker ${upperTicker} not found in DB. Fetching from Polygon...`
      );
      try {
        const newStock = await fetchPolygonStockMeta(upperTicker);
        const result = await stocks.insertOne(newStock);
        console.log(`Inserted ${upperTicker} with _id: ${result.insertedId}`);
        existing = newStock;
      } catch (err) {
        console.error("Polygon API error:", err.response?.data || err.message);
        return res
          .status(502)
          .json({ error: "Failed to fetch data from Polygon API." });
      }
    }

    // Optionally update with AlphaVantage trading data
    try {
      const tradingData = await fetchAlphaVantageQuote(upperTicker);
      console.log("tradingData from alphaVantage", tradingData);
      //  check to prevent null from alphaVantage
      if (tradingData !== null || tradingData == !undefined) {
        await stocks.updateOne(
          { ticker: upperTicker },
          { $set: { tradingData } }
        );
        console.log("trading data updated from alphaVantage");
        existing.tradingData = tradingData;
      }
    } catch (err) {
      console.warn("AlphaVantage fetch failed (non-blocking):", err.message);
    }

    return res.status(200).json(existing);
  } catch (err) {
    console.error("Internal server error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getStockPrices, getStock };
