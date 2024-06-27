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
            // console.log(pauseDuration);

        }
    }

    pauseIdentifier = Date.now();

    const pointer = document.getElementById(touch.identifier)
    pointer.style.top = `${touch.pageY}px`
    pointer.style.left = `${touch.pageX}px`
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
    Longest Pause Duration: ${pauseDuration} ms`;

    modalContent.innerText = results;
    modal.style.display = 'block'
    reachedTarget = false;
    modalContent = null;
});

function closeModal() {
    modal.style.display = 'none';
    modalContent = document.getElementById('modalBodyContent');
}