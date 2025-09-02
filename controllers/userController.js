const { connectToDB } = require("../db/mongoClient"); // or wherever your DB code is
const jwt = require("jsonwebtoken");
const secretKey = process.env.JSON_WEB_KEY;

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = await connectToDB();
    const users = db.collection("users");
    //  insure that the password match
    const user = await users.findOne({ email, password }); // directly in query
    console.log("user - ", user);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const username = user.username;
    console.log("user backend result - ", user);
    const token = jwt.sign(
      { email, username, password },
      process.env.JSON_WEB_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Only send over HTTPS
      sameSite: "None", // Ensure it works across domains
      maxAge: 3600000, // 1 hour
    });
    res.cookie("username", user.username, {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user: ", error);
    res.status(500).json({ error: "Failed to retrieve user data." });
  }
};
const clearCookies = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/", // important to match the original cookie
    });

    res.clearCookie("username", {
      secure: true,
      sameSite: "None",
      path: "/", // also make sure the path matches
    });

    return res.status(200).json({ message: "Cookies cleared" });
  } catch (err) {
    console.error("Error clearing cookies:", err);
    return res.status(500).json({ error: "Failed to clear cookies." });
  }
};
const signupUser = async (req, res) => {
  const { email, username, password } = req.body;
  console.log(req.body);
  const token = jwt.sign(
    {
      email,
      username,
      password,
    },
    secretKey,
    { expiresIn: "1h" }
  );

  console.log(token);

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ error: "Email, Username and password required" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Enter a valid email" });
  }
  try {
    const db = await connectToDB();
    const users = db.collection("users");
    const emailExisting = await users.findOne({ email });
    const usernameExisting = await users.findOne({ username });
    if (emailExisting) {
      return res.status(409).json({ error: "email already exists" });
    }
    if (usernameExisting) {
      return res.status(409).json({ error: "email already exists" });
    }
    const result = await users.insertOne({ email, username, password });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax", // or 'None' if cross-origin with HTTPS
      secure: false, // true only if using HTTPS
      maxAge: 1000 * 60 * 60, // 1 hour
    });
    res.cookie("username", username, {
      secure: false, // true on HTTPS
      sameSite: "Lax", // or "Strict"
    });
    res
      .status(201)
      .json({ message: "User created", userId: result.insertedId });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { loginUser, signupUser, clearCookies };
