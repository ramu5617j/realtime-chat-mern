const mongoose = require("mongoose");

// Workaround for Windows + Node DNS SRV issues with MongoDB Atlas
try {
  // Available in modern Node versions
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  const dns = require("node:dns/promises");
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {
  // Safe to ignore if not supported; default DNS will be used
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;