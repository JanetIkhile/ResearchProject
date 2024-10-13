const mongoose = require('mongoose');
//const { object } = require('webidl-conversions');
const MeasuresSchema = mongoose.Schema(
    {
        // _id: mongoose.Schema.Types.ObjectId,
        // date: {
        //     type: Date,
        //     required: false
        // }
        tapDuration: {
            type: String,
            required: false
        },
        straightLineDistance: {
            type: Number,
            required: true
        },
        totalDistanceTraveled: {
            type: String,
            required: true
        },
        totalTime: {
            type: String,
            required: true
        },
        averageDragSpeed: {
            type: String,
            required: true
        },
        lastSpeed: {
            type: String,
            required: true
        },
        peakSpeed: {
            type: String,
            required: true
        },
        timeToPeakSpeed: {
            type: String,
            required: true
        },
        lastAcceleration: {
            type: String,
            required: true
        },
        averageAcceleration: {
            type: String,
            required: true
        },
        tapAreaSize: {
            type: String,
            required: true
        },
        shortestPathDistance: {
            type: String,
            required: true
        }
    });

const Measures = mongoose.model('Measures', MeasuresSchema);
module.exports = Measures;