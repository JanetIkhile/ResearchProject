const express = require('express'); // Import express
const Measures = require('../models/measures.model'); // Import measures model
const router = express.Router(); // Make a router   
const { getMeasures, getMeasuresById, createMeasures, updateMeasures, deleteMeasures, saveMeasures } = require('../controllers/measures.controller'); // Import measures controller
const { create } = require('domain');

router.get('/', getMeasures); // Get all measures
router.get('/:id', getMeasuresById); // Get measure by id
router.post("/results", createMeasures); // Post measure
router.post("/save", saveMeasures); // Save measure
router.put("/:id", updateMeasures); // Update measure by id
router.delete("/:id", deleteMeasures); // Delete measure by id

module.exports = router; // Export router