require("dotenv").config();

const path = require("path");

const rootDir = path.resolve(__dirname, "../..");

module.exports = {
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET || "banco-familiar-desarrollo",
  databaseUrl: process.env.DATABASE_URL || "",
  databaseFile: path.resolve(rootDir, process.env.DATABASE_FILE || "./data/banco-familiar.sqlite"),
  rootDir
};
