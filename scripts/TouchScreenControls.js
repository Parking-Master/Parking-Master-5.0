TouchScreenControls = function(camera, element) {
  this.isLocked = true;
  this.speed = 1;
  let previousTouch = null;
  element.addEventListener("touchmove", (event) => {
    if (!this.isLocked) return;
    const touch = event.touches[0];
    if (previousTouch) {
      camera.rotation.y -= (touch.pageX - previousTouch.pageX) / (500 / this.speed);
      camera.rotation.x -= (touch.pageY - previousTouch.pageY) / (500 / this.speed);
    }
    previousTouch = touch;
  });
  element.addEventListener("touchstart", (event) => {
    event.preventDefault();
  });
  element.addEventListener("touchend", (event) => {
    event.preventDefault();
    previousTouch = null;
  });
  element.addEventListener("touchcancel", (event) => {
    event.preventDefault();
  });
};