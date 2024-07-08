'use strict';

let startTime = 0;
let totalTime = 0;
let touchStartX, touchStartY;
let touchEndX, touchEndY;
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
let modal = document.getElementById('resultsModal');
let modalContent = document.getElementById('modalBodyContent');
let results = null;
let reachedTarget = false;
let totalDistanceTraveled = 0;
let deviations = []; // Array to store deviations from the intended path

const startPoint = document.getElementById('startInnerDot');
const targetPoint = document.getElementById('targetInnerDot');
// const targetInnerDot = document.getElementById('targetInnerDot');

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

console.log(`Viewport width: ${screenWidth}px`);
console.log(`Viewport height: ${screenHeight}px`);

// At the touch start
document.addEventListener("touchstart", e => {
    // Getting the current date at the start of the touch event
    // if (e.target === startPoint) {

    // Get the first touch event
    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;

    startTime = Date.now();
    deviations = []; // Reset deviations array at the start of each touch

    // Create pointer to display a visual representation of where the finger is at any point
    const pointer = document.createElement("div")
    pointer.classList.add("dot")
    pointer.style.top = `${touchStartY}px`
    pointer.style.left = `${touchStartX}px`
    pointer.id = touch.identifier

    document.body.append(pointer);
    previousTime = startTime; // Set previous time to start time
    initialX = touchStartX; // Store touch start x in another variable
    initialY = touchStartY; // Store touch start y in another variable
    totalDistanceTraveled = 0; // Distance is currently zero
    // }
});

// Finger is moving on the screen
document.addEventListener("touchmove", e => {
    e.preventDefault();

    isDragging = true; // Turn on flag when finger moves on the screen

    const touch = e.changedTouches[0];
    let currentX = touch.pageX; // Store current x location as finger is moving
    let currentY = touch.pageY; // Store current y location as finger is moving
    let currentTime = Date.now();

    // Visual representation of where the finger is at any point
    const pointer = document.getElementById(touch.identifier)
    pointer.style.top = `${touch.pageY}px`
    pointer.style.left = `${touch.pageX}px`

    // Calculate distance from the last point
    let changeInDistance = calculateDistance(initialX, currentX, initialY, currentY);

    // This reflects the actual path taken by the user's finger across the touch surface. It is different from the straight line distance
    totalDistanceTraveled += changeInDistance;

    let changeInTime = currentTime - previousTime; // Change in time

    let changeInSpeed = changeInDistance / changeInTime; // Change in speed with respect to time

    // This is a measure of how quickly or slowly the touch speeds up or slows down at a specific moment in time.
    let instantaneousAcceleration = (changeInSpeed - previousChangeInSpeed) / changeInTime;

    lastAcceleration = instantaneousAcceleration; // Last recorded acceleration of a touch movement on the screen.

    let totalTimeTakenForTouchMove = currentTime - startTime; // This reflects the time from start of the touch event to the current time

    finalSpeed = totalDistanceTraveled / totalTimeTakenForTouchMove; // This represents the final speed during the touch movement

    lastSpeed = finalSpeed; // This represents the last recorded final speed in the touch movement

    // Getting the peak speed here
    if (finalSpeed > peakSpeed) {
        peakSpeed = finalSpeed;
        timeToPeakSpeed = currentTime - startTime;
    }

    /*Check This Block to know if it can also work for average acceleration and what it means */
    // Average acceleration (final velocity - initial velocity)/ (final time -initial time)
    // let acceleration = (finalSpeed - previousSpeed) / (totalTimeTakenForTouchMove);
    // averageAcceleration = acceleration;
    // console.log(` acceleration: ${acceleration.toFixed(9)}`);

    previousSpeed = finalSpeed; // Update speed for the next move
    previousTime = currentTime; // Update time for the next move
    initialX = currentX; // Update start position for the next move
    initialY = currentY; // Update start position for the next move
    previousChangeInSpeed = changeInSpeed; // Update speed for the next move

    // Calculate deviation from intended path
    const deviation = calculateDeviation(touchStartX, touchStartY, targetPoint.offsetLeft, targetPoint.offsetTop, currentX, currentY);
    deviations.push(deviation); // Store each deviation in the array
});

