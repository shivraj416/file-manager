import mongoose from "mongoose";

// User schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

// Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.json({ success: false, message: "User already exists" });

    await User.create({ username, password });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});
