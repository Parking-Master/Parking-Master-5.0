TouchScreenControls = function(camera, element) {
  this.isLocked = true;
  this.speed = 1;
  let previousTouch = null;
  element.addEventListener("touchmove", (event) => {
    if (!this.isLocked) return;
    const touch = Object.values(event.touches).filter(touch => touch.target == element)[0];
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
  let heading = 0;
  let isHoldingWheel = false;
  const wheel = document.querySelector(".mobile-ui .steering-wheel");
  this.update = function() {
    if (utils.data.isMobileGame) {
      if (isHoldingWheel) {
        utils.data.currentHeading += (heading - utils.data.currentHeading) * 0.15;
        utils.data.currentHeading += utils.physics.calculateHeadingReset(utils.data.currentHeading, vehicle.speed);
      }
      if (wheel) wheel.style.transform = `rotate(${-utils.data.currentHeading * (90 / 35)}deg)`;
    }
  };
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in document.documentElement)) utils.data.isMobileGame = true;
  if (utils.data.isMobileGame) {
    utils.data.defaultResolution = 100;
    document.body.style.background = "#000";
    document.querySelector(".mobile-ui .left-pedal").addEventListener("touchstart", function(event) {
      event.preventDefault();
      utils.game.controls.brake();
      this.style.transform = "scale(0.8)";
    });
    document.querySelector(".mobile-ui .left-pedal").addEventListener("touchend", function(event) {
      event.preventDefault();
      utils.game.controls.stopBrake();
      this.style.transform = "";
    });
    document.querySelector(".mobile-ui .left-pedal").addEventListener("touchcancel", function(event) {
      event.preventDefault();
      utils.game.controls.stopBrake();
      this.style.transform = "";
    });
    document.querySelector(".mobile-ui .right-pedal").addEventListener("touchstart", function(event) {
      event.preventDefault();
      utils.game.controls.throttle();
      this.style.transform = "scale(0.8)";
    });
    document.querySelector(".mobile-ui .right-pedal").addEventListener("touchend", function(event) {
      event.preventDefault();
      utils.game.controls.stopThrottle();
      this.style.transform = "";
    });
    document.querySelector(".mobile-ui .right-pedal").addEventListener("touchcancel", function(event) {
      event.preventDefault();
      utils.game.controls.stopThrottle();
      this.style.transform = "";
    });
    function getTouchAngle(touch, element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      return Math.atan2(dy, dx) * (180 / Math.PI) - 90;
    }
    let lastAngle = null;
    let currentRotation = 0;
    wheel.addEventListener("touchstart", function(event) {
      for (const touch of event.changedTouches) {
        if (wheel.contains(touch.target)) {
          event.preventDefault();
          isHoldingWheel = true;
          lastAngle = getTouchAngle(touch, this);
          currentRotation = utils.data.currentHeading * (90 / 35);
          heading = currentRotation * (35 / 90);
        }
      }
    });
    wheel.addEventListener("touchmove", function(event) {
      for (const touch of event.changedTouches) {
        if (wheel.contains(touch.target)) {
          event.preventDefault();
          const curAngle = getTouchAngle(touch, this);
          let deltaAngle = curAngle - lastAngle;
          if (deltaAngle > 180) deltaAngle -= 360;
          if (deltaAngle < -180) deltaAngle += 360;
          currentRotation += deltaAngle;
          if (currentRotation > 90) currentRotation = 90;
          if (currentRotation < -90) currentRotation = -90;
          heading = -currentRotation * (35 / 90);
          lastAngle = curAngle;
        }
      }
    });
    wheel.addEventListener("touchend", function(event) {
      utils.data.carHeadingIncrement = 0;
      isHoldingWheel = false;
    });
    document.querySelector(".mobile-ui").style.display = "block";
    document.querySelector(".howtoplay").style.display = "none";
  }
};