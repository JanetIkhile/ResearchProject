'use strict';

let deviations = []; // Array to store deviations from the intended path
let touchTimes = []; // Array to store touch times for calculating time variability
const blockSize = 5; // Number of trials to consider in the block, can be changed as needed

// At the touch start
document.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    deviations = []; // Reset deviations array at the start of each touch
});

// Finger is moving on the screen
document.addEventListener("touchmove", e => {
    e.preventDefault();

    const touch = e.changedTouches[0];
    let currentX = touch.pageX; // Store current x location as finger is moving
    let currentY = touch.pageY; // Store current y location as finger is moving

    // Calculate deviation from intended path
    const deviation = calculateDeviation(touchStartX, touchStartY, targetPoint.offsetLeft, targetPoint.offsetTop, currentX, currentY);
    deviations.push(deviation); // Store each deviation in the array
});

// Finger leaves the screen
document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const touchEndTime = Date.now();
    const touchTime = touchEndTime - startTime;
    touchTimes.push(touchTime); // Store touch time

    // Store the touch time in local storage
    storeTouchTime(touchTime);

    // Calculate average, maximum, and median deviations from the path
    const averageDeviation = calculateAverageDeviation(deviations); // Average deviation from path/task axis
    const maxDeviation = Math.max(...deviations); // Maximum deviation from task axis
    const medianDeviation = calculateMedianDeviation(deviations); // Median deviation from task axis

    // Calculate maximum time variability (max time) for the last block of trials
    const lastBlockTimes = getLastBlockTouchTimes(blockSize);
    const maxTimeVariability = Math.max(...lastBlockTimes);

    // Add deviation and time variability results to the existing results string
    results += `
    Average Deviation from Path: ${averageDeviation.toFixed(2)} px
    Maximum Deviation from Path: ${maxDeviation.toFixed(2)} px
    Median Deviation from Path: ${medianDeviation.toFixed(2)} px
    Maximum Time Variability: ${maxTimeVariability.toFixed(2)} ms`;

    modalContent.innerText = results;
    modal.style.display = 'block';
});

// Function to calculate the deviation from the intended path
function calculateDeviation(x1, y1, x2, y2, x, y) {
    return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

// Function to calculate the average deviation from the path
function calculateAverageDeviation(deviations) {
    const sum = deviations.reduce((acc, val) => acc + val, 0);
    return sum / deviations.length;
}

// Function to calculate the median deviation from the path
function calculateMedianDeviation(deviations) {
    const sorted = deviations.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Function to store touch times in local storage
function storeTouchTime(touchTime) {
    let touchTimes = JSON.parse(localStorage.getItem('touchTimes')) || [];
    touchTimes.push(touchTime);
    if (touchTimes.length > blockSize) {
        touchTimes.shift(); // Keep only the last 'blockSize' times
    }
    localStorage.setItem('touchTimes', JSON.stringify(touchTimes));
}

// Function to retrieve the last block of touch times from local storage
function getLastBlockTouchTimes(blockSize) {
    let touchTimes = JSON.parse(localStorage.getItem('touchTimes')) || [];
    return touchTimes.slice(-blockSize);
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
