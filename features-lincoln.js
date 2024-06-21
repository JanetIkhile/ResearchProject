document.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    touchStartX = touch.pageX;
    touchStartY = touch.pageY;

    startTime = Date.now();

    const pointer = document.createElement("div")
    pointer.classList.add("dot")
    pointer.style.top = `${touchStartY}px`
    pointer.style.left = `${touchStartX}px`
    pointer.id = touch.identifier

    document.body.append(pointer);
    console.log(touch);

});

document.addEventListener("touchmove", e => {
    const touch = e.changedTouches[0];
    let currentX = touch.pageX; //Store current x location as finger is moving
    let currentY = touch.pageY; //Store current y location as finger is moving
    let currentTime = Date.now();

    const pointer = document.getElementById(touch.identifier)
    pointer.style.top = `${touch.pageY}px`
    pointer.style.left = `${touch.pageX}px`

    console.log(touch);
});

document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
    const pointer = document.getElementById(touch.identifier);
    pointer.remove();

    endTime = Date.now();
    end = (endTime - startTime)
    console.log(end);

});