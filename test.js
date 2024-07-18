'use strict';

let startTime = 0;
let totalTime = 0;
let touchStartX, touchStartY;
let touchEndX, touchEndY;
let finalSpeed = 0;
let lastSpeed = 0;
let peakSpeed = 0
let timeToPeakSpeed = 0;
let previousSpeed = 0;
let previousTime = 0;
let isDragging = false;
let lastAcceleration = 0;
let averageAcceleration = 0;
let initialX = 0;
let initialY = 0;
let previousChangeInSpeed = 0;
let modalContent = document.getElementById('modalBodyContent');
let results = null;
let reachedTarget = false;
let totalDistanceTraveled = 0;

const startPoint = document.getElementById('startInnerDot');
const targetPoint = document.getElementById('targetInnerDot');
//const targetInnerDot = document.getElementById('targetInnerDot');

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

console.log(`Viewport width: ${screenWidth}px`);
console.log(`Viewport height: ${screenHeight}px`);

// get api url from envrionment variable
const apiUrl = 'https://motor-performance.vercel.app' || 'http://localhost:3001';

// At the touch start
document.addEventListener("touchstart", e => {
    //Getting the current date at the start of the touch event
    //if (e.target === startPoint) {

    //Get the first touch event
    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;

    startTime = Date.now();

    // Create pointer to display a visual representation of where the finger is at any point
    const pointer = document.createElement("div")
    pointer.classList.add("dot")
    pointer.style.top = `${touchStartY}px`
    pointer.style.left = `${touchStartX}px`
    pointer.id = touch.identifier

    document.body.append(pointer);
    previousTime = startTime; //Set previous time to start time
    initialX = touchStartX; //Store touch start x in another variable
    initialY = touchStartY; //Store touch start y in another variable
    totalDistanceTraveled = 0; //Distance is currently zero
    //}
});


//Finger is moving on the screen
document.addEventListener("touchmove", e => {
    e.preventDefault();

    isDragging = true; //Turn on flag when finger moves on the screen

    const touch = e.changedTouches[0];
    let currentX = touch.pageX; //Store current x location as finger is moving
    let currentY = touch.pageY; //Store current y location as finger is moving
    let currentTime = Date.now();

    // Visual representation of where the finger is at any point
    const pointer = document.getElementById(touch.identifier)
    pointer.style.top = `${touch.pageY}px`
    pointer.style.left = `${touch.pageX}px`


    //Calculate distance from the last point
    let changeInDistance = calculateDistance(initialX, currentX, initialY, currentY);

    //This reflects the actual path taken by the user's finger across the touch surface. It is different from the straight line distance
    totalDistanceTraveled += changeInDistance;

    let changeInTime = currentTime - previousTime; //Change in time

    let changeInSpeed = changeInDistance / changeInTime; //Change in speed with respect to time

    // This is a measure of how quickly or slowly the touch speeds up or slows down at a specific moment in time.
    let instantaneousAcceleration = (changeInSpeed - previousChangeInSpeed) / changeInTime;

    lastAcceleration = instantaneousAcceleration; // Last recorded acceleration of a touch movement on the screen.

    let totalTimeTakenForTouchMove = currentTime - startTime; // This reflects the time from start of the touch event to the currrent time

    finalSpeed = totalDistanceTraveled / totalTimeTakenForTouchMove; // This represents the final speed during the touch movement

    lastSpeed = finalSpeed; // This represents the last recorded final speed in the touch movement

    // Getting the peak speed here
    if (finalSpeed > peakSpeed) {
        peakSpeed = finalSpeed;
        timeToPeakSpeed = currentTime - startTime;
    }

    /*Check This Block to know if it can also work for average acceleration and what it means */
    //Average acceleration (final velocity - initial velocity)/ (final time -initial time)
    //let acceleration = (finalSpeed - previousSpeed) / (totalTimeTakenForTouchMove);
    //averageAcceleration = acceleration;
    //console.log(` acceleration: ${acceleration.toFixed(9)}`);

    previousSpeed = finalSpeed; //Update speed for the next move
    previousTime = currentTime; //update time for the next move
    initialX = currentX; //update start position for the next move
    initialY = currentY; //update start position for the next move
    previousChangeInSpeed = changeInSpeed; //update  speed for the next move

});


//Finger leaves the screen
document.addEventListener("touchend", e => {

    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    const pointer = document.getElementById(touch.identifier);
    pointer.remove();

    //Calculating the straight line distance covered from start to target point
    const straightLineDistance = calculateDistance(touchStartX, touchEndX, touchStartY, touchEndY);

    // Calculating total duration
    if (startTime !== 0) {
        totalTime = calculateTotalTime(startTime);
    }

    //Calculating the average drag speed (TotalDistance/ Total Time)
    const averageDragSpeed = calculateDragSpeed(totalDistanceTraveled, totalTime);

    //Average acceleration (final velocity - initial velocity)/ (final time -initial time) 
    //This is a measure of how quickly or slowly the touch speeds up or slows down across the entire period of the task
    let averageAcceleration = (finalSpeed - 0) / (totalTime);

    let tapDuration = isDragging ? null : totalTime; //Show tapDuration if a tap occurred

    //This captures the rectangular area defined by the start and end points of a touch gesture on the screen. 
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
    Shortest Path Distance: ${shortestPathDistance.toFixed(2)} px `;

    const measureResults = { tapDuration, straightLineDistance, totalDistanceTraveled, totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed, lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance };

    sendDataToServer(measureResults);

    fetchDataFromServer();

    modalContent.innerText = results;
    modal.style.display = 'block'
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
function getShortestPathDistance() {
    let startRect = startPoint.getBoundingClientRect();
    let targetRect = targetPoint.getBoundingClientRect();

    let startX = startRect.left + startRect.width / 2;
    let startY = startRect.top + startRect.height / 2;

    let targetX = targetRect.left + targetRect.width / 2;
    let targetY = targetRect.top + targetRect.height / 2;

    let dx = targetX - startX;
    let dy = targetY - startY;

    return Math.sqrt(dx * dx + dy * dy);
}


//send data to server
// Example function to send data to the server
async function sendDataToServer(measures) {
    try {
        const response = await fetch(`http://127.0.0.1:3001/api/measures/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(measures)
        });

        if (response.ok) {
            console.log(response.status)

        } else {
            console.error('Error sending data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchDataFromServer() {
    try {
        const response = await fetch(`http://localhost:3001/api/measures`);
        const data = await response.json();
        console.log('Data retrieved:', data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}