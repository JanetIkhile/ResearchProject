/*let startTime = 0;
let touchStartX, touchStartY;
let touchEndX, touchEndY;
let firstTapTime = 0;

document.addEventListener("touchstart", e => {
    [...e.changedTouches].forEach(touch => {
        startTime = Date.now();
        const pointer = document.createElement("div")
        pointer.classList.add("dot")
        pointer.style.top = `${touch.pageY}px`
        pointer.style.left = `${touch.pageX}px`
        pointer.id = touch.identifier

        const doubleTapSpeedDisplay = document.createElement('div');
        doubleTapSpeedDisplay.className = 'display';
        if (startTime - firstTapTime < 300) {
            const doubleTapSpeed = startTime - firstTapTime;
            doubleTapSpeedDisplay.textContent = `Double-tap speed: ${doubleTapSpeed} ms`;
            console.log(`Double-tap speed: ${doubleTapSpeed} ms`);
        } else {
            firstTapTime = startTime;
        }
        document.body.append(pointer)
        document.body.appendChild(doubleTapSpeedDisplay);
        setTimeout(() => {
            doubleTapSpeedDisplay.remove();
        }, 2000);
        touchStartX = touch.pageX;
        touchStartY = touch.pageY;

    })
})

document.addEventListener("touchmove", e => {
    [...e.changedTouches].forEach(touch => {
        const pointer = document.getElementById(touch.identifier)
        pointer.style.top = `${touch.pageY}px`
        pointer.style.left = `${touch.pageX}px`
    })
})

document.addEventListener("touchend", e => {
    [...e.changedTouches].forEach(touch => {

        touchEndX = touch.pageX;
        touchEndY = touch.pageY;
        const distance = Math.sqrt(
            Math.pow(touchEndX - touchStartX, 2) + Math.pow(touchEndY - touchStartY, 2)
        );
        console.log(distance.toFixed(2) + ' pixels')
        const distanceDisplay = document.createElement('div')
        distanceDisplay.className = 'display'
        distanceDisplay.textContent = 'Drag distance: ' + distance.toFixed(2) + ' pixels';
        document.body.appendChild(distanceDisplay);


        if (startTime !== 0) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const tapDurationDisplay = document.createElement('div');
            tapDurationDisplay.className = 'display';
            tapDurationDisplay.textContent = `Tap duration: ${duration} ms`;
            document.body.appendChild(tapDurationDisplay);


            const speed = (distance / duration) * 1000;
            const speedDisplay = document.createElement('div')
            speedDisplay.className = 'display'
            speedDisplay.textContent = `Drag speed: ${speed.toFixed(2)} pixels/second`;
            document.body.appendChild(speedDisplay);

            setTimeout(() => {
                distanceDisplay.remove();
                tapDurationDisplay.remove();
                speedDisplay.remove();
            }, 2000);

            console.log(`Tap duration: ${duration} ms`);
            console.log(`Drag speed: ${speed.toFixed(2)} pixels/second`)
            startTime = 0;
        }


        const pointer = document.getElementById(touch.identifier)
        pointer.remove()
    });

})


document.addEventListener("touchcancel", e => {
    [...e.changedTouches].forEach(touch => {
        const pointer = document.getElementById(touch.identifier)
        pointer.remove()
    })
})
    */