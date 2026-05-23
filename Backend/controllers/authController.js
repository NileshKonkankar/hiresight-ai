const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.code = "AUTH_CONFIG_MISSING";
    throw error;
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const isPresentString = (value) => typeof value === "string" && value.trim().length > 0;
const normalizeEmail = (email) => email.trim().toLowerCase();

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!isPresentString(name) || !isPresentString(email) || !isPresentString(password)) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const normalizedEmail = normalizeEmail(email);
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = createToken(user._id);
    res.json({ token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (error.code === "AUTH_CONFIG_MISSING") {
      console.error("Register error:", error.message);
      return res.status(500).json({ message: "Authentication is not configured on the server" });
    }

    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isPresentString(email) || !isPresentString(password)) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id);
    res.json({ token });
  } catch (error) {
    if (error.code === "AUTH_CONFIG_MISSING") {
      console.error("Login error:", error.message);
      return res.status(500).json({ message: "Authentication is not configured on the server" });
    }

    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
