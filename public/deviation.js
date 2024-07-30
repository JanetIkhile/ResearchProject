'use strict';

var deviations = []; // Array to store deviations from the intended path
var touchTimes = []; // Array to store touch times for calculating time variability
var accelerations = []; // Array to store accelerations for calculating peak acceleration variability
const blockSize = 5; // Number of trials to consider in the block, can be changed as needed

var pauseIdentifier = 0;
var pauseCounter = 0;
var totalPauseTime = 0;
var specificPauseDuration = 0;

// At the touch start
document.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    deviations = []; // Reset deviations array at the start of each touch
    accelerations = []; // Reset accelerations array at the start of each touch
    touchStartX = touch.pageX; // Initialize touch start coordinates (x-axis)
    touchStartY = touch.pageY; // Initialize touch start coordinates (y-axis)
    startTime = Date.now(); // Record the start time of the touch
    previousTime = startTime; // Initialize previous time for acceleration calculation
    previousChangeInSpeed = 0; // Initialize previous speed for acceleration calculation
    pauseIdentifier = startTime;
    pauseCounter = 0;
    totalPauseTime = 0;
    specificPauseDuration = 0;
});

// Finger is moving on the screen
document.addEventListener("touchmove", e => {
    e.preventDefault(); // Prevent default touch behavior to track custom touch events

    const touch = e.changedTouches[0];
    let currentX = touch.pageX; // Store current x location as finger is moving
    let currentY = touch.pageY; // Store current y location as finger is moving

    // Calculate deviation from intended path using the calculateDeviation function
    const deviation = calculateDeviation(touchStartX, touchStartY, targetPoint.offsetLeft, targetPoint.offsetTop, currentX, currentY);
    deviations.push(deviation); // Store each deviation in the array

    // Calculate instantaneous acceleration
    const currentTime = Date.now();
    const changeInTime = currentTime - previousTime; // Time difference between the current and previous touch points
    if (changeInTime > 0) {
        // Calculate distance change between current and previous touch points
        const changeInDistance = calculateDistance(touchStartX, currentX, touchStartY, currentY);
        // Calculate speed change (change in distance divided by change in time)
        const changeInSpeed = changeInDistance / changeInTime;
        // Calculate instantaneous acceleration (change in speed divided by change in time)
        const instantaneousAcceleration = (changeInSpeed - previousChangeInSpeed) / changeInTime;

        // Store valid acceleration values
        if (!isNaN(instantaneousAcceleration) && isFinite(instantaneousAcceleration)) {
            accelerations.push(instantaneousAcceleration);
        }

        // Update previous values for the next move
        previousTime = currentTime;
        previousChangeInSpeed = changeInSpeed;
        touchStartX = currentX; // Update the start coordinates for the next move
        touchStartY = currentY;
    }

    // Handle pauses
    if (pauseIdentifier != startTime) {
        if (pauseIdentifier <= currentTime - 100) {
            pauseCounter++;
            specificPauseDuration = currentTime - pauseIdentifier;
            if (specificPauseDuration > totalPauseTime) {
                totalPauseTime += specificPauseDuration;
            }
        }
    }
    pauseIdentifier = currentTime;
});

