const express = require("express");
const { connectToDB, sql } = require("../config/db_connect");

const router = express.Router();

router.get("/records", async (req, res) => {
  try {
    const pool = await connectToDB();
    const result = await pool.request().query("SELECT * FROM record_table");

    res.status(200).json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
