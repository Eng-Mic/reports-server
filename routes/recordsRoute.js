const express = require("express");
const {
  getHourlyRecordsLast3Months,
  getAllRecordsEng,
  getAssetData,
  // getProductionRecords,
} = require("../controllers/recordsController");

const router = express.Router();

router.get("/", getHourlyRecordsLast3Months);
// router.get("/eng", getAllRecordsEng);


router.get('/eng', getAllRecordsEng);
router.get('/assets/:asset', getAssetData);
// router.get("/production", getProductionRecords);

module.exports = router;