const audioContext = new AudioContext();
function loadSound(src) {
  const gain = audioContext.createGain();
  gain.gain.value = 1;
  gain.connect(audioContext.destination);
  const wrapper = {
    buffer: null,
    source: null,
    loop: false,
    playbackRate: 1,
    startTime: 0,
    offset: 0,
    playing: false,
    play: function() {
      if (!wrapper.buffer || wrapper.playing) return;
      const source = audioContext.createBufferSource();
      source.buffer = wrapper.buffer;
      source.loop = wrapper.loop;
      source.playbackRate.value = wrapper.playbackRate;
      source.connect(gain);
      source.start(0, wrapper.offset);
      wrapper.startTime = audioContext.currentTime - wrapper.offset / wrapper.playbackRate;
      wrapper.source = source;
      wrapper.playing = true;
      source.onended = () => {
        if (!source.loop && wrapper.currentTime > wrapper.buffer.duration - 0.1) wrapper.playing = false;
      };
    },
    pause: function() {
      if (wrapper.source) {
        try { wrapper.source.stop(); } catch {}
        wrapper.offset = (audioContext.currentTime - wrapper.startTime) * wrapper.playbackRate;
        wrapper.playing = false;
        wrapper.source.disconnect();
        wrapper.source = null;
      }
    },
    get currentTime() {
      return wrapper.playing ? (audioContext.currentTime - wrapper.startTime) * wrapper.playbackRate : wrapper.offset;
    },
    set currentTime(t) {
      wrapper.offset = t;
      if (wrapper.playing) {
        wrapper.pause();
        wrapper.play();
      }
    },
    gain: gain
  };
  fetch(src).then(res => res.arrayBuffer()).then(buf => audioContext.decodeAudioData(buf)).then(decoded => wrapper.buffer = decoded);
  return wrapper;
};
function difference(a, b) {
  return Math.abs(a - b);
}

let lastSoundUpdate = null;
let lastTireSqueak = null;
sounds = {
  initialize: function() {
    const listener = new THREE.AudioListener();
    scene.add(listener);
    camera.audioListener = listener;
  },
  library: {
    cars: {
      Toyota_RAV4: {
        accelerate: loadSound("/sounds/cars/Toyota_RAV4/accelerate.mp3"),
        accelerateInterior: loadSound("/sounds/cars/Toyota_RAV4/accelerate-interior.mp3"),
        decelerate: loadSound("/sounds/cars/Toyota_RAV4/decelerate.mp3"),
        decelerateInterior: loadSound("/sounds/cars/Toyota_RAV4/decelerate-interior.mp3"),
        idle: loadSound("/sounds/cars/Toyota_RAV4/idle.mp3"),
        rev: loadSound("/sounds/cars/Toyota_RAV4/rev.mp3")
      },
      ambience: loadSound("/sounds/cars/ambience.mp3"),
      ambienceInterior: loadSound("/sounds/cars/ambience-interior.mp3"),
      bumpInterior: loadSound("/sounds/cars/bump-interior.mp3"),
      hitInterior: loadSound("/sounds/cars/hit-interior.mp3"),
      crashInterior: loadSound("/sounds/cars/crash-interior.mp3"),
      tireSqueak: loadSound("/sounds/cars/tire-squeak.mp3"),
    }
  },
  update: function(time) {
    let accelerateSound = null;
    let decelerateSound = null;
    const idleSound = sounds.library.cars[chosenVehicle].idle;
    if (vehicle.currentView == 0) {
      accelerateSound = sounds.library.cars[chosenVehicle].accelerateInterior;
      decelerateSound = sounds.library.cars[chosenVehicle].decelerateInterior;
    } else {
      accelerateSound = sounds.library.cars[chosenVehicle].accelerate;
      decelerateSound = sounds.library.cars[chosenVehicle].decelerate;
    }
    if (utils.data.throttle) {
      if (decelerateSound.playing) decelerateSound.pause();
      const speedToSoundTime = vehicle.speedMPH / (vehicle.physics.maxSpeedMPH / accelerateSound.buffer.duration);
      if (!accelerateSound.playing) accelerateSound.currentTime = speedToSoundTime, accelerateSound.play();
      if (time - lastSoundUpdate > 100) {
        lastSoundUpdate = time;
        const speedRatio = vehicle.speedMPH / vehicle.physics.maxSpeedMPH;
        const soundRatio = accelerateSound.currentTime / accelerateSound.buffer.duration;
        if (difference(speedRatio, soundRatio) > 0.03) {
          accelerateSound.pause();
          accelerateSound.currentTime = speedToSoundTime;
          accelerateSound.play();
          if (difference(speedRatio, soundRatio) > 0.02) {
            sounds.library.cars[chosenVehicle].rev.currentTime = 0;
            sounds.library.cars[chosenVehicle].rev.play();
          }
        }
      }
    } else {
      if (accelerateSound.playing) accelerateSound.pause();
      if (vehicle.speedMPH > 2 && !decelerateSound.playing) {
        decelerateSound.currentTime = 1;
        decelerateSound.play();
      }
    }
    if (!idleSound.playing) idleSound.currentTime = 0, idleSound.play();
    sounds.library.cars[chosenVehicle].idle.gain.gain.value = Math.max(1 - (vehicle.speedMPH / vehicle.physics.maxSpeedMPH * 5), 0);
    if (vehicle.currentView == 0) {
      if (sounds.library.cars[chosenVehicle].accelerate.playing) {
        sounds.library.cars[chosenVehicle].accelerate.pause();
        sounds.library.cars[chosenVehicle].accelerateInterior.currentTime = sounds.library.cars[chosenVehicle].accelerate.currentTime;
        sounds.library.cars[chosenVehicle].accelerateInterior.play();
      }
      if (sounds.library.cars[chosenVehicle].decelerate.playing) {
        sounds.library.cars[chosenVehicle].decelerate.pause();
        sounds.library.cars[chosenVehicle].decelerateInterior.currentTime = sounds.library.cars[chosenVehicle].decelerate.currentTime;
        sounds.library.cars[chosenVehicle].decelerateInterior.play();
      }
      if (!sounds.library.cars.ambienceInterior.playing) sounds.library.cars.ambience.pause(), sounds.library.cars.ambienceInterior.currentTime = 0, sounds.library.cars.ambienceInterior.play();
    } else {
      if (sounds.library.cars[chosenVehicle].accelerateInterior.playing) {
        sounds.library.cars[chosenVehicle].accelerateInterior.pause();
        sounds.library.cars[chosenVehicle].accelerate.currentTime = sounds.library.cars[chosenVehicle].accelerateInterior.currentTime;
        sounds.library.cars[chosenVehicle].accelerate.play();
      }
      if (sounds.library.cars[chosenVehicle].decelerateInterior.playing) {
        sounds.library.cars[chosenVehicle].decelerateInterior.pause();
        sounds.library.cars[chosenVehicle].decelerate.currentTime = sounds.library.cars[chosenVehicle].decelerateInterior.currentTime;
        sounds.library.cars[chosenVehicle].decelerate.play();
      }
      if (sounds.library.cars.ambienceInterior.playing) sounds.library.cars.ambienceInterior.pause(), sounds.library.cars.ambience.currentTime = 0, sounds.library.cars.ambience.play();
    }
  },
  collision: function(power) {
    if (power < 6) {
      if (vehicle.currentView == 0) {
        sounds.library.cars.bumpInterior.currentTime = 0;
        sounds.library.cars.bumpInterior.play();
      } else {
        sounds.library.cars.bump.currentTime = 0;
        sounds.library.cars.bump.play();
      }
    } else if (power < 8) {
      if (vehicle.currentView == 0) {
        sounds.library.cars.hitInterior.currentTime = 0;
        sounds.library.cars.hitInterior.play();
      } else {
        sounds.library.cars.hit.currentTime = 0;
        sounds.library.cars.hit.play();
      }
    } else {
      if (vehicle.currentView == 0) {
        sounds.library.cars.crashInterior.currentTime = 0;
        sounds.library.cars.crashInterior.play();
      } else {
        sounds.library.cars.crash.currentTime = 0;
        sounds.library.cars.crash.play();
      }
    }
  },
  tireSqueak: function() {
    if (Math.abs(utils.data.currentHeading) > 10) {
      sounds.library.cars.tireSqueak.currentTime = 0;
      sounds.library.cars.tireSqueak.play();
    }
  }
};