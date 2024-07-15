let results = null;
let modal = document.getElementById('resultsModal');
let modalContent = document.getElementById('modalBodyContent');
let startTime = 0;
let numberPauses = 0;
let pauseIdentifier = 0;
let pauseCounter = 0;
let pauseDuration = 0;
let specificPauseDuration = 0;
let currentTime = 0;
let reachedTarget = false;
let hitTarget = false;
let exitedTarget = false;
let targetReentry = 0;
let targetPositionX = getOffset(document.getElementById('targetInnerDot')).left;
let targetPositionY = getOffset(document.getElementById('targetInnerDot')).top;
let touchSlipBase = 50;
let touchSlipDistance = 0;
let touchSlipBaseX = 0;
let touchSlipBaseY = 0;
let enterTargetTime = 0;
let verificationTime = 0;
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let startPosition = document.getElementById(startPoint);
let targetPosition = document.getElementById(targetPoint);
let parallelDirectionChange = 0
let initialSlope = 0;
let initialSlopeReciprocal = 0;
let previousX = 0;
let previousY = 0;
let movementCounter = 0;
console.log(windowWidth, windowHeight);

document.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;
    previousX = touch.pageX;
    previousY = touch.pageY;

    //For movement and orthogonal direction changes
    initialSlope = ((targetPositionY - touch.pageY) / (targetPositionX - touch.pageX));
    initialSlopeReciprocal = 1 / ((targetPositionY - touch.pageY) / (targetPositionX - touch.pageX));
    movementCounter = 0;
    console.log(initialSlope, initialSlopeReciprocal);

    startTime = Date.now();
    pauseIdentifier = Date.now();

    const pointer = document.createElement("div")
    pointer.classList.add("dot")
    pointer.style.top = `${touchStartY}px`
    pointer.style.left = `${touchStartX}px`
    pointer.id = touch.identifier

    pauseCounter = 0;
    pauseDuration = 0;

    document.body.append(pointer);
});

document.addEventListener("touchmove", e => {
    const touch = e.changedTouches[0];
    let currentX = touch.pageX; //Store current x location as finger is moving
    let currentY = touch.pageY; //Store current y location as finger is moving
    const pointer = document.getElementById(touch.identifier);
    pointer.style.top = `${touch.pageY}px`;
    pointer.style.left = `${touch.pageX}px`;
    currentTime = Date.now();

    //Number of pauses while the person is still touching the screen
    //100 ms or longer
    if (pauseIdentifier != startTime) {
        if (pauseIdentifier <= currentTime - 100) {
            pauseCounter++;
            specificPauseDuration = currentTime - pauseIdentifier;
            console.log(specificPauseDuration);
            //If this specific pause is longer than the previous longest pause, the longest pause is updated
            if (specificPauseDuration > pauseDuration) {
                pauseDuration = specificPauseDuration;
            }
        }
    }

    //console.log(calculateDistance(currentX, targetPositionX, currentY, targetPositionY));
    //If the target has been entered, records a "touchslip" depending on the farthest distance the tap has reached from the closest the tap ever got to hte center of the target
    if (calculateDistance(currentX, targetPositionX, currentY, targetPositionY) < 18) {
        hitTarget = true;
        reachedTarget = true;

        //Records the time the target was initially entered
        const enterTargetTemp = Date.now();
        if (enterTargetTime == 0) {
            enterTargetTime = enterTargetTemp;
        }
        let tempTouchSlip = (((targetPositionX - currentX) ** 2 + (targetPositionY - currentY) ** 2) ** (1 / 2));
        if (tempTouchSlip < touchSlipBase) {
            touchSlipBase = tempTouchSlip;
            touchSlipBaseX = currentX;
            touchSlipBaseY = currentY;
        }
        //If the current distance from the tap is farther than the farthest recorded distance of touch slip, the farthest touch slip distance is updated
        if (touchSlipDistance < (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2))) {
            touchSlipDistance = (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2));
        }
        //Adds one count to the number of target reentries if the tap has exited and then entered the target
        if (exitedTarget == true) {
            exitedTarget = false;
            targetReentry++;
        }
    }
    //If the tap is not inside the target, reachedTarget is set to false
    else {
        reachedTarget = false;
    }
    //If the tap has entered the target and then exited the target, records the distance the touch has slipped from the closest the tap got to the center of the target; records that the target has been exited
    if (hitTarget == true && reachedTarget == false) {
        //Updates the touch slip distance if the current tap is farther from the initial touch slip point than what has been previously recorded
        if (touchSlipDistance < (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2))) {
            touchSlipDistance = (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2));
        }
        exitedTarget = true;
    }

    //Identifies if there has been a parallel direction change(only once every three touchmoves; need to add in two counters to be fully covered)
    //OR look at page 7 of the PDF from Vineet saved in bookmarks - need to figure out how to do submovements
    if (movementCounter >= 50) {
        if (((currentY - previousY) / (currentX - previousX)) < initialSlope) {
            console.log(((currentY - previousY) / (currentX - previousX)), initialSlope);
            parallelDirectionChange++;
        } else {
            console.log("Positive");
        }
        previousX = currentX;
        previousY = currentY;
        movementCounter = 0;
    } //console.log(previousX, previousY);
    //console.log(currentX, currentY);
    pauseIdentifier = Date.now();
    movementCounter++;
});

document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    const pointer = document.getElementById(touch.identifier);
    pointer.remove();

    endTime = Date.now();
    totalTime = (endTime - startTime);//Total time the touch has lasted
    console.log(totalTime);

    //Records the time since the target was first reached to the time the tap ends
    if (enterTargetTime != 0) {
        verificationTime = (Date.now() - enterTargetTime);
    } else {
        verificationTime = 0;
    } /*if (reachedTarget == false) {
        verificationTime = 0;
    }*/

    //When tapping, sets the number of pauses to 0
    if (pauseCounter < 0) {
        pauseCounter = 0;
    }

    results = `Target reached at end of tap: ${reachedTarget}
    Target reached at some point: ${hitTarget}
    Total Time: ${totalTime} ms
    Total Pauses: ${pauseCounter} pauses
    Longest Pause Duration: ${pauseDuration} ms
    Max Touchslip: ${Math.round(touchSlipDistance * 100) / 100} pixels
    Target Re-entries: ${targetReentry}
    Time to liftoff from contact with target: ${verificationTime} ms`;

    modalContent.innerText = results;
    modal.style.display = 'block'
    reachedTarget = false;
    hitTarget = false;
    modalContent = 0;
    touchSlipBase = 50;
    touchSlipDistance = 0;
    targetReentry = 0;
    enterTargetTime = 0;
});

//function to close the results modal
function closeModal() {
    modal.style.display = 'none';
    modalContent = document.getElementById('modalBodyContent');
}
//function to find how far a certain element is from the top or the left of the screen 
function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
//function to calculate the distance between two points
function calculateDistance(x1, x2, y1, y2) {
    const disX = x2 - x1;
    const disY = y2 - y1;
    return Math.sqrt(
        Math.pow(disX, 2) + Math.pow(disY, 2)
    );
}