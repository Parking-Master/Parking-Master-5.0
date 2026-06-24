GamepadControls = {
  isConnected: false,
  speed: 0.6,
  buttonDownEvent: function(key, value) {
    if (buttonActions[key]) buttonActions[key](value, true);
  },
  buttonUpEvent: function(key, value) {
    if (buttonActions[key]) buttonActions[key](value, false);
  },
  update: function() {
    const gamepads = navigator.getGamepads();
    if (gamepads.length > prevGamepads.length) gamepad = gamepads[gamepads.length - 1];
    prevGamepads = gamepads;
    if (gamepad) {
      handleLookMovement();
      handleDirectionalMovement();
      handleButtonEvents();
    }
  }
};

let keyCodeMaps = {
  "forward": "KeyW",
  "backward": "KeyS",
  "left": "KeyA",
  "right": "KeyD"
};

let moveRepeats = {};

function getAllIndexes(arr, val) {
  let indexes = [];
  let i = -1;

  while ((i = arr.indexOf(val, i+1)) != -1) {
    indexes.push(i);
  }

  return indexes;
}

function stopAllExcept(direction, secondDirection = null) {
  let formattedDirection = `${direction}${secondDirection ? "_" + secondDirection : ""}`;
  for (i in moveRepeats) {
    if (i !== formattedDirection) moveRepeats[i] = false;
  }
  for (key in keyCodeMaps) {
    let value = keyCodeMaps[key];
    if (key !== direction && key !== secondDirection) keyStop(value);
  }
}
function keyPress(code) {
  document.dispatchEvent(new Event("keydown", { code: code }));
}
function keyStop(code) {
  document.dispatchEvent(new Event("keyup", { code: code }));
}

let lookSensitivity = 0.6;
let lookAcceleration = 0.005;
let gamepad;
let initialLookSpeed = 0.02;
let lookSpeed = initialLookSpeed;
let diagonalThreshold = 0.5;
let previousButtonStates = {};

window.addEventListener("gamepadconnected", function(event) {
  gamepad = event.gamepad;
  console.log("Gamepad connected:", gamepad.id);
  GamepadControls.isConnected = true;
  initButtonStates();
  utils.data.isUsingKeyboard = false;
  document.querySelector(".howtoplay").src = "images/howtoplay-gamepad.png";
//   if (typeof swal !== "undefined") {
//     let oldSwal = swal;
//     swal = function() {
//       let output = oldSwal.apply(null, arguments);
//       if (document.querySelector(".swal-button")) {
//         document.querySelector(".swal-button").textContent += " [B]";

//         if (document.querySelector(".swal-button--confirm")) {
//           if (!document.querySelector(".swal-button--confirm").textContent.includes("[B]")) document.querySelector(".swal-button--confirm").textContent += " [X]";
//         }
//       }
//       return output;
//     };
//     swal.close = oldSwal.close;
//     swal.getState = oldSwal.getState;
//   }
});

window.addEventListener("gamepaddisconnected", function() {
  console.log("Gamepad disconnected");
  GamepadControls.isConnected = false;
  gamepad = null;
  previousButtonStates = {};
});

function initButtonStates() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    previousButtonStates[i] = gamepad.buttons[i].pressed;
  }
}

let prevGamepads = navigator.getGamepads();

function handleLookMovement() {
  if (vehicle && vehicle.currentView == 0) {
    const lookX = gamepad.axes[2];
    const lookY = gamepad.axes[3];
    temporaryLookSensitivity = Math.abs(lookX) * (lookSensitivity * GamepadControls.speed);
    if (Math.abs(lookX) > 0.2) camera.rotation.y -= lookX * lookSpeed;
    if (Math.abs(lookY) > 0.2) camera.rotation.x -= lookY * lookSpeed;
    if (Math.abs(lookX) < 0.1 && Math.abs(lookY) < 0.1) {
      lookSpeed = initialLookSpeed;
      looking = false;
    } else {
      if (lookSpeed < temporaryLookSensitivity / 10) lookSpeed += lookAcceleration;
      looking = true;
    }
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  }
}

let stopped = false;
let looking = false;
let menuButton = 0;
let maxButtons = 4;
let repeatedButton = false;
function handleDirectionalMovement() {
  const moveX = gamepad.axes[0];
  const moveY = gamepad.axes[1];
  if (vehicle.currentControl == "Shifter" && Math.abs(moveY) > 0.1) {
    if (!shifted) {
      shifted = true;
      if (moveY < 0) {
        utils.game.controls.shift(null, "forward");
      } else {
        utils.game.controls.shift(null, "backward");
      }
    }
  } else {
    shifted = false;
    if (Math.abs(moveX) > 0.1) {
      utils.data.steerPowerCoefficient = Math.abs(moveX);
      if (moveX < 0) {
        keyStates["ArrowRight"] = false;
        keyStates["ArrowLeft"] = true;
      } else {
        keyStates["ArrowRight"] = true;
        keyStates["ArrowLeft"] = false;
      }
    } else {
      keyStates["ArrowRight"] = false;
      keyStates["ArrowLeft"] = false;
    }
  }
}

function handleButtonEvents() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    const buttonPressed = gamepad.buttons[i].value > 0.01;
    if (buttonPressed) {
      onButtonPressed(i, gamepad.buttons[i].value);
    } else if (!buttonPressed && previousButtonStates[i]) {
      onButtonReleased(i);
    }
    previousButtonStates[i] = buttonPressed;
  }
}

function onButtonPressed(buttonIndex, value) {
  switch(buttonIndex) {
    case 0: GamepadControls.buttonDownEvent("a"); break;
    case 1: GamepadControls.buttonDownEvent("b"); break;
    case 2: GamepadControls.buttonDownEvent("x"); break;
    case 3: GamepadControls.buttonDownEvent("y"); break;
    case 4: GamepadControls.buttonDownEvent("lb"); break;
    case 5: GamepadControls.buttonDownEvent("rb"); break;
    case 6: GamepadControls.buttonDownEvent("lt", value); break;
    case 7: GamepadControls.buttonDownEvent("rt", value); break;
    case 8: GamepadControls.buttonDownEvent("back"); break;
    case 9: GamepadControls.buttonDownEvent("start"); break;
    case 10: GamepadControls.buttonDownEvent("l"); break;
    case 11: GamepadControls.buttonDownEvent("r"); break;
    case 12: GamepadControls.buttonDownEvent("up"); break;
    case 13: GamepadControls.buttonDownEvent("down"); break;
    case 14: GamepadControls.buttonDownEvent("left"); break;
    case 15: GamepadControls.buttonDownEvent("right"); break;
  }
}

function onButtonReleased(buttonIndex) {
  switch(buttonIndex) {
    case 0: GamepadControls.buttonUpEvent("a"); break;
    case 1: GamepadControls.buttonUpEvent("b"); break;
    case 2: GamepadControls.buttonUpEvent("x"); break;
    case 3: GamepadControls.buttonUpEvent("y"); break;
    case 4: GamepadControls.buttonUpEvent("lb"); break;
    case 5: GamepadControls.buttonUpEvent("rb"); break;
    case 6: GamepadControls.buttonUpEvent("lt"); break;
    case 7: GamepadControls.buttonUpEvent("rt"); break;
    case 8: GamepadControls.buttonUpEvent("back"); break;
    case 9: GamepadControls.buttonUpEvent("start"); break;
    case 10: GamepadControls.buttonUpEvent("l"); break;
    case 11: GamepadControls.buttonUpEvent("r"); break;
    case 12: GamepadControls.buttonUpEvent("up"); break;
    case 13: GamepadControls.buttonUpEvent("down"); break;
    case 14: GamepadControls.buttonUpEvent("left"); break;
    case 15: GamepadControls.buttonUpEvent("right"); break;
  }
}

buttonRepeats = {
  a: false,
  b: false,
  x: false,
  y: false,
  lb: false,
  rb: false,
  lt: false,
  rt: false,
  back: false,
  start: false,
  l: false,
  r: false,
  up: false,
  down: false,
  left: false,
  right: false
};

buttonActions = {
  "rt": function(value, isPressed) {
    if (isPressed) {
      const fullGasDelay = 500;
      engine = value * Math.min((Date.now() - utils.data.timeOfGas) / fullGasDelay, 1);
      utils.game.controls.throttle();
    } else {
      utils.game.controls.stopThrottle();
    }
  },
  "lt": function(value, isPressed) {
    if (isPressed) {
      const fullBrakeDelay = 500;
      brake = value * Math.min((Date.now() - utils.data.timeOfBrake) / fullBrakeDelay, 1) * 500;
      utils.game.controls.brake();
    } else {
      utils.game.controls.stopBrake();
    }
  },
  "up": function(value, isPressed) {
    if (isPressed) {
      if (!buttonRepeats.up) {
        buttonRepeats.up = true;
        utils.game.controls.shift(null, "forward");
      }
    } else {
      buttonRepeats.up = false;
    }
  },
  "down": function(value, isPressed) {
    if (isPressed) {
      if (!buttonRepeats.down) {
        buttonRepeats.down = true;
        utils.game.controls.shift(null, "backward");
      }
    } else {
      buttonRepeats.down = false;
    }
  },
  "left": function(value, isPressed) {
    if (isPressed) {
      if (!buttonRepeats.left) {
        buttonRepeats.left = true;
        utils.game.controls.leftBlinker();
      }
    } else {
      buttonRepeats.left = false;
    }
  },
  "right": function(value, isPressed) {
    if (isPressed) {
      if (!buttonRepeats.right) {
        buttonRepeats.right = true;
        utils.game.controls.rightBlinker();
      }
    } else {
      buttonRepeats.right = false;
    }
  },
  "rb": function(value, isPressed) {
    if (isPressed) {
      if (!buttonRepeats.rb) {
        buttonRepeats.rb = true;
        utils.game.controls.switchView();
      }
    } else {
      buttonRepeats.rb = false;
    }
  },
  "a": function(value, isPressed) {
    if (isPressed) {
      if (!buttonRepeats.a) {
        buttonRepeats.a = true;
        utils.game.controls.simplePark();
      }
    } else {
      buttonRepeats.a = false;
    }
  }
};