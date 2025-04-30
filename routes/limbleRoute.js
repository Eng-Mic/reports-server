const express = require('express');
const router = express.Router();
const limbleController = require('../controllers/limbleController');

// Base endpoints for retrieving all resources
// router.get('/assets', limbleController.getAllAssets);
// router.get('/locations', limbleController.getAllLocations);
// router.get('/tasks', limbleController.getAllTasks);

router.get('/tasks/:assetName', limbleController.getTasksByAssetWithAssociations);

module.exports = router;