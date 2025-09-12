const { connectToDB } = require("../db/mongoClient"); // or wherever your DB code is
const jwt = require("jsonwebtoken");
const secretKey = process.env.VITE_JSON_WEB_KEY;
console.log('secretKey', secretKey);
const bcrypt = require("bcrypt");

//TODO encrpyt-decrypt
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = await connectToDB();
    const users = db.collection("users");
    //  insure that the password match
    //updated because it won't work with hashed passwords
    const user = await users.findOne({ email }); // directly in query
    console.log("user - ", user);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." })
    }
    const username = user.username;
    console.log("user backend result - ", user);
    
    //changed: don't include password into token
    const token = jwt.sign(
      { email, username },
      secretKey,
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
    //changed: "res.json(user);", user contains the password, so we use a safe user instead
    const { password: _, ...safeUser } = user;
    res.json(safeUser)
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

//encrypt decrypt
const signupUser = async (req, res) => {
  console.log("Step 1: recieved request", req.body);

  const { email, username, password } = req.body;
  console.log(req.body);
  const token = jwt.sign(
    {
      email,
      username,
    },
    secretKey,
    { expiresIn: "1h" }
  );

  console.log(token);

  if (!email || !password || !username) {
    console.log("Step 2: missing fields");
    return res
      .status(400)
      .json({ error: "Email, Username and password required" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Enter a valid email" });
  }
  try {
    console.log("Step 3: connecting to DB...");
    const db = await connectToDB();
    console.log("Step 4: connected to DB");

    const users = db.collection("users");

    const emailExisting = await users.findOne({ email });
    const usernameExisting = await users.findOne({ username });
    if (emailExisting) {
      return res.status(409).json({ error: "email already exists" });
    }
    if (usernameExisting) {
      return res.status(409).json({ error: "email already exists" });
    }

    
    //replaced "const result = await users.insertOne({ email, username, password });"

    //hash the password
    console.log("Step 6: hashing password...");
    saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //  adding in paperTrading account
    const balance = 10000;

    //save user with hashed password
    console.log("Step 7: inserting user...");
    const result = await users.insertOne({email, username, password: hashedPassword, balance});

    console.log("Step 8: creating JWT...");
    const token = jwt.sign(
    {
      email,
      username
    },
    secretKey,
    { expiresIn: "1h" }
  );

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
