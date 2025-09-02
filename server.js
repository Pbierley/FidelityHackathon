const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

app.use(express.json());
app.use(
  cors({
    origin: "http://127.0.0.1:5501",
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  console.log("main route called");
  res.render("index");
});

const stocksRouter = require("./routes/stocks");
const usersRouter = require("./routes/users");
const commentsRouter = require("./routes/comments");

app.use("/stocks", stocksRouter);
app.use("/users", usersRouter);
app.use("/comments", commentsRouter);

app.listen(process.env.PORT);