// Finger leaves the screen
document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const touchEndTime = Date.now(); // Get the current time at touch end
    const touchTime = touchEndTime - startTime; // Calculate the duration of the touch event (end time - start time)
    touchTimes.push(touchTime); // Store touch time

    // Store the touch time and peak accelerations in local storage
    storeTouchTimeAndAccelerations(touchTime, accelerations);

    // Calculate average, maximum, and median deviations from the path
    const averageDeviation = calculateAverageDeviation(deviations); // Average deviation from path/task axis
    const maxDeviation = Math.max(...deviations); // Maximum deviation from task axis
    const medianDeviation = calculateMedianDeviation(deviations); // Median deviation from task axis

    // Retrieve the last block of touch times from local storage
    const lastBlockTimes = getLastBlockTouchTimes(blockSize);
    const formattedLastBlockTimes = formatTouchTimes(lastBlockTimes);

    // Retrieve the last block of peak accelerations from local storage
    const lastBlockAccelerations = getLastBlockPeakAccelerations(blockSize);
    const formattedLastBlockAccelerations = formatAccelerations(lastBlockAccelerations);

    // Calculate maximum time variability (max time) for the last block of trials
    const maxTimeVariability = Math.max(...lastBlockTimes);

    // Calculate execution time variability
    const executionTimeVariability = calculateExecutionTimeVariability(lastBlockTimes);

    // Calculate the coefficient of variation for execution times using the last block of touch times
    const coefVariation = calculateCoefficientOfVariation(lastBlockTimes);

    // Calculate peak acceleration
    const peakAcceleration = Math.max(...accelerations);

    // Calculate peak acceleration variability
    const peakAccelerationVariability = calculateCoefficientOfVariation(lastBlockAccelerations);

    // Calculate movement time (complete movement time from target onset to successful click)
    const movementTime = touchTime;

    // Calculate movement time variability (coefficient of variation of movement times in a block of trials)
    const movementTimeVariability = calculateCoefficientOfVariation(touchTimes.slice(-blockSize));

    // Calculate execution time without pauses
    const executionTimeWithoutPauses = Math.max(0, touchTime - totalPauseTime); // Ensure it doesn't go below 0

    // Calculate last block times without pauses
    const lastBlockTimesWithoutPauses = getLastBlockTimesWithoutPauses(lastBlockTimes, totalPauseTime);

    // Add deviation and time variability results to the existing results string
    results += `
    ---------------------------------------------------------------------------
    Average Deviation from Path: ${averageDeviation.toFixed(2)} px
    Maximum Deviation from Path: ${maxDeviation.toFixed(2)} px
    Median Deviation from Path: ${medianDeviation.toFixed(2)} px
    Movement Time: ${movementTime.toFixed(2)} ms
    Movement Time Variability: ${movementTimeVariability.toFixed(2)}%
    Execution Time without Pauses: ${executionTimeWithoutPauses.toFixed(2)} ms
    Last Block Times without Pauses: ${lastBlockTimesWithoutPauses}
    Maximum Time Variability: ${maxTimeVariability.toFixed(2)} ms
    Last ${blockSize} Touch Times (Execution Time): ${formattedLastBlockTimes}
    Last ${blockSize} Peak Accelerations: ${formattedLastBlockAccelerations}
    Peak Acceleration: ${peakAcceleration.toFixed(8)} ms^2
    Peak Acceleration Variability: ${peakAccelerationVariability.toFixed(2)}%`;

    // Display the results in a modal
    modalContent.innerText = results;
    modal.style.display = 'block';
});

// Function to calculate execution time without pauses
function calculateExecutionTimeWithoutPauses(touchTimes) {
    const totalExecutionTime = touchTimes.reduce((acc, time) => acc + time, 0); // Sum of all touch times
    return totalExecutionTime - totalPauseTime; // Subtract total pause time
}

// Function to calculate last block times without pauses
function getLastBlockTimesWithoutPauses(lastBlockTimes, totalPauseTime) {
    const lastBlockTimesWithoutPauses = lastBlockTimes.map(time => Math.max(0, time - totalPauseTime));
    return formatTouchTimes(lastBlockTimesWithoutPauses);
}

// Function to calculate execution time variability (without pauses)
function calculateExecutionTimeVariabilityWithoutPauses(touchTimes) {
    const totalPauseTime = pauseCounter * 100; // Total pause time (assuming each pause is at least 100 ms)
    const timeWithoutPauses = touchTimes.map(time => time - totalPauseTime); // Subtract pauses from each touch time
    return calculateCoefficientOfVariation(timeWithoutPauses); // Calculate coefficient of variation for times without pauses
}

// Function to calculate the deviation from the intended path
// Uses the formula for the perpendicular distance from a point to a line
function calculateDeviation(x1, y1, x2, y2, x, y) {
    // Perpendicular distance formula: |(y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1| / sqrt((y2 - y1)^2 + (x2 - x1)^2)
    return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

// Function to calculate the average deviation from the path
function calculateAverageDeviation(deviations) {
    const sum = deviations.reduce((acc, val) => acc + val, 0); // Sum of all deviations
    return sum / deviations.length; // Mean of deviations (sum of deviations divided by the number of deviations)
}

// Function to calculate the median deviation from the path
function calculateMedianDeviation(deviations) {
    const sorted = deviations.slice().sort((a, b) => a - b); // Sort deviations in ascending order
    const mid = Math.floor(sorted.length / 2); // Find the middle index
    // Return median value: if odd number of deviations, return the middle one; if even, return the average of the two middle ones
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Function to store touch times and peak accelerations in local storage
function storeTouchTimeAndAccelerations(touchTime, accelerations) {
    let storedTouchTimes = JSON.parse(localStorage.getItem('touchTimes')) || []; // Retrieve existing touch times from local storage or initialize an empty array
    storedTouchTimes.push(touchTime); // Add the new touch time to the array
    if (storedTouchTimes.length > blockSize) {
        storedTouchTimes.shift(); // Keep only the last 'blockSize' times
    }
    localStorage.setItem('touchTimes', JSON.stringify(storedTouchTimes)); // Store updated touch times back to local storage

    let storedAccelerations = JSON.parse(localStorage.getItem('peakAccelerations')) || []; // Retrieve existing peak accelerations from local storage or initialize an empty array
    const peakAcceleration = Math.max(...accelerations); // Calculate peak acceleration for this touch event
    if (!isNaN(peakAcceleration) && isFinite(peakAcceleration)) {
        storedAccelerations.push(peakAcceleration); // Add the new peak acceleration to the array
        if (storedAccelerations.length > blockSize) {
            storedAccelerations.shift(); // Keep only the last 'blockSize' peak accelerations
        }
        localStorage.setItem('peakAccelerations', JSON.stringify(storedAccelerations)); // Store updated peak accelerations back to local storage
    }
}

// Function to retrieve the last block of touch times from local storage
function getLastBlockTouchTimes(blockSize) {
    let storedTouchTimes = JSON.parse(localStorage.getItem('touchTimes')) || []; // Retrieve touch times from local storage
    return storedTouchTimes.slice(-blockSize); // Get the last 'blockSize' touch times
}

// Function to retrieve the last block of peak accelerations from local storage
function getLastBlockPeakAccelerations(blockSize) {
    let storedAccelerations = JSON.parse(localStorage.getItem('peakAccelerations')) || []; // Retrieve peak accelerations from local storage
    return storedAccelerations.slice(-blockSize); // Get the last 'blockSize' peak accelerations
}

// Function to format touch times as a string
function formatTouchTimes(touchTimes) {
    return touchTimes.map(time => `${time}ms`).join(', '); // Format each touch time as 'timems' and join them with a comma and space
}

// Function to format peak accelerations as a string
function formatAccelerations(accelerations) {
    return accelerations.map(acc => `${acc.toFixed(8)}ms^2`).join(', '); // Format each acceleration as 'accelerationms^2' and join them with a comma and space
}

// Function to calculate the mean of an array
function calculateMean(array) {
    const sum = array.reduce((acc, val) => acc + val, 0); // Sum of all values in the array
    return sum / array.length; // Mean of the array (sum of values divided by the number of values)
}

// Function to calculate the standard deviation of an array
function calculateStandardDeviation(array, mean) {
    // Variance: sum of squared differences from the mean, divided by the number of values
    const variance = array.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / array.length;
    return Math.sqrt(variance); // Standard deviation: square root of the variance
}

// Function to calculate the coefficient of variation for an array
function calculateCoefficientOfVariation(array) {
    const mean = calculateMean(array); // Calculate mean
    const stdDev = calculateStandardDeviation(array, mean); // Calculate standard deviation
    return (stdDev / mean) * 100; // Coefficient of variation: (standard deviation / mean) * 100
}

// Function to calculate execution time variability
function calculateExecutionTimeVariability(touchTimes) {
    // Calculate differences between consecutive touch times
    const timeDifferences = touchTimes.slice(1).map((time, index) => time - touchTimes[index]);
    // Calculate standard deviation of the time differences
    return calculateStandardDeviation(timeDifferences, calculateMean(timeDifferences));
}

// Function to calculate distance between two points
function calculateDistance(x1, x2, y1, y2) {
    // Distance formula: sqrt((x2 - x1)^2 + (y2 - y1)^2)
    const disX = x2 - x1;
    const disY = y2 - y1;
    return Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2));
}
