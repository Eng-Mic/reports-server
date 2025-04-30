const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("colors");

const recordsRoute = require("./routes/recordsRoute"); // Import records route
const limbleRoute = require("./routes/limbleRoute");
const { connect } = require("./config/db_connect");

const data = require("./records"); // dummy record date

// Instantiating server configuration
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Server Configuration
const HOSTNAME = process.env.HOSTNAME || "localhost";
const PORT = parseInt(process.env.PORT || "5000", 10);

// Register routes
// app.use("/api", testRoute);
app.use("/api/records", recordsRoute);
app.use("/api/limble", limbleRoute);

// local data endpoint
// app.get("/api/data", (req, res) => {
//   res.json(data);
// });


app.get("/api/data/eng", (req, res) => {
  res.json(data);
});


// Database Connection
(async () => {
  try {
    await connect();
    console.log("✅ Connected to the database.".green);
  } catch (error) {
    console.error("❌ Database connection failed!".red, error);
    process.exit(1); // Exit process if DB connection fails
  }
})();

// Start Server
const server = app.listen(PORT, HOSTNAME, () => {
  console.log(`🚀 Server running at http://${HOSTNAME}:${PORT}/`.cyan.underline);
});

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down server...".yellow);
  server.close(() => {
    console.log("🚀 Server stopped.".red);
    process.exit(0);
  });
});