// Finger leaves the screen
document.addEventListener("touchend", e => {

    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    const pointer = document.getElementById(touch.identifier);
    pointer.remove();

    // Calculating the straight line distance covered from start to target point
    const straightLineDistance = calculateDistance(touchStartX, touchEndX, touchStartY, touchEndY);

    // Calculating total duration
    if (startTime !== 0) {
        totalTime = calculateTotalTime(startTime);
    }

    // Calculating the average drag speed (TotalDistance/ Total Time)
    const averageDragSpeed = calculateDragSpeed(totalDistanceTraveled, totalTime);

    // Average acceleration (final velocity - initial velocity)/ (final time -initial time) 
    // This is a measure of how quickly or slowly the touch speeds up or slows down across the entire period of the task
    let averageAcceleration = (finalSpeed - 0) / (totalTime);

    let tapDuration = isDragging ? null : totalTime; // Show tapDuration if a tap occurred

    // This captures the rectangular area defined by the start and end points of a touch gesture on the screen. 
    let tapAreaSize = Math.abs(touchStartX - touchEndX) * Math.abs(touchStartY - touchEndY);

    let startRect = startPoint.getBoundingClientRect();
    let targetRect = targetPoint.getBoundingClientRect();

    let startX = startRect.left + startRect.width / 2;
    let startY = startRect.top + startRect.height / 2;

    let targetX = targetRect.left + targetRect.width / 2;
    let targetY = targetRect.top + targetRect.height / 2;
    let shortestPathDistance = calculateDistance(startX, targetX, startY, targetY); // The shortest path to follow from start to target

    // || document.elementFromPoint(touch.clientX, touch.clientY) === targetInnerDot

    if (document.elementFromPoint(touch.clientX, touch.clientY) === targetInnerDot) {
        reachedTarget = true;
    }

    // Calculate average, maximum, and median deviations from the path
    const averageDeviation = calculateAverageDeviation(deviations); // Average deviation from path/task axis
    const maxDeviation = Math.max(...deviations); // Maximum deviation from task axis
    const medianDeviation = calculateMedianDeviation(deviations); // Median deviation from task axis

    results = `Target reached: ${reachedTarget}
    Tap duration: ${tapDuration !== null ? tapDuration : 'Not a tap'} ms
    Straight line drag distance: ${straightLineDistance.toFixed(2)} px
    Total Drag distance: ${totalDistanceTraveled.toFixed(2)} pixels
    Total duration: ${totalTime} ms
    Average drag speed: ${averageDragSpeed.toFixed(2)} px/ms
    Last speed: ${lastSpeed.toFixed(2)} px/ms
    Peak speed: ${peakSpeed.toFixed(2)} px/ms
    Time to peak speed: ${timeToPeakSpeed} ms
    Last acceleration: ${lastAcceleration.toFixed(8)} ms^2
    Average acceleration: ${averageAcceleration.toFixed(8)} ms^2
    Tap area: ${tapAreaSize.toFixed(2)} px^2
    Shortest Path Distance: ${shortestPathDistance.toFixed(2)} px
    Average Deviation from Path: ${averageDeviation.toFixed(2)} px
    Maximum Deviation from Path: ${maxDeviation.toFixed(2)} px
    Median Deviation from Path: ${medianDeviation.toFixed(2)} px`; // Include the average, maximum, and median deviations in the results

    modalContent.innerText = results;
    modal.style.display = 'block';
    isDragging = false;
    reachedTarget = false;
});

// Function to calculate drag distance covered
function calculateDistance(x1, x2, y1, y2) {
    const disX = x2 - x1;
    const disY = y2 - y1;
    return Math.sqrt(
        Math.pow(disX, 2) + Math.pow(disY, 2)
    );
}

// Function to calculate tap duration
function calculateTotalTime(startTime) {
    const endTime = Date.now();
    return (endTime - startTime);
}

// Function to calculate drag speed
function calculateDragSpeed(distance, duration) {
    return (distance / duration);
}

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

// Function to close the modal
function closeModal() {
    modal.style.display = 'none';
}
