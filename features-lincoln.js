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
let targetPositionX = getOffset(document.getElementById('targetInnerDot')).left;
let targetPositionY = getOffset(document.getElementById('targetInnerDot')).top;
let touchSlipBase = 50;
let touchSlipDistance = 0;
let touchSlipBaseX = 0;
let touchSlipBaseY = 0;

document.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;

    startTime = Date.now();
    pauseIdentifier = Date.now();

    const pointer = document.createElement("div")
    pointer.classList.add("dot")
    pointer.style.top = `${touchStartY}px`
    pointer.style.left = `${touchStartX}px`
    pointer.id = touch.identifier

    pauseCounter = -1;
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
    if (pauseIdentifier <= currentTime - 100) {
        pauseCounter = pauseCounter + 1;
        specificPauseDuration = currentTime - pauseIdentifier;
        console.log(specificPauseDuration);
        //If this specific pause is longer than the previous longest pause, the longest pause is updated
        if (specificPauseDuration > pauseDuration) {
            pauseDuration = specificPauseDuration;
        }
    }

    if ((currentX < targetPositionX + 12.5 && currentX > targetPositionX - 12.5) && (currentY < targetPositionY + 12.5 && currentY > targetPositionY - 12.5)) {
        hitTarget = true;
        reachedTarget = true;
        let tempTouchSlip = (((targetPositionX - currentX) ** 2 + (targetPositionY - currentY) ** 2) ** (1 / 2));
        if (tempTouchSlip < touchSlipBase) {
            touchSlipBase = tempTouchSlip;
            touchSlipBaseX = currentX;
            touchSlipBaseY = currentY;
        }
        if (touchSlipDistance < (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2))) {
            touchSlipDistance = (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2));
            console.log(touchSlipDistance);
        }
        console.log(touch.clientX, touch.clientY);
        console.log(tempTouchSlip);
        console.log(1);
    } else {
        reachedTarget = false;
        console.log(2);
    }
    if (hitTarget == true && reachedTarget == false) {
        if (touchSlipDistance < (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2))) {
            touchSlipDistance = (((touchSlipBaseX - currentX) ** 2 + (touchSlipBaseY - currentY) ** 2) ** (1 / 2));
            console.log(touchSlipDistance);
        }
        console.log(3);
        console.log(touch.clientX, touch.clientY);
        console.log(touchSlipBaseX, touchSlipBaseY);
    }
    pauseIdentifier = Date.now();
});

document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    const pointer = document.getElementById(touch.identifier);
    pointer.remove();

    endTime = Date.now();
    totalTime = (endTime - startTime);
    console.log(totalTime);

    if (pauseCounter < 0) {
        pauseCounter = 0;
    }
    if (pauseCounter <= 0) {
        pauseDuration = 0;
    }
    if (document.elementFromPoint(touch.clientX, touch.clientY) === targetInnerDot) {
        reachedTarget = true;
    }
    results = `Target reached: ${reachedTarget}
    Total Time: ${totalTime} ms
    Total Pauses: ${pauseCounter} pauses
    Longest Pause Duration: ${pauseDuration} ms
    Touchslip: ${Math.round(touchSlipDistance * 100) / 100} pixels`;

    modalContent.innerText = results;
    modal.style.display = 'block'
    reachedTarget = false;
    hitTarget = false;
    modalContent = 0;
    touchSlipBase = 50;
    touchSlipDistance = 0;
});

function closeModal() {
    modal.style.display = 'none';
    modalContent = document.getElementById('modalBodyContent');
}
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
