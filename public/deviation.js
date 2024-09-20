'use strict';

var deviations = []; // Array to store deviations from the intended path
var touchTimes = []; // Array to store touch times for calculating time variability
var movementTimes = []; // Array to store movement times for calculating movement time variability
var accelerations = []; // Array to store accelerations for calculating peak acceleration variability
const blockSize = 5; // Number of trials to consider in the block, can be changed as needed

var pauseIdentifier = 0;
var pauseCounter = 0;
var totalPauseTime = 0;
var specificPauseDuration = 0;

let deviationStartTime = 0;
let deviationTotalTime = 0;
let deviationTouchStartX, deviationTouchStartY;
let deviationTouchEndX, deviationTouchEndY;
let finalSpeed = 0;
let lastSpeed = 0;
let peakSpeed = 0;
let timeToPeakSpeed = 0;
let previousSpeed = 0;
let previousTime = 0;
let isDragging = false;
let lastAcceleration = 0;
let averageAcceleration = 0;
let initialX = 0;
let initialY = 0;
let previousChangeInSpeed = 0;
let reachedTarget = false; // Flag for tracking if the target has been reached
let totalDistanceTraveled = 0;

let movementTime = 0; // Time to reach the target
let executionTime = 0; // Total time from touchstart to touchend

const startPoint = document.getElementById('startInnerDot');
const targetPoint = document.getElementById('targetInnerDot');
const modalContent = document.getElementById('modalBodyContent');
let deviationResults = "";

// At the touch start
document.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    deviations = []; // Reset deviations array at the start of each touch
    accelerations = []; // Reset accelerations array at the start of each touch
    deviationTouchStartX = touch.pageX; // Initialize touch start coordinates (x-axis)
    deviationTouchStartY = touch.pageY; // Initialize touch start coordinates (y-axis)
    deviationStartTime = Date.now(); // Record the start time of the touch
    previousTime = deviationStartTime; // Initialize previous time for acceleration calculation
    previousChangeInSpeed = 0; // Initialize previous speed for acceleration calculation
    pauseIdentifier = deviationStartTime;
    pauseCounter = 0;
    totalPauseTime = 0;
    specificPauseDuration = 0;
    deviationResults = ""; // Reset results at the start of each touch
    reachedTarget = false; // Reset the target status for each new touch
    movementTime = 0; // Reset movement time
    totalDistanceTraveled = 0; // Reset distance
});

// Finger is moving on the screen
document.addEventListener("touchmove", e => {
    e.preventDefault(); // Prevent default touch behavior to track custom touch events

    const touch = e.changedTouches[0];
    let currentX = touch.pageX; // Store current x location as finger is moving
    let currentY = touch.pageY; // Store current y location as finger is moving

    // Calculate deviation from intended path using the calculateDeviation function
    const deviation = calculateDeviation(deviationTouchStartX, deviationTouchStartY, targetPoint.offsetLeft, targetPoint.offsetTop, currentX, currentY);
    deviations.push(deviation); // Store each deviation in the array

    // Calculate instantaneous acceleration
    const currentTime = Date.now();
    const changeInTime = currentTime - previousTime; // Time difference between the current and previous touch points
    if (changeInTime > 0) {
        // Calculate distance change between current and previous touch points
        const changeInDistance = calculateDistance(deviationTouchStartX, currentX, deviationTouchStartY, currentY);
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
        deviationTouchStartX = currentX; // Update the start coordinates for the next move
        deviationTouchStartY = currentY;
    }

    // Handle pauses
    if (pauseIdentifier != deviationStartTime) {
        if (pauseIdentifier <= currentTime - 100) {
            pauseCounter++;
            specificPauseDuration = currentTime - pauseIdentifier;
            if (specificPauseDuration > totalPauseTime) {
                totalPauseTime += specificPauseDuration;
            }
        }
    }
    pauseIdentifier = currentTime;

    // Get the bounding box of the targetPoint
    const targetRect = targetPoint.getBoundingClientRect(); 

    // Check if the touch is within the bounds of the target element
    if (touch.clientX >= targetRect.left && touch.clientX <= targetRect.right &&
        touch.clientY >= targetRect.top && touch.clientY <= targetRect.bottom && !reachedTarget) {

        reachedTarget = true;
        movementTime = currentTime - deviationStartTime; // Calculate the movement time when the user reaches the target
        console.log(`Target reached. Movement time: ${movementTime} ms`);
    }
});

// Finger leaves the screen
document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const touchEndTime = Date.now(); // Get the current time at touch end
    const touchTime = touchEndTime - deviationStartTime; // Calculate the duration of the touch event (end time - start time)
    touchTimes.push(touchTime); // Store touch time
    movementTimes.push(movementTime); // Store movement time

    // If the target was not reached during the move, set movement time as the full touch time
    if (!reachedTarget) {
        movementTime = touchTime;
    }

    // Store both execution and movement times in local storage
    storeTouchAndMovementTimes(touchTime, movementTime, accelerations);

    // Retrieve last block of times
    const lastBlockTimes = getLastBlockTouchTimes(blockSize);
    const lastBlockMovements = getLastBlockMovementTimes(blockSize);
    const formattedLastBlockTimes = formatTouchTimes(lastBlockTimes);
    const formattedLastBlockMovements = formatTouchTimes(lastBlockMovements);

    // Calculate variability for execution time and movement time
    const movementTimeVariability = calculateCoefficientOfVariation(lastBlockMovements);
    const executionTimeVariability = calculateCoefficientOfVariation(lastBlockTimes);

    // Calculate variability for execution time without pauses
    const executionTimeWithoutPauses = Math.max(0, touchTime - totalPauseTime); // Ensure it doesn't go below 0
    const executionTimeWithoutPausesVariability = calculateCoefficientOfVariationWithoutPauses(touchTimes.slice(-blockSize));

    // Calculate peak acceleration variability
    const peakAccelerationVariability = calculateCoefficientOfVariation(accelerations.slice(-blockSize));

    // Add deviation and time variability results to the existing results string
    deviationResults += `
    <hr>
    <strong>Average Deviation from Path:</strong> ${calculateAverageDeviation(deviations).toFixed(2)} px<br>
    <strong>Maximum Deviation from Path:</strong> ${Math.max(...deviations).toFixed(2)} px<br>
    <strong>Movement Time:</strong> ${movementTime.toFixed(2)} ms<br>
    <strong>Movement Time Variability:</strong> ${movementTimeVariability.toFixed(2)}%<br>
    <strong>Execution Time without Pauses:</strong> ${executionTimeWithoutPauses.toFixed(2)} ms<br>
    <strong>Execution Time Variability (without Pauses):</strong> ${executionTimeWithoutPausesVariability.toFixed(2)}%<br>
    <strong>Last Block Times (Execution Time):</strong> ${formattedLastBlockTimes}<br>
    <strong>Last Block Movements:</strong> ${formattedLastBlockMovements}<br>
    <strong>Peak Acceleration Variability:</strong> ${peakAccelerationVariability.toFixed(2)}%<br>`;

    // Display the results in a modal
    modalContent.innerHTML += deviationResults;
    modal.style.display = 'block';
});

// Store execution and movement times in local storage
function storeTouchAndMovementTimes(touchTime, movementTime, accelerations) {
    let storedTouchTimes = JSON.parse(localStorage.getItem('touchTimes')) || []; // Retrieve touch times from local storage
    let storedMovementTimes = JSON.parse(localStorage.getItem('movementTimes')) || []; // Retrieve movement times
    let storedAccelerations = JSON.parse(localStorage.getItem('peakAccelerations')) || []; // Retrieve peak accelerations

    // Store the new values
    storedTouchTimes.push(touchTime);
    storedMovementTimes.push(movementTime);
    if (storedTouchTimes.length > blockSize) storedTouchTimes.shift();
    if (storedMovementTimes.length > blockSize) storedMovementTimes.shift();

    const peakAcceleration = Math.max(...accelerations); // Calculate peak acceleration
    if (!isNaN(peakAcceleration) && isFinite(peakAcceleration)) {
        storedAccelerations.push(peakAcceleration);
        if (storedAccelerations.length > blockSize) storedAccelerations.shift();
    }

    localStorage.setItem('touchTimes', JSON.stringify(storedTouchTimes));
    localStorage.setItem('movementTimes', JSON.stringify(storedMovementTimes));
    localStorage.setItem('peakAccelerations', JSON.stringify(storedAccelerations));
}

// Function to retrieve the last block of touch times from local storage
function getLastBlockTouchTimes(blockSize) {
    let storedTouchTimes = JSON.parse(localStorage.getItem('touchTimes')) || [];
    return storedTouchTimes.slice(-blockSize);
}

// Function to retrieve the last block of movement times from local storage
function getLastBlockMovementTimes(blockSize) {
    let storedMovementTimes = JSON.parse(localStorage.getItem('movementTimes')) || [];
    return storedMovementTimes.slice(-blockSize);
}

// Function to format touch times as a string
function formatTouchTimes(touchTimes) {
    return touchTimes.map(time => `${time}ms`).join(', '); // Format each touch time as 'timems' and join them with a comma and space
}

// Function to calculate coefficient of variation without pauses
function calculateCoefficientOfVariationWithoutPauses(touchTimes) {
    const timeWithoutPauses = touchTimes.map(time => Math.max(0, time - totalPauseTime)); // Subtract pauses from each touch time
    return calculateCoefficientOfVariation(timeWithoutPauses);
}

// Function to calculate the deviation from the intended path
function calculateDeviation(x1, y1, x2, y2, x, y) {
    return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

// Function to calculate the average deviation from the path
function calculateAverageDeviation(deviations) {
    const sum = deviations.reduce((acc, val) => acc + val, 0); // Sum of all deviations
    return sum / deviations.length;
}

// Function to calculate the coefficient of variation for an array
function calculateCoefficientOfVariation(array) {
    const mean = calculateMean(array);
    const stdDev = calculateStandardDeviation(array, mean);
    return (stdDev / mean) * 100;
}

// Function to calculate the mean of an array
function calculateMean(array) {
    const sum = array.reduce((acc, val) => acc + val, 0);
    return sum / array.length;
}

// Function to calculate the standard deviation of an array
function calculateStandardDeviation(array, mean) {
    const variance = array.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / array.length;
    return Math.sqrt(variance);
}

// Function to calculate distance between two points
function calculateDistance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
