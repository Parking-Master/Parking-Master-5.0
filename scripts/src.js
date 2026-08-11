      if (!localStorage["points"]) localStorage.setItem("points", 0);
      document.querySelector(".loading").style.backgroundImage = "url(/images/loading-screens/" + Math.floor(Math.random() * 4) + ".png)";

      function generateUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
          let r = Math.random() * 16 | 0;
          let v = (c == "x" ? r : (r & 0x3 | 0x8));
          return v.toString(16);
        });
      }

      let settings = {
        performance: {
          slider: 75, // Switches between 25%, 50%, 75%, and 100% to control preset options in the performance settings.
          resolution: 70, // Controls the size percentage of the screen.
          reduceScreenSize: false, // Shrinks the game screen to improve performance without lowering quality.
          backgroundCars: true, // Controls whether fake cars on highway are visible.
          replay: false // Enables or disables replay mode, which automatically records your game so you can rewatch it.
        }
      };

      function updateSettings(slider = true) {
        if (slider) {
          if (settings.performance.slider <= 25) {
            settings.performance.resolution = 40;
            settings.performance.reduceScreenSize = true;
            settings.performance.backgroundCars = false;
            settings.performance.replay = false;
          } else if (settings.performance.slider <= 50) {
            settings.performance.resolution = 50;
            settings.performance.reduceScreenSize = false;
            settings.performance.backgroundCars = false;
            settings.performance.replay = false;
          } else if (settings.performance.slider <= 75) {
            settings.performance.resolution = utils.data.defaultResolution;
            settings.performance.reduceScreenSize = false;
            settings.performance.backgroundCars = true;
            settings.performance.replay = false;
          } else {
            settings.performance.resolution = 100;
            settings.performance.reduceScreenSize = false;
            settings.performance.backgroundCars = true;
            settings.performance.replay = true;
          }
        }
        if (settings.performance.reduceScreenSize) {
          document.querySelector("#game").dataset.reduceScreenSize = "1";
        } else {
          document.querySelector("#game").removeAttribute("data-reduce-screen-size");
        }
        if (!settings.performance.backgroundCars) spawnedPropCars.forEach(car => scene.remove(car));
        document.querySelector("#performance-slider-percent").textContent = settings.performance.slider + "%" + (settings.performance.slider == 75 ? " (Default)" : "");
        document.querySelector("input[name='slider']").value = settings.performance.slider;
        document.querySelector("#performance-resolution-percent").textContent = settings.performance.resolution + "%";
        document.querySelector("input[name='resolution']").value = settings.performance.resolution;
        document.querySelector("input[name='reduce-screen-size']").checked = settings.performance.reduceScreenSize;
        document.querySelector("input[name='background-cars']").checked = settings.performance.backgroundCars;
        document.querySelector("input[name='replay']").checked = settings.performance.replay;
        onWindowResize();
        renderer.render(scene, camera);
      }

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
      const clock = new THREE.Clock();
      const directionalLight = new THREE.DirectionalLight(0xf4e6bc, 1.6);
      const ambientLight = new THREE.AmbientLight(0xefe1a7, 0.4);

      renderer.setSize(window.innerWidth, window.innerHeight);
      document.querySelector("#game").appendChild(renderer.domElement);
      scene.add(camera);

      camera.rotation.order = "YXZ";
      camera.position.z = 4;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.VSMShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      directionalLight.position.set(-40, 50, 0);
      directionalLight.castShadow = true;
      directionalLight.shadow.camera.near = 0.01;
      directionalLight.shadow.camera.far = 500;
      directionalLight.shadow.camera.right = 30;
      directionalLight.shadow.camera.left = -30;
      directionalLight.shadow.camera.top = 30;
      directionalLight.shadow.camera.bottom = -30;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.radius = 2;
      directionalLight.shadow.bias = -0.00006;
      ambientLight.position.set(2, 1, 1);
      scene.add(directionalLight);
      scene.add(ambientLight);

      const world = new CANNON.World();
      world.gravity.set(0, -9.82, 0);
      const groundMaterial = new CANNON.Material("groundMaterial");
      const wheelMaterial = new CANNON.Material("wheelMaterial");
      const carMaterial = new CANNON.Material("carMaterial");
      const wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, { friction: 0.3 });
      world.addContactMaterial(wheelGroundContactMaterial);
      const carGroundContactMaterial = new CANNON.ContactMaterial(carMaterial, groundMaterial, { friction: 0.01 });
      world.addContactMaterial(carGroundContactMaterial);

      function onWindowResize() {
        renderer.setPixelRatio(1.1);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth * settings.performance.resolution / 100, window.innerHeight * settings.performance.resolution / 100, false);
        const canvas = document.querySelector(".ui");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      window.addEventListener("resize", onWindowResize);

      const vectors = [new THREE.Vector3(), new THREE.Vector3(2, 1, 0.5), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new CANNON.Vec3(), new CANNON.Vec3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(2, 2, 2), new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(), new CANNON.Vec3(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new CANNON.Vec3(0.2, 0.2, 0.2), new CANNON.Vec3(0.07, 0.225, 0.07)];
      const eulers = [new THREE.Euler(), new THREE.Euler(), new THREE.Euler()];
      const quaternions = [new CANNON.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()];
      const box3 = new THREE.Box3();
      const materials = [new THREE.MeshBasicMaterial({ color: 0x555555, map: new THREE.TextureLoader().load("/images/effects/tire_marks.png"), polygonOffset: true, polygonOffsetFactor: -4, transparent: true, opacity: 0.5, depthWrite: false }), new THREE.TextureLoader().load("/images/effects/shattered_window.png")];
      const objects = {};
      const loadingManager = new THREE.LoadingManager();

      let previousProgress = 0;
      loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = itemsLoaded / itemsTotal;
        if (progress < previousProgress) return;
        previousProgress = progress;
        document.querySelector(".progress-bar").style.width = (progress * 100) + "%";
      };

      let chosenVehicle = users.loggedIn ? users.data.currentCar : "Honda_Civic";
      let keyStates = {};
      let vehicle = null;
      let propCars = [];
      let lastPropCarSpawn = null;
      let spawnedPropCars = [];
      let brake = 0;
      let engine = 0;
      let physicsBodies = [];
      let map = null;
      let sky = null;

      sounds.initialize();

      let frameCount = 0;
      function animate(now) {
        if (utils.data.paused) {
          GamepadControls.update();
          return requestAnimationFrame(animate);
        }
        const deltaTime = Math.min(0.04, clock.getDelta());
        const time = Date.now();
        world.step(deltaTime);

        GamepadControls.update();
        utils.vehicle.updatePhysics(deltaTime);
        utils.vehicle.updateSteering(deltaTime);
        utils.vehicle.updateThrottle(deltaTime, time);
        utils.vehicle.updateBrakes(deltaTime, time);
        utils.vehicle.updateView(deltaTime, time);
        utils.vehicle.updateLights(time);
        utils.vehicle.updateControls();
        utils.vehicle.updateEffects();
        particles.update();
        if (frameCount % 2 == 0) sounds.update(time);
        if (frameCount % 4 == 0) utils.ui.update(deltaTime, time);
        TouchControls.update();

        for (let i = 0; i < physicsBodies.length; i++) {
          if (physicsBodies[i].fixedPosition) physicsBodies[i].body.position.copy(physicsBodies[i].fixedPosition), physicsBodies[i].body.quaternion.copy(physicsBodies[i].fixedRotation);
          physicsBodies[i].mesh.position.copy(physicsBodies[i].body.position);
          physicsBodies[i].mesh.quaternion.copy(physicsBodies[i].body.quaternion);
        }

        if (settings.performance.backgroundCars) {
          const spawnFactor = Math.floor(Math.random() * 100);
          if (spawnFactor <= 10) {
            const newPropCar = propCars[Math.floor(Math.random() * propCars.length)];
            if (newPropCar && spawnedPropCars.indexOf(newPropCar) == -1 && time - lastPropCarSpawn > 800) {
              lastPropCarSpawn = time;
              if (spawnFactor <= 5) {
                newPropCar.rotation.set(-Math.PI / 2 - 0.05, -0.01, -Math.PI / 2);
                newPropCar.position.set(300, 0.2, 17);
                newPropCar.direction = 1;
              } else {
                newPropCar.rotation.set(-Math.PI / 2 - 0.05, 0.01, Math.PI / 2);
                newPropCar.position.set(-300, 0.4, 24);
                newPropCar.direction = -1;
              }
              spawnedPropCars.push(newPropCar);
            }
          }
          for (let i = 0; i < spawnedPropCars.length; i++) {
            const propCar = spawnedPropCars[i];
            if (propCar.position.x > -301 && propCar.position.x < 301) {
              propCar.position.x += -25 * propCar.direction * deltaTime;
            } else {
              spawnedPropCars.splice(spawnedPropCars.indexOf(propCar), 1);
            }
          }
        }

        for (id in objects) {
          const object = objects[id];
          if (time - object.timestamp > object.delay) {
            if (object.objectType == "tireMarks") {
              scene.remove(object);
              object.geometry.dispose();
              object.material.dispose();
              delete objects[id];
            } else if (object.objectType == "backupCameraOn") {
              object.material.map = utils.vehicle.backupRenderTarget.texture;
              utils.vehicle.setInstruments(true, "Backup_Camera");
              vehicle.parts.Control_Screen.material.color.setHex(0xffffff);
              sounds.warningBackup();
              delete objects[id];
            } else if (object.objectType == "backupCameraOff") {
              vehicle.parts.Control_Screen.material.map = vehicle.parts.Control_Screen.material.mainMap;
              vehicle.parts.Control_Screen.material.color.setHex(0xffffff);
              delete objects[id];
            } else if (object.objectType == "timerStart") {
              utils.data.countdown = true;
              utils.data.levelStartTime = Date.now();
              sounds.timeStart();
              delete objects[id];
            } else if (object.objectType == "moneyText") {
              utils.data.moneyText = null;
              delete objects[id];
            }
          }
        }

        if ((vehicle && vehicle.currentView == 0 && frameCount % 3 == 0 && vehicle.speed > 0.1) || utils.vehicle.backupRenderTarget.initialUpdate) {
          utils.vehicle.backupRenderTarget.initialUpdate = false;
          vehicle.model.visible = false;
          renderer.setRenderTarget(utils.vehicle.mirrorRenderTarget);
          renderer.render(scene, vehicle.parts.Mirror_L_Camera);
          if (utils.data.currentTransmission == "reverse" && vehicle.hasBackupCamera) {
            renderer.setRenderTarget(utils.vehicle.backupRenderTarget);
            renderer.render(scene, vehicle.parts.Backup_Camera);
          }
          renderer.setRenderTarget(null);
          vehicle.model.visible = true;
        }

        if (settings.performance.replay) utils.data.replayFrames.push([deltaTime, vehicle.body.position.clone(), vehicle.body.quaternion.clone(), vehicle.body.velocity.clone(), vehicle.body.angularVelocity.clone(), utils.data.currentHeading]);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      utils = {
        scheduleObject: function(object, type, delay) {
          object.objectType = type;
          object.delay = delay;
          object.timestamp = Date.now();
          objects[generateUUID()] = object;
        },
        data: {
          currentTransmission: "drive",
          currentGear: 0,
          currentHeading: 0,
          brake: false,
          throttle: false,
          blinker: false,
          lastBlinker: null,
          autoBlinker: false,
          lastCrash: null,
          lastThrottle: null,
          carHeadingIncrement: 0,
          carHeadingMaxIncrement: 11,
          lastVehicleRotationY: 0,
          timeOfBrake: null,
          timeOfGas: null,
          allowedToUseControls: false,
          countdown: false,
          levelTime: 120,
          levelStartTime: null,
          timeLeft: null,
          initialViewSwitch: false,
          steerPowerCoefficient: 1,
          isUsingKeyboard: true,
          isMobileGame: false,
          moneyText: null,
          realLevel: 1,
          replayFrames: [],
          currentReplayFrame: 0,
          defaultResolution: 70,
          paused: false,
          pausedTimestamp: Date.now(),
          finalParkingSpotCount: 0
        },
        vehicles: {
          "Honda_Civic": {
            physics: {
              maxSpeedMPH: 140,
              drivetrain: "fwd",
              engineForce: 1200,
              wheelTurnRatio: 12,
              frontArea: 2.2,
              rearArea: 2.7,
              weight: 1416,
              gearRatios: [3.64, 2.08, 1.36, 1.02, 0.83, 0.69],
              finalDriveRatio: 4.11,
              upshiftRPM: 5500,
              downshiftRPM: 2000,
              wheelPhysics: {
                weight: 10,
                radius: 0.33,
                suspensionStiffness: 36,
                suspensionRestLength: 0.2,
                frictionSlip: 2,
                dampingRelaxation: 6,
                dampingCompression: 4.5,
                maxSuspensionForce: 120000,
                maxSuspensionTravel: 1,
                rollInfluence: 0.08,
              }
            },
            parts: {},
            hasBackupCamera: true,
            hasControlScreen: true,
            controls: {
              "Shifter": {
                hovering: false,
                bounds: [-2.2, -2.7, -0.45, -0.8]
              },
              "Lever_L": {
                hovering: false,
                bounds: [3.1, 2.8, -0.25, -0.5]
              },
              "Lever_R": {
                hovering: false,
                bounds: [-2.8, -3.1, -0.25, -0.5]
              }
            },
            currentControl: null,
            views: [
              [0.35, 0.35, -0.2, 0, Math.PI, 0],
              [0, 0.65, 6, 0.08, Math.PI, 0],
              [1.2, 0, -3, 0.05, Math.PI, 0],
              [0, 0.4, 4.5, -0.1, 0, 0]
            ],
            currentView: 0
          },
          "Toyota_RAV4": {
            physics: {
              maxSpeedMPH: 119,
              drivetrain: "fwd",
              engineForce: 700,
              wheelTurnRatio: 10,
              frontArea: 2.5,
              rearArea: 2.9,
              weight: 1700,
              gearRatios: [5.25, 3.03, 1.95, 1.46, 1.22, 1, 0.81, 0.67],
              finalDriveRatio: 3.18,
              upshiftRPM: 5500,
              downshiftRPM: 1800,
              wheelPhysics: {
                weight: 10,
                radius: 0.378,
                suspensionStiffness: 42,
                suspensionRestLength: 0.37,
                frictionSlip: 1.5,
                dampingRelaxation: 2.3,
                dampingCompression: 4.4,
                maxSuspensionForce: 100000,
                maxSuspensionTravel: 1,
                rollInfluence: 0.08
              }
            },
            parts: {},
            hasBackupCamera: true,
            hasControlScreen: true,
            controls: {
              "Shifter": {
                hovering: false,
                bounds: [-2.2, -2.7, -0.45, -0.8]
              },
              "Lever_L": {
                hovering: false,
                bounds: [3.1, 2.8, -0.25, -0.5]
              },
              "Lever_R": {
                hovering: false,
                bounds: [-2.8, -3.1, -0.25, -0.5]
              }
            },
            currentControl: null,
            views: [
              [0.35, 0.55, -0.1, 0, Math.PI, 0],
              [0, 0.8, 6.2, 0.08, 3.141592653589793, 0],
              [1.3, 0, -3.2, 0.05, Math.PI, 0],
              [0, 0.6, 5, -0.05, 0, 0]
            ],
            currentView: 0
          },
          "Mini_Cooper": {
            physics: {
              maxSpeedMPH: 142,
              drivetrain: "fwd",
              engineForce: 750,
              wheelTurnRatio: 14,
              frontArea: 2.5,
              rearArea: 2.9,
              weight: 1250,
              gearRatios: [3.923, 2.136, 1.393, 1.088, 0.892, 0.756],
              finalDriveRatio: 3.59,
              upshiftRPM: 5500,
              downshiftRPM: 1800,
              wheelPhysics: {
                weight: 9.6,
                radius: 0.33,
                suspensionStiffness: 36,
                suspensionRestLength: 0.33,
                frictionSlip: 1.5,
                dampingRelaxation: 2.3,
                dampingCompression: 4.4,
                maxSuspensionForce: 100000,
                maxSuspensionTravel: 1,
                rollInfluence: 0.01
              }
            },
            parts: {},
            hasBackupCamera: true,
            hasControlScreen: true,
            controls: {
              "Shifter": {
                hovering: false,
                bounds: [-2.2, -2.7, -0.45, -0.8]
              },
              "Lever_L": {
                hovering: false,
                bounds: [3.1, 2.8, -0.25, -0.5]
              },
              "Lever_R": {
                hovering: false,
                bounds: [-2.8, -3.1, -0.25, -0.5]
              }
            },
            currentControl: null,
            views: [
              [0.33, 0.4, -0.3, 0, Math.PI, 0],
              [0, 0.6, 5.9, 0.12, 3.141592653589793, 0],
              [1.3, 0, -3.2, 0.05, Math.PI, 0],
              [0, 0.55, 4.8, -0.08, 0, 0]
            ],
            currentView: 0
          },
          "Ford_Victoria": {
            physics: {
              maxSpeedMPH: 180,
              drivetrain: "rwd",
              engineForce: 800,
              wheelTurnRatio: 12.5,
              frontArea: 2.2,
              rearArea: 2.3,
              weight: 1773,
              gearRatios: [3.55, 3.27, 2.73],
              finalDriveRatio: 3.27,
              upshiftRPM: 5500,
              downshiftRPM: 1800,
              wheelPhysics: {
                weight: 9,
                radius: 0.35,
                suspensionStiffness: 36,
                suspensionRestLength: 0.41,
                frictionSlip: 1,
                dampingRelaxation: 2.3,
                dampingCompression: 4.4,
                maxSuspensionForce: 100000,
                maxSuspensionTravel: 1,
                rollInfluence: 0.05
              }
            },
            parts: {},
            hasBackupCamera: false,
            hasControlScreen: false,
            controls: {
              "Shifter": {
                hovering: false,
                bounds: [-2, -2.9, -0.3, -0.6]
              },
              "Lever_L": {
                hovering: false,
                bounds: [3.1, 2.8, -0.25, -0.5]
              }
            },
            currentControl: null,
            views: [
              [0.4, 0.35, 0, 0, 3.141592653589793, 0],
              [0, 0.6, 7, 0.12, 3.141592653589793, 0],
              [1.3, 0, -3.3, 0.05, Math.PI, 0],
              [0, 0.5, 5, -0.08, 0, 0]
            ],
            currentView: 0
          },
          "Ford_F150": {
            physics: {
              maxSpeedMPH: 120,
              drivetrain: "awd",
              engineForce: 800,
              wheelTurnRatio: 10,
              frontArea: 3,
              rearArea: 3.3,
              weight: 2880,
              gearRatios: [4.69, 2.98, 2.14, 1.76, 1.52, 1.27, 1, 0.85, 0.68, 0.63],
              finalDriveRatio: 3.55,
              upshiftRPM: 5000,
              downshiftRPM: 1800,
              wheelPhysics: {
                weight: 12,
                radius: 0.43,
                suspensionStiffness: 32,
                suspensionRestLength: 0.58,
                frictionSlip: 1.5,
                dampingRelaxation: 2.3,
                dampingCompression: 4.4,
                maxSuspensionForce: 100000,
                maxSuspensionTravel: 1,
                rollInfluence: 0.05
              }
            },
            parts: {},
            hasBackupCamera: true,
            hasControlScreen: true,
            controls: {
              "Shifter": {
                hovering: false,
                bounds: [-2, -3, -0.55, -0.8]
              },
              "Lever_L": {
                hovering: false,
                bounds: [3.1, 2.8, -0.25, -0.5]
              }
            },
            currentControl: null,
            views: [
              [0.45, 0.54, 0.2, 0, 3.141592653589793, 0],
              [0, 0.6, 7, 0.11, 3.141592653589793, 0],
              [1.8, 0.1, -3.5, 0.05, 3.141592653589793, 0],
              [0, 1, 6, -0.2, 0, 0]
            ],
            currentView: 0
          },
          "Chevy_Camaro": {
            physics: {
              maxSpeedMPH: 198,
              drivetrain: "fwd",
              engineForce: 1600,
              wheelTurnRatio: 9,
              frontArea: 2,
              rearArea: 2.4,
              weight: 1761,
              gearRatios: [2.66, 1.78, 1.3, 1, .74, .5],
              finalDriveRatio: 3.73,
              upshiftRPM: 5500,
              downshiftRPM: 2000,
              wheelPhysics: {
                weight: 10,
                radius: 0.36,
                suspensionStiffness: 36,
                suspensionRestLength: 0.26,
                frictionSlip: 2,
                dampingRelaxation: 6,
                dampingCompression: 4.5,
                maxSuspensionForce: 120000,
                maxSuspensionTravel: 1,
                rollInfluence: 0.08,
              }
            },
            parts: {},
            hasBackupCamera: true,
            hasControlScreen: true,
            controls: {
              "Shifter": {
                hovering: false,
                bounds: [-2, -3, -0.55, -0.8]
              },
              "Lever_L": {
                hovering: false,
                bounds: [3.1, 2.8, -0.25, -0.5]
              }
            },
            currentControl: null,
            views: [
              [0.38, 0.37, -0.25, 0, 3.141592653589793, 0],
              [0, 0.5, 6, 0.11, 3.141592653589793, 0],
              [1.5, 0, -3, 0.05, 3.141592653589793, 0],
              [0, 0.8, 5, -0.2, 0, 0]
            ],
            currentView: 0
          }
        },
        vehicle: {
          mirrorRenderTarget: new THREE.WebGLRenderTarget(128, 128),
          backupRenderTarget: new THREE.WebGLRenderTarget(128, 128),
          envMap: new THREE.Texture(),
          lightsInUse: {
            "brake": false,
            "reverse": false,
            "blinker_l": false,
            "blinker_r": false
          },
          vehicleNames: {
            "Honda_Civic": "2019 Honda Civic Sport Touring",
            "Toyota_RAV4": "2023 Toyota RAV4",
            "Mini_Cooper": "2014 Mini Cooper S",
            "Ford_Victoria": "2010 Ford Crown Victoria",
            "Ford_F150": "2017 Ford F-150 Raptor",
            "Chevy_Camaro": "2017 Chevrolet Camaro"
          },
          cameraBob: function(intensity = 1, maxStep = 2) {
            let step = 0;
            let strength = 0.001;
            function animation() {
              if (step > maxStep) {
                step = 0;
                if (strength > 0) {
                  strength *= -1;
                } else {
                  return;
                }
              }
              step++;
              camera.rotateX(strength * 2 * intensity);
              requestAnimationFrame(animation);
            }
            animation();
          },
          initialize: function() {
            vehicle = Object.assign(new CANNON.RaycastVehicle({ indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2 }), utils.vehicles[chosenVehicle]);
            new THREE.GLTFLoader(loadingManager).load("models/cars/" + chosenVehicle + ".glb", function(model) {
              vehicle.model = model.scene;
              vehicle.model.traverse(child => {
                vehicle.parts[child.name] = child;
                if (child.material) {
                  child.material.vertexColors = false;
                  if (child.name != "Windows") child.material.depthWrite = true;
                }
                if (child.name == "Exterior" || child.name == "Roof" || child.name == "Trim" || child.name == "Windows" || child.name == "Mirror_R") {
                  child.userData.useEnvMap = true;
                  if (child.name == "Exterior") vehicle.originalExteriorGeometry = child.geometry.clone();
                } else if (child.name == "Shadow") {
                  scene.add(child);
                } else if (child.name == "Chassis") {
                  child.rotation.order = "YXZ";
                  vehicle.mesh = child;
                  const chassisSize = box3.setFromObject(vehicle.mesh).getSize(new THREE.Vector3());
                  vehicle.spawnHeight = (chassisSize.y / 2) + 0.1;
                  vehicle.corners = {
                    fl: new THREE.Vector3(chassisSize.x / 2, -chassisSize.y / 2, chassisSize.z / 2),
                    fr: new THREE.Vector3(-chassisSize.x / 2, -chassisSize.y / 2, chassisSize.z / 2),
                    rl: new THREE.Vector3(chassisSize.x / 2, -chassisSize.y / 2, -chassisSize.z / 2),
                    rr: new THREE.Vector3(-chassisSize.x / 2, -chassisSize.y / 2, -chassisSize.z / 2)
                  };
                  vehicle.chassisBody = new CANNON.Body({ mass: vehicle.physics.weight - vehicle.physics.wheelPhysics.weight * 4, shape: new CANNON.Box(new CANNON.Vec3(chassisSize.x / 2, chassisSize.y / 2, chassisSize.z / 2)), material: carMaterial });
                  vehicle.body = vehicle.chassisBody;
                }
              });
              vehicle.physics.wheelPhysics.directionLocal = new CANNON.Vec3(0, -1, 0);
              vehicle.physics.wheelPhysics.axleLocal = new CANNON.Vec3(-1, 0, 0);
              vehicle.physics.wheelPhysics.chassisConnectionPointLocal = new CANNON.Vec3(1, 1, 0);
              for (let i = 0; i < 4; i++) {
                const wheelMesh = vehicle.parts.Wheels.children[i];
                vehicle.physics.wheelPhysics.chassisConnectionPointLocal.copy(wheelMesh.position);
                vehicle.addWheel(vehicle.physics.wheelPhysics);
                const wheel = vehicle.wheelInfos[i];
                wheel.index = i;
                wheel.mesh = wheelMesh;
                wheel.body = new CANNON.Body({ mass: vehicle.physics.wheelPhysics.weight, material: wheelMaterial });
                quaternions[0].setFromAxisAngle(vectors[11], Math.PI / 2);
                wheel.body.addShape(new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20), vectors[12], quaternions[0]);
              }
              vehicle.debris = [];
              new THREE.GLTFLoader(loadingManager).load("models/debris.glb", function(model) {
                model.scene.children.forEach(child => {
                  const entry = { body: new CANNON.Body({ mass: 2, shape: new CANNON.Box(vectors[20]) }), mesh: child };
                  physicsBodies.push(entry);
                  vehicle.debris.push(entry);
                });
              });
              vehicle.body.addEventListener("collide", function(event) {
                if (Math.abs(event.contact.ni.x) <= 0.1 && Math.abs(event.contact.ni.y) >= 0.5 && Math.abs(event.contact.ni.z) <= 0) return;
                const time = Date.now();
                if (time - utils.data.lastCrash < 100 || vehicle.speed < .1) return;
                utils.data.lastCrash = time;
                const worldHitPosition = vectors[6].copy(event.contact.bi.position);
                worldHitPosition.vadd(event.contact.ri, worldHitPosition);
                const power = event.contact.getImpactVelocityAlongNormal();
                sounds.collision(power);
                if (power > 2) {
                  utils.vehicle.cameraBob(power / 2);
                  particles.dust(worldHitPosition, Math.pow(power, 1.5) / 1.5);
                  utils.vehicle.dentExterior(vehicle.parts.Exterior, vectors[7].copy(worldHitPosition), vectors[8].copy(event.contact.ni), power);
                }
                if (power > 8) {
                  vehicle.parts.Windows.material.map = materials[1];
                  vehicle.parts.Windows.material.emissive.setHex(0x555555);
                  vehicle.parts.Windows.material.opacity = 1;
                  if (vehicle.currentView == 0) particles.dust(camera.position, 5);
                  const amountOfDebris = Math.floor(Math.random() * vehicle.debris.length) + 1;
                  for (let i = 0; i < amountOfDebris; i++) {
                    const debris = vehicle.debris[i];
                    world.add(debris.body);
                    scene.add(debris.mesh);
                    debris.body.position.copy(worldHitPosition);
                    debris.body.velocity.set(1, 5, 1);
                    debris.body.angularVelocity.set(1, 1, 1);
                  }
                  utils.vehicle.setInstruments(true, "Airbag");
                  utils.vehicle.cameraBob(20);
                }
                utils.game.gameOver();
              });
              vehicle.body.position.y = 1;
              vehicle.addToWorld(world);
              scene.add(vehicle.model);
              vehicle.parts.Windows.material.map = materials[1];
              renderer.render(scene, camera);
              vehicle.parts.Windows.material.map = null;
              utils.game.controls.stopBrake();
              utils.vehicle.setLights(false);
              utils.vehicle.setInstruments(false);
              if (vehicle.hasControlScreen) vehicle.parts.Control_Screen.material.mainMap = vehicle.parts.Control_Screen.material.map;
              utils.map.initialize();
            });
          },
          updateBrakes: function(deltaTime, time) {
            vehicle.setBrake(0, 0);
            vehicle.setBrake(0, 1);
            vehicle.setBrake(0, 2);
            vehicle.setBrake(0, 3);
            if (utils.data.brake) {
              if (utils.data.timeOfBrake == null) utils.data.timeOfBrake = time;
              const brakeTime = time - utils.data.timeOfBrake;
              if (utils.data.isUsingKeyboard) brake = brakeTime < 700 ? 100 : 100 + Math.min((brakeTime - 700) * deltaTime * 20, 500);
              brake *= Math.pow(1 - (vehicle.speedMPH / vehicle.physics.maxSpeedMPH), 4.5) * 0.8;
            } else {
              utils.data.timeOfBrake = null;
              brake = 0;
            }
            if (!utils.data.throttle) {
              const brakeForce = Math.abs(vehicle.currentVehicleSpeedKmHour) < 0.5 ? 500 : brake;
              if (vehicle.speed < 0.15 && vehicle.speed > 0.02) {
                vehicle.setBrake(10, 0);
                vehicle.setBrake(10, 1);
                vehicle.setBrake(10, 2);
                vehicle.setBrake(10, 3);
              } else {
                vehicle.applyEngineForce(brakeForce * vehicle.currentVehicleSpeedKmHour, 0);
                vehicle.applyEngineForce(brakeForce * vehicle.currentVehicleSpeedKmHour, 1);
                vehicle.applyEngineForce(brakeForce * vehicle.currentVehicleSpeedKmHour, 2);
                vehicle.applyEngineForce(brakeForce * vehicle.currentVehicleSpeedKmHour, 3);
              }
            }
            if (utils.data.currentTransmission == "park" && vehicle.speed > 0.02) {
              vehicle.setBrake(10, 0);
              vehicle.setBrake(10, 1);
              vehicle.setBrake(10, 2);
              vehicle.setBrake(10, 3);
            }
          },
          updateSteering: function(deltaTime) {
            if (keyStates["ArrowLeft"] && utils.data.allowedToUseControls) {
              utils.data.carHeadingIncrement = Math.min(utils.data.carHeadingIncrement + (50 * utils.data.steerPowerCoefficient * deltaTime), utils.data.carHeadingMaxIncrement * utils.data.steerPowerCoefficient);
            } else if (keyStates["ArrowRight"] && utils.data.allowedToUseControls) {
              utils.data.carHeadingIncrement = Math.max(utils.data.carHeadingIncrement - (50 * utils.data.steerPowerCoefficient * deltaTime), -utils.data.carHeadingMaxIncrement * utils.data.steerPowerCoefficient);
            } else {
              if (utils.data.carHeadingIncrement < -1 || utils.data.carHeadingIncrement > 1) {
                utils.data.carHeadingIncrement /= 120 * deltaTime;
              } else {
                utils.data.carHeadingIncrement = 0;
              }
            }
            utils.data.currentHeading = Math.max(Math.min(utils.data.currentHeading + (utils.data.carHeadingIncrement / vehicle.physics.wheelTurnRatio), 35), -35);
            utils.data.currentHeading += utils.physics.calculateHeadingReset(utils.data.currentHeading, vehicle.speed);
            const steeringValue = THREE.MathUtils.degToRad(utils.data.currentHeading);
            vehicle.setSteeringValue(steeringValue, 0);
            vehicle.setSteeringValue(steeringValue, 1);
            vehicle.parts.Steering_Wheel.rotation.z = -steeringValue * vehicle.physics.wheelTurnRatio;
            if (utils.data.autoBlinker && Math.abs(utils.data.currentHeading) < 1) utils.game.controls.stopBlinker();
            if (Math.abs(utils.data.currentHeading) > 1 && utils.data.blinker) {
              utils.data.autoBlinker = true;
            } else {
              utils.data.autoBlinker = false;
            }
          },
          updateThrottle: function(deltaTime, time) {
            if (vehicle.rpm > (utils.data.currentTransmission == "drive" ? vehicle.physics.upshiftRPM : 1000) && utils.data.currentGear < vehicle.physics.gearRatios.length - 1) utils.data.currentGear++;
            if (vehicle.rpm < vehicle.physics.downshiftRPM && utils.data.currentGear > 0) utils.data.currentGear--;
            const ratio = vehicle.physics.gearRatios[utils.data.currentGear];
            if (utils.data.throttle) {
              utils.data.lastThrottle = time;
              if (utils.data.timeOfGas == null) utils.data.timeOfGas = time;
              const engineTime = time - utils.data.timeOfGas;
              if (utils.data.isUsingKeyboard) engine = 0.2 + Math.min(engineTime * deltaTime * 0.03, 0.8);
              const engineForce = engine * vehicle.physics.engineForce * ratio * (utils.data.currentTransmission == "drive" ? -1 : utils.data.currentTransmission == "reverse" ? 1 : 0);
              if (vehicle.physics.drivetrain == "fwd") {
                vehicle.applyEngineForce(engineForce, 0);
                vehicle.applyEngineForce(engineForce, 1);
              } else if (vehicle.physics.drivetrain == "rwd") {
                vehicle.applyEngineForce(engineForce, 2);
                vehicle.applyEngineForce(engineForce, 3);
              } else if (vehicle.physics.drivetrain == "awd") {
                vehicle.applyEngineForce(engineForce, 0);
                vehicle.applyEngineForce(engineForce, 1);
                vehicle.applyEngineForce(engineForce, 2);
                vehicle.applyEngineForce(engineForce, 3);
              }
            } else {
              utils.data.timeOfGas = null;
              engine = 0;
            }
          },
          updatePhysics: function(deltaTime) {
            if (vehicle.mesh) {
              const velocity = vectors[5].copy(vehicle.chassisBody.velocity);
              const oldSpeed = vehicle.speed;
              vehicle.speed = velocity.length();
              vehicle.speedMPH = vehicle.speed * 2.236936;
              vehicle.acceleration = (vehicle.speed - oldSpeed) * deltaTime;
              vehicle.rpm = (vehicle.speed / (2 * Math.PI * vehicle.physics.wheelPhysics.radius)) * 60 * vehicle.physics.gearRatios[utils.data.currentGear] * vehicle.physics.finalDriveRatio;
              const dragForce = 0.5 * 1.225 * 0.32 * utils.physics.aerodynamicArea() * vehicle.speed * vehicle.speed * utils.physics.engineBrakeForce(vehicle.speed);
              const rollResistance = 0.012 * vehicle.physics.weight * 9.81;
              const resistance = dragForce + rollResistance;
              if (vehicle.speed > 0.1) {
                velocity.normalize();
                velocity.scale(-resistance, velocity);
                vehicle.body.applyForce(velocity, vehicle.body.position);
              }
              vehicle.mesh.position.copy(vehicle.body.position);
              vehicle.mesh.quaternion.copy(vehicle.body.quaternion);
              for (let i = 0; i < vehicle.wheelInfos.length; i++) {
                const wheel = vehicle.wheelInfos[i];
                vehicle.updateWheelTransform(wheel.index);
                wheel.body.position.copy(wheel.worldTransform.position);
                wheel.body.quaternion.copy(wheel.worldTransform.quaternion);
                wheel.mesh.position.copy(wheel.body.position);
                wheel.mesh.quaternion.copy(wheel.body.quaternion);
              }
              vehicle.parts.Shadow.position.set(vehicle.mesh.position.x, 0, vehicle.mesh.position.z);
              vehicle.parts.Shadow.rotation.z = vehicle.mesh.rotation.y - Math.PI / 2;
            }
          },
          updateView: function(deltaTime, time) {
            const view = vehicle.views[vehicle.currentView];
            camera.fov = 45 + (vehicle.currentVehicleSpeedKmHour / 20);
            if (vehicle.currentView == 0) {
              const oldRotation = eulers[1].copy(camera.rotation);
              const offsetX = Math.min(vehicle.speed * vehicle.body.angularVelocity.y / 300, 0.2);
              const offsetZ = -Math.min(Math.abs(vehicle.currentVehicleSpeedKmHour) / 1000, 0.01);
              camera.position.copy(vehicle.mesh.position);
              camera.rotation.copy(vehicle.mesh.rotation);
              camera.translateX(view[0] + offsetX);
              camera.translateY(view[1]);
              camera.translateZ(view[2] + offsetZ);
              camera.rotation.copy(oldRotation);
              camera.rotation.y += vehicle.mesh.rotation.y - utils.data.lastVehicleRotationY;
              utils.data.lastVehicleRotationY = vehicle.mesh.rotation.y;
              if (utils.data.allowedToUseControls) {
                TouchControls.isLocked = true;
                if (document.pointerLockElement != null && vehicle.currentView == 0) {
                  PointerControls.isLocked = true;
                } else {
                  PointerControls.isLocked = false;
                }
              }
            } else if (vehicle.currentView == 1) {
              if (utils.data.allowedToUseControls) {
                camera.position.copy(vehicle.mesh.position);
                if (GamepadControls.lookingDirection) {
                  camera.rotation.set(vehicle.mesh.rotation.x, vehicle.mesh.rotation.y + (GamepadControls.lookingDirection == "left" ? -Math.PI / 2 : Math.PI / 2), vehicle.mesh.rotation.z);
                } else {
                  const rotateAmount = utils.data.initialViewSwitch ? 1 : Math.min(deltaTime * 5, 0.4);
                  const targetQuaternion = quaternions[1].copy(vehicle.mesh.quaternion);
                  quaternions[2].setFromAxisAngle(vectors[14], view[3]);
                  targetQuaternion.multiply(quaternions[2]);
                  quaternions[2].setFromAxisAngle(vectors[15], view[4]);
                  targetQuaternion.multiply(quaternions[2]);
                  quaternions[2].setFromAxisAngle(vectors[16], view[5]);
                  targetQuaternion.multiply(quaternions[2]);
                  camera.quaternion.slerp(targetQuaternion, rotateAmount);
                }
                camera.translateX(view[0]);
                camera.translateY(view[1]);
                camera.translateZ(view[2]);
                PointerControls.isLocked = false;
                TouchControls.isLocked = false;
              }
            } else {
              camera.position.copy(vehicle.mesh.position);
              camera.rotation.set(0, vehicle.mesh.rotation.y, 0);
              camera.translateX(view[0]);
              camera.translateY(view[1]);
              camera.translateZ(view[2]);
              camera.rotateX(view[3]);
              camera.rotateY(view[4]);
              camera.rotateZ(view[5]);
              PointerControls.isLocked = false;
              TouchControls.isLocked = false;
            }
            utils.data.initialViewSwitch = false;
            camera.near = 0.05;
            camera.updateProjectionMatrix();
          },
          updateLights: function(time) {
            if (utils.data.blinker) {
              if (time - utils.data.lastBlinker > 350) {
                utils.data.lastBlinker = time;
                if (utils.vehicle.lightsInUse[utils.data.blinker]) {
                  utils.vehicle.setLights(false, utils.data.blinker);
                  utils.vehicle.setInstruments(false, "Blinker");
                } else {
                  utils.vehicle.setLights(true, utils.data.blinker);
                  utils.vehicle.setInstruments(true, "Blinker");
                  sounds.blinker();
                }
              }
            }
          },
          updateControls: function() {
            const cameraRotation = vehicle.mesh.rotation.y - camera.rotation.y;
            const preRotation = cameraRotation - (cameraRotation > Math.PI ? 6.2 : 0);
            const finalRotation = preRotation < -Math.PI ? preRotation + Math.PI * 2 : preRotation;
            for (controlName in vehicle.controls) {
              const control = vehicle.controls[controlName];
              if (finalRotation < control.bounds[0] && finalRotation > control.bounds[1] && camera.rotation.x < control.bounds[2] && camera.rotation.x > control.bounds[3]) {
                if (!control.hovering) {
                  control.hovering = true;
                  vehicle.parts[controlName].material.emissive.setHex(0x0b48c1);
                  vehicle.currentControl = controlName;
                }
              } else {
                if (control.hovering) {
                  control.hovering = false;
                  vehicle.parts[controlName].material.emissive.setHex(0x000000);
                  if (vehicle.currentControl == controlName) vehicle.currentControl = null;
                }
              }
            }
            if (vehicle.currentView == 0) {
              if (typeof vehicle.parts.Instrument_Speedometer !== "undefined" && frameCount % 5 == 0) {
                const canvas = vehicle.parts.Instrument_Speedometer.canvas;
                const ctx = canvas.ctx;
                ctx.clearRect(0, 0, 256, 256);
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 250px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(Math.round(vehicle.speedMPH).toString(), canvas.width / 2, canvas.height / 2);
                vehicle.parts.Instrument_Speedometer.material.map.needsUpdate = true;
              }
              if (finalRotation > 0) {
                let offset = Math.min(-(finalRotation - Math.PI) / 10, 0.2);
                camera.translateZ(offset);
                camera.translateX(offset);
              } else if (finalRotation > -1.2) {
                let offset = -(finalRotation + 1.2) / 5;
                camera.translateZ(offset / 4);
                camera.translateX(offset);
              }
            }
          },
          updateEffects: function() {
            if (vehicle.sliding && vehicle.speed > 10) {
              const position = vectors[0].set(vehicle.mesh.position.x, 0, vehicle.mesh.position.z);
              const rotation = eulers[0].set(0, vehicle.mesh.rotation.y, 0);
              const decalMesh = new THREE.Mesh(new THREE.DecalGeometry(map.getObjectByName("Mesh_2_6"), position, rotation, vectors[1]), materials[0]);
              particles.dust(position, 3);
              scene.add(decalMesh);
              utils.scheduleObject(decalMesh, "tireMarks", 5000);
              sounds.tireSqueak();
            }
          },
          setLights: function(on, type = null) {
            const bloom_l = vehicle.parts.Light_Bloom;
            const bloom_r = vehicle.parts.Light_Bloom1;
            if (type == "brake") {
              if (on) {
                vehicle.parts.Brake_Lights.material.emissive.setHex(0xff0000);
                bloom_l.visible = true;
                bloom_l.material.opacity = 0.2;
                bloom_l.material.color.setHex(0xffaaaa);
                bloom_r.visible = true;
                bloom_r.material.opacity = 0.2;
                bloom_r.material.color.setHex(0xffaaaa);
              } else {
                vehicle.parts.Brake_Lights.material.emissive.setHex(0x000000);
                if (utils.vehicle.lightsInUse["blinker_r"]) {
                  bloom_l.visible = false;
                } else if (utils.vehicle.lightsInUse["blinker_l"]) {
                  bloom_r.visible = false;
                }
              }
            } else if (type == "reverse") {
              if (on) {
                vehicle.parts.Reverse_Lights.visible = true;
                vehicle.parts.Reverse_Lights.material.opacity = 0.5;
                bloom_l.visible = true;
                bloom_l.material.opacity = 0.3;
                bloom_l.material.color.setHex(0xffffdd);
                bloom_r.visible = true;
                bloom_r.material.opacity = 0.3;
                bloom_r.material.color.setHex(0xffffdd);
              } else {
                vehicle.parts.Reverse_Lights.visible = false;
              }
            } else if (type == "blinker_l") {
              if (on) {
                vehicle.parts.Blinker_L.visible = true;
                bloom_l.visible = true;
                bloom_l.material.opacity = 0.4;
                bloom_l.material.color.setHex(0xffffff);
              } else {
                vehicle.parts.Blinker_L.visible = false;
              }
            } else if (type == "blinker_r") {
              if (on) {
                vehicle.parts.Blinker_R.visible = true;
                bloom_r.visible = true;
                bloom_r.material.opacity = 0.4;
                bloom_r.material.color.setHex(0xffffff);
              } else {
                vehicle.parts.Blinker_R.visible = false;
              }
            }
            if (on) {
              utils.vehicle.lightsInUse[type] = true;
            } else {
              utils.vehicle.lightsInUse[type] = false;
              let lightsOn = 0;
              for (light in utils.vehicle.lightsInUse) {
                if (type == null) {
                  utils.vehicle.setLights(false, light);
                } else if (utils.vehicle.lightsInUse[light]) utils.vehicle.setLights(true, light), lightsOn++;
              }
              if (lightsOn <= 0) bloom_l.visible = false, bloom_r.visible = false;
            }
          },
          setInstruments: function(on, instrument = null) {
            if (instrument == null) {
              vehicle.model.traverse(child => {
                if (child.name.startsWith("Instrument_")) child.visible = on;
              });
              if (typeof vehicle.parts.Instrument_Speedometer !== "undefined" && !vehicle.parts.Instrument_Speedometer.canvas) {
                vehicle.parts.Instrument_Speedometer.canvas = document.createElement("canvas");
                vehicle.parts.Instrument_Speedometer.canvas.ctx = vehicle.parts.Instrument_Speedometer.canvas.getContext("2d");
                vehicle.parts.Instrument_Speedometer.canvas.width = 256;
                vehicle.parts.Instrument_Speedometer.canvas.height = 256;
                const texture = new THREE.CanvasTexture(vehicle.parts.Instrument_Speedometer.canvas);
                vehicle.parts.Instrument_Speedometer.material.map = texture;
                texture.needsUpdate = true;
                utils.vehicle.setInstruments(true, "Speedometer");
              }
            } else {
              vehicle.parts["Instrument_" + instrument].visible = on;
            }
          },
          dentExterior: function(exterior, point, normal, power) {
            exterior.geometry.computeVertexNormals();
            const localPoint = exterior.worldToLocal(vectors[2].copy(point));
            const localNormal = vectors[3].copy(normal).transformDirection(exterior.matrixWorld).normalize();
            const vertex = vectors[4].set(0, 0, 0);
            for (let i = 0; i < exterior.geometry.attributes.position.count; i++) {
              vertex.fromBufferAttribute(exterior.geometry.attributes.position, i);
              const dist = vertex.distanceTo(localPoint);
              if (dist > 1.6) continue;
              const offset = 1 - dist / (1.6 + power / 30);
              vertex.addScaledVector(localNormal, -(0.1 - (Math.random() / (10 - power / 30))) * offset);
              exterior.geometry.attributes.position.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            exterior.geometry.attributes.position.needsUpdate = true;
            exterior.geometry.computeVertexNormals();
            exterior.geometry.computeBoundingSphere();
          }
        },
        physics: {
          engineBrakeForce: function(v) {
            return v < 2.5 ? 30 : 1;
          },
          aerodynamicArea: function() {
            return vehicle.currentVehicleSpeedKmHour < 0 ? vehicle.physics.rearArea : vehicle.physics.frontArea;
          },
          calculateHeadingReset: function(a, v) {
            const resetStrength = 0.6;
            const maxResetRate = Math.min(Math.max(v, 15), 30);
            let correctionAngularVelocity = -resetStrength * a * v;
            if (correctionAngularVelocity > maxResetRate) correctionAngularVelocity = maxResetRate;
            if (correctionAngularVelocity < -maxResetRate) correctionAngularVelocity = -maxResetRate;
            return correctionAngularVelocity / 30;
          }
        },
        map: {
          trafficCone: null,
          trafficCones: [],
          propCars: [],
          collisionMap: [],
          levelCollisionMap: [],
          currentSkyType: null,
          lensflare: new THREE.Lensflare(),
          initialize: function() {
            new THREE.GLTFLoader(loadingManager).load("models/levels/main.glb", function(model) {
              map = model.scene;
              utils.map.trafficCone = map.getObjectByName("Traffic_Cone");
              const cars = map.getObjectByName("PropCars").children;
              for (let i = cars.length - 1; i >= 0; i--) {
                const car = cars[i];
                car.position.set(300, 0, 17);
                car.rotation.set(-Math.PI / 2 - 0.05, 0, -Math.PI / 2);
                car.scale.set(0.8, 0.8, 0.8);
                scene.add(car);
                propCars.push(car);
              }
              map.traverse(child => {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  child.material.metalness = 0.1;
                  child.material.roughness = 1;
                }
                if (child.name == "Plane009" || child.name == "vegetation_long_grass_04_0001" || child.name == "Mesh_2_6" || child.name == "Plane" || child.name == "NurbsPath") {
                  if (child.material.map) {
                    child.material.map.anisotropy = 4;
                    child.material.map.needsUpdate = true;
                  }
                }
              });
              scene.add(map);
              const collisionMap = map.getObjectByName("CollisionMap");
              collisionMap.traverse(child => {
                if (child.isMesh) {
                  eulers[2].copy(child.rotation);
                  child.rotation.set(0, 0, 0);
                  box3.setFromObject(child);
                  const size = box3.getSize(vectors[9].set(0, 0, 0));
                  const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(vectors[13].set(size.x / 2, size.y / 2, size.z / 2)), material: groundMaterial });
                  utils.map.collisionMap.push(body);
                  world.add(body);
                  child.rotation.copy(eulers[2]);
                  box3.setFromObject(child);
                  const worldPosition = box3.min.add(box3.max).divide(vectors[10]);
                  body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
                  body.quaternion.copy(child.quaternion);
                }
              });
              const textureLoader = new THREE.TextureLoader();
              utils.map.lensflare.addElement(new THREE.LensflareElement(textureLoader.load("/images/effects/lensflare/flare0.png"), 700, 0.0));
              utils.map.lensflare.addElement(new THREE.LensflareElement(textureLoader.load("/images/effects/lensflare/flare1.png"), 200, 0.25));
              utils.map.lensflare.addElement(new THREE.LensflareElement(textureLoader.load("/images/effects/lensflare/flare3.png"), 60, 0.6));
              utils.map.lensflare.addElement(new THREE.LensflareElement(textureLoader.load("/images/effects/lensflare/hexangle.png"), 70, 1.0));
              map.remove(collisionMap);
              sky = new THREE.Mesh(new THREE.SphereGeometry(500, 25, 25), new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false }));
              sky.rotation.y = 2.2;
              scene.add(sky);
              utils.game.loadLevel(1);
            });
          },
          addPropCar: function(x, y, z, ry, large = false) {
            const filteredPropCars = propCars.filter(car => {
              const carSize = box3.setFromObject(car).getSize(vectors[17]);
              return large ? carSize.x > 8 : carSize.x < 8 && carSize.z < 8;
            });
            const propCarMesh = filteredPropCars[Math.floor(Math.random() * filteredPropCars.length)].clone();
            const propCar = new THREE.Group();
            propCar.add(propCarMesh);
            propCarMesh.position.set(0, 0, 0);
            propCarMesh.rotation.set(0, 0, 0);
            propCarMesh.scale.set(0.65, 0.65, 0.65);
            propCarMesh.position.sub(box3.setFromObject(propCarMesh).getCenter(vectors[17].set(0, 0, 0)));
            const size = box3.setFromObject(propCar).getSize(vectors[17]);
            const body = new CANNON.Body({ mass: large ? 1000 : 200, shape: new CANNON.Box(new CANNON.Vec3((size.x / 2) - 0.3, (size.y / 2) - 0.3, size.z / 2)) });
            body.position.set(x, (size.z / 2) + .1, z);
            body.quaternion.setFromEuler(-Math.PI / 2, 0, ry);
            world.add(body);
            scene.add(propCar);
            const entry = { mesh: propCar, body: body };
            physicsBodies.push(entry);
            utils.map.propCars.push(entry);
          },
          removePropCar: function(propCar) {
            world.remove(propCar.body);
            scene.remove(propCar.mesh);
            physicsBodies.splice(physicsBodies.indexOf(propCar), 1);
            utils.map.propCars.splice(utils.map.propCars.indexOf(propCar), 1);
          },
          removeAllPropCars: function(propCar) {
            for (let i = utils.map.propCars.length - 1; i >= 0; i--) utils.map.removePropCar(utils.map.propCars[i]);
          },
          addTrafficCone: function(x, y, z) {
            let trafficCone = null;
            if (utils.map.trafficCone.used) {
              trafficCone = utils.map.trafficCone.clone();
            } else {
              utils.map.trafficCone.used = true;
              trafficCone = utils.map.trafficCone;
            }
            const body = new CANNON.Body({ mass: 2, shape: new CANNON.Box(vectors[21]) });
            body.position.set(x, y, z);
            world.add(body);
            scene.add(trafficCone);
            const entry = { mesh: trafficCone, body: body };
            physicsBodies.push(entry);
            utils.map.trafficCones.push(entry);
          },
          removeTrafficCone: function(trafficCone) {
            world.remove(trafficCone.body);
            scene.remove(trafficCone.mesh);
            physicsBodies.splice(physicsBodies.indexOf(trafficCone), 1);
            utils.map.trafficCones.splice(utils.map.trafficCones.indexOf(trafficCone), 1);
          },
          addDefaultTrafficCones: function() {
            for (let i = 0; i < 6; i++) utils.map.addTrafficCone(28, 1, 4 - (i * 2));
          },
          removeAllTrafficCones: function() {
            for (let i = utils.map.trafficCones.length - 1; i >= 0; i--) utils.map.removeTrafficCone(utils.map.trafficCones[i]);
          },
          useLevelAsMap: function() {
            const collisionMap = utils.game.parkingLot.getObjectByName("CollisionMap");
            collisionMap.traverse(child => {
              if (child.isMesh) {
                eulers[2].copy(child.rotation);
                child.rotation.set(0, 0, 0);
                box3.setFromObject(child);
                const size = box3.getSize(vectors[9].set(0, 0, 0));
                const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(vectors[13].set(size.x / 2, size.y / 2, size.z / 2)), material: groundMaterial });
                utils.map.levelCollisionMap.push(body);
                world.add(body);
                child.rotation.copy(eulers[2]);
                box3.setFromObject(child);
                const worldPosition = box3.min.add(box3.max).divide(vectors[10]);
                body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
                body.quaternion.copy(child.quaternion);
              }
            });
            utils.game.parkingLot.remove(collisionMap);
            utils.map.collisionMap.forEach(body => world.remove(body));
            scene.remove(map);
          },
          useDefaultMap: function() {
            utils.map.levelCollisionMap.forEach(body => world.remove(body));
            utils.map.levelCollisionMap = [];
            utils.map.collisionMap.forEach(body => world.add(body));
            scene.add(map);
          },
          setSky: function(type, callback) {
            if (type == utils.map.currentSkyType) return callback();
            utils.map.currentSkyType = type;
            sky.material.map = new THREE.TextureLoader().load("/images/skies/" + type + ".png");
            new THREE.TextureLoader().load("/images/skies/" + type + ".png", function(skyTexture) {
              sky.material.map = skyTexture;
              new THREE.TextureLoader().load("/images/skies/" + type + "_envmap.png", function(texture) {
                utils.vehicle.envMap = new THREE.PMREMGenerator(renderer).fromEquirectangular(texture).texture;
                scene.traverse(child => {
                  if (child.userData.useEnvMap) child.material.envMap = utils.vehicle.envMap;
                });
                renderer.render(scene, camera);
                callback();
              });
            });
          }
        },
        game: {
          parkingLot: null,
          currentLevel: null,
          currentLevelTrafficCones: [],
          levels: [
            { time: 30, spawnPoint: [-5,0,2,0,Math.PI/2,0] },
            { time: 25, spawnPoint: [-6,0,0,0,-Math.PI/2,0] },
            { time: 25, spawnPoint: [0,0,0,0,Math.PI/2,0] },
            { time: 20, spawnPoint: [-5,0,2,0,Math.PI/2,0] },
            { time: 15, spawnPoint: [7.5,0,9,0,-Math.PI/2,0], sky: 2, directionalLight: [0xf4e6bc, 0.1], ambientLight: [0xffbb55, 0.3] },
            { time: 25, spawnPoint: [10,0,1,0,-Math.PI/2,0] },
            { time: 25, spawnPoint: [18,0,1,0,-Math.PI/2,0] },
            { time: 20, spawnPoint: [8,0,0,0,-Math.PI/2,0] },
            { time: 15, spawnPoint: [.7,0,-3.5,0,0,0] },
            { time: 12, spawnPoint: [-8,0,-6,0,0,0], sky: 0 },
            { time: 20, spawnPoint: [11.5,0,-1,0,-Math.PI/2,0] },
            { time: 15, spawnPoint: [25,0,.85,0,-Math.PI/2,0] },
            { time: 15, spawnPoint: [-9,0,3,0,Math.PI/2,0] },
            { time: 20, spawnPoint: [-7,0,-1.3,0,-Math.PI/2,0], sky: 3, directionalLight: [0xf4e6bc, 1.6, [-50, 10, -5]], ambientLight: [0xffddaa, 0.4], lensflare: true },
            { time: 60, spawnPoint: [-7,0,-1.3,0,-Math.PI/2,0], sky: 4, directionalLight: [0xf4e6bc, 0], ambientLight: [0xff6600, 0.02], lightPoles: true }
          ],
          loadLevel: function(level) {
            const levelData = utils.game.levels[level - 1];
            utils.data.isBonusLevel = level % 5 == 0;
            function next() {
              for (key in keyStates) keyStates[key] = false;
              utils.game.controls.stopBrake();
              utils.data.currentHeading = 0;
              utils.game.controls.shift("drive");
              vehicle.body.velocity.set(0, 0, 0);
              vehicle.body.angularVelocity.set(0, 0, 0);
              const spawnPoint = levelData.spawnPoint;
              vehicle.body.position.set(spawnPoint[0], spawnPoint[1] + vehicle.spawnHeight, spawnPoint[2]);
              vehicle.body.quaternion.setFromEuler(spawnPoint[3], spawnPoint[4], spawnPoint[5]);
              utils.game.parkingLot.traverse(child => child.name.includes("Traffic_Cone") && utils.map.addTrafficCone(child.position.x, child.position.y, child.position.z));
              if (swal.getState().isOpen) swal.close();
              document.querySelector(".loading").style.opacity = 0;
              utils.game.startTimer();
              utils.data.allowedToUseControls = true;
              utils.data.initialViewSwitch = true;
              PointerControls.isLocked = false;
            }
            utils.map.removeAllTrafficCones();
            if (!utils.data.isBonusLevel || level == 15) utils.map.addDefaultTrafficCones();
            if (users.loggedIn && settings.performance.replay && utils.data.replayFrames.length > 0) {
              if (level == utils.game.currentLevel) {
                utils.data.replayFrames.push([]);
              } else if (level != 1) {
                let entry = {
                  chosenVehicle: chosenVehicle,
                  propCars: utils.map.propCars.map(car => propCars.indexOf(propCars.filter(x => x.name == car.mesh.children[0].name)[0])),
                  frames: utils.data.replayFrames,
                  date: new Date().toLocaleString()
                };
                if (utils.game.currentLevel == 1) users.set("gameClips", {});
                users.data.gameClips["Level " + utils.game.currentLevel] = btoa(JSON.stringify(entry));
                users.set("gameClips", users.data.gameClips);
                utils.data.replayFrames = [];
              }
            }
            if (level == utils.game.currentLevel) return next();
            utils.map.removeAllPropCars();
            previousProgress = 0;
            document.querySelector(".loading").style.opacity = 1;
            document.querySelector(".progress-bar").style.width = "";
            utils.game.currentLevel = level;
            utils.data.realLevel = utils.game.currentLevel - Math.floor(utils.game.currentLevel / 5);
            const levelModel = level == 15 ? "lvl13" : utils.data.isBonusLevel ? "bonus" + (level / 5) : "lvl" + utils.data.realLevel;
            new THREE.GLTFLoader(loadingManager).load("models/levels/" + levelModel + ".glb", function(model) {
              if (utils.game.parkingLot != null) scene.remove(utils.game.parkingLot);
              utils.game.parkingLot = model.scene;
              utils.game.parkingLot.spots = {};
              utils.game.parkingLot.traverse(child => {
                if (utils.data.isBonusLevel && child.material && child.material.map) child.material.map.anisotropy = 4, child.material.map.needsUpdate = true;
                if ((child.name.includes("Lines") || child.name.includes("RoadMarks")) && child.material.map) {
                  child.material.map.anisotropy = 16;
                  child.material.map.needsUpdate = true;
                } else if (child.name.includes("PropCar")) {
                  utils.map.addPropCar(child.position.x, child.position.y, child.position.z, child.rotation.y, child.userData.large);
                } else if (child.name.includes("Parking_Spot")) {
                  const type = child.name.split("_").pop();
                  utils.game.parkingLot.spots[type] = {
                    type: type,
                    corners: {},
                    lines: child.children.filter(x => x.name.includes("Lines"))[0]
                  };
                  child.traverse(child => {
                    if (child.name.startsWith("Marker_")) utils.game.parkingLot.spots[type].corners[child.name.split("_")[1].toLowerCase()] = child.position;
                  });
                }
              });
              if (level == 15) {
                utils.map.useDefaultMap();
                document.title = "Parking Master 5.0 · Final Level";
              } else if (utils.data.isBonusLevel) {
                utils.map.useLevelAsMap();
                document.title = "Parking Master 5.0 · Bonus Level";
              } else {
                utils.map.useDefaultMap();
                document.title = "Parking Master 5.0 · Level " + utils.data.realLevel;
              }
              scene.add(utils.game.parkingLot);
              if (levelData.directionalLight) {
                directionalLight.color.setHex(levelData.directionalLight[0]);
                directionalLight.intensity = levelData.directionalLight[1];
                if (typeof levelData.directionalLight[2] === "undefined") {
                  directionalLight.position.set(-40, 50, 0);
                } else {
                  directionalLight.position.set(levelData.directionalLight[2][0], levelData.directionalLight[2][1], levelData.directionalLight[2][2]);
                }
                ambientLight.color.setHex(levelData.ambientLight[0]);
                ambientLight.intensity = levelData.ambientLight[1];
                if (levelData.lensflare) {
                  directionalLight.add(utils.map.lensflare);
                } else {
                  directionalLight.remove(utils.map.lensflare);
                }
                if (levelData.lightPoles) {
                  const light1 = new THREE.PointLight(0xff6600);
                  light1.distance = 15;
                  light1.position.set(0, 10, -6);
                  const light2 = light1.clone();
                  const light3 = light1.clone();
                  light2.position.x = 20;
                  light3.position.x = -20;
                  scene.add(light1);
                  scene.add(light2);
                  scene.add(light3);
                }
              } else {
                directionalLight.color.setHex(0xf4e6bc);
                directionalLight.intensity = 1.6;
                directionalLight.position.set(-40, 50, 0);
                ambientLight.color.setHex(0xefe1a7);
                ambientLight.intensity = 0.4;
                directionalLight.remove(utils.map.lensflare);
              }
              renderer.shadowMap.needsUpdate = true;
              let sky = levelData.sky || 1;
              if (typeof levelData.sky !== "undefined") sky = levelData.sky;
              utils.map.setSky(sky, function() {
                setTimeout(next, 500);
                if (level == 1) utils.game.start();
              });
            });
          },
          gameOver: function(reason = "crash") {
            if (!utils.data.allowedToUseControls) return;
            utils.data.allowedToUseControls = false;
            if (document.exitPointerLock) document.exitPointerLock();
            PointerControls.isLocked = false;
            TouchControls.isLocked = false;
            utils.game.controls.stopThrottle();
            utils.game.controls.brake();
            sounds.stopTimeLow();
            if (utils.game.currentLevel == 15) {
              if (reason == "time" && utils.data.finalParkingSpotCount >= 4) {
                let content = document.createElement("div");
                if (utils.data.finalParkingSpotCount <= 4) {
                  content.innerHTML = `
                  <div class="prize-card" data-prize="car.Toyota_RAV4" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/cars/Toyota_RAV4.png); background-size: 200%;"></div>
                  <div class="prize-card" data-prize="pts.500" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/500pts.png)"></div>
                  `;
                } else if (utils.data.finalParkingSpotCount <= 5) {
                  content.innerHTML = `
                  <div class="prize-card" data-prize="car.Toyota_RAV4" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/cars/Toyota_RAV4.png); background-size: 200%;"></div>
                  <div class="prize-card" data-prize="pts.1000" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/1000pts.png)"></div>
                  ${users.loggedIn ? `<div class="prize-card" data-prize="license" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/license.png)"></div>` : ""}
                  `;
                } else {
                  content.innerHTML = `
                  <div class="prize-card" data-prize="car.Ford_F150" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/cars/Ford_F150.png); background-size: 200%;"></div>
                  <div class="prize-card" data-prize="pts.1000" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/1000pts.png)"></div>
                  ${users.loggedIn ? `<br>
                  <div class="prize-card" data-prize="license" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/license.png)"></div>` : ""}
                  <div class="prize-card" data-prize="mystery" onclick='utils.data.chosenPrize = this.dataset.prize, swal.close()' style="background-image: url(/images/mystery.png)"></div>
                  `;
                }
                swal({
                  title: "You won!",
                  text: "You made it through every level! Click 'Next' to choose your prize.",
                  button: "Next",
                  closeOnClickOutside: false,
                  closeOnEsc: false,
                  closeOnEnterKey: false,
                  closeOnSpaceKey: false
                }).then(function() {
                  swal({
                    text: "Choose your prize:",
                    content: content,
                    button: false,
                    closeOnClickOutside: false,
                    closeOnEsc: false,
                    closeOnEnterKey: false,
                    closeOnSpaceKey: false
                  }).then(function() {
                    function next(animation = false) {
                      let content = document.createElement("div");
                      let prizeType = utils.data.chosenPrize.split(".")[0];
                      let button = "Claim";
                      if (prizeType == "car") {
                        let car = utils.data.chosenPrize.split(".")[1];
                        content.innerHTML = `
                        <img src="/images/cars/${car}.png" class="prize" style="border-radius: 10px; border-bottom: 5px solid gold">
                        <p>${utils.vehicle.vehicleNames[car]}</p>
                        `;
                      } else if (prizeType == "pts") {
                        let points = utils.data.chosenPrize.split(".")[1];
                        utils.data.moneyText = "$" + (points * 100);
                        utils.scheduleObject({}, "moneyText", 2000);
                        content.innerHTML = `
                        <img src="/images/${points}pts.png" class="prize">
                        `;
                      } else if (prizeType == "license") {
                        content.innerHTML = `
                        <p>Parking Master 5.0 License</p>
                        <div class="spinner"></div>
                        <img class="prize" style="display: none">
                        <p>This license displays that you made it through every level of Parking Master 5.0. It can be viewed at any time from your profile.</p>
                        `;
                        utils.game.generateLicense(function(src) {
                          content.querySelector("img").src = src;
                          content.querySelector("img").style.display = "";
                          content.querySelector(".spinner").style.display = "none";
                        });
                      } else if (prizeType == "mystery") {
                        button = false;
                        let displayIndex = 0;
                        let displayItems = {
                          "car.Toyota_RAV4": `<img src="/images/cars/Toyota_RAV4.png" class="prize">`,
                          "car.Ford_F150": `<img src="/images/cars/Ford_F150.png" class="prize">`,
                          "license": `<img src="/images/cars/license_template.png" class="prize">`,
                          "pts.500": `<img src="/images/500pts.png" class="prize">`,
                          "pts.1000": `<img src="/images/1000pts.png" class="prize">`,
                          "pts.2000": `<img src="/images/2000pts.png" class="prize">`
                        };
                        if (users.loggedIn) {
                          utils.game.generateLicense(function(src) {
                            displayItems["license"] = `<img src="${src}" class="prize">`;
                          });
                        } else {
                          delete displayItems["license"];
                        }
                        let lastDisplay = Date.now();
                        let displayI = 0;
                        let picker = setInterval(() => {
                          let time = Date.now();
                          if (time - lastDisplay > 50 + (displayI * 20)) {
                            lastDisplay = time;
                            displayI++;
                            if (displayIndex >= Object.keys(displayItems).length) displayIndex = 0;
                            let item = Object.values(displayItems)[displayIndex];
                            let itemType = Object.keys(displayItems)[displayIndex];
                            content.innerHTML = item;
                            if (displayI > 20 + Math.floor(Math.random() * 15)) {
                              utils.data.chosenPrize = itemType;
                              next(true);
                              return clearInterval(picker);
                            }
                            displayIndex++;
                          }
                        });
                      }
                      if (utils.data.chosenPrize.split(".")[0] == "car") {
                        if (users.loggedIn) {
                          if (users.data.cars.indexOf(utils.data.chosenPrize.split(".")[1]) > -1) {
                            utils.data.chosenPrize = "pts.500";
                          }
                        } else {
                          utils.data.chosenPrize = "pts.500";
                        }
                      }
                      if (!users.loggedIn && utils.data.chosenPrize.split(".")[0] == "license") {
                        utils.data.chosenPrize = "pts.500";
                      }
                      swal({
                        title: "You won:",
                        content: content,
                        button: button,
                        closeOnClickOutside: false,
                        closeOnEsc: false,
                        closeOnEnterKey: false,
                        closeOnSpaceKey: false
                      }).then(function() {
                        let prizeType = utils.data.chosenPrize.split(".")[0];
                        let prizeValue = utils.data.chosenPrize.split(".")[1];
                        if (prizeType == "car") {
                          let newCars = users.data.cars;
                          newCars.push(prizeValue);
                          users.set("cars", newCars);
                        } else if (prizeType == "pts") {
                          if (users.loggedIn) {
                            users.set("points", users.data.points + parseFloat(prizeValue));
                          } else {
                            localStorage.setItem("points", parseFloat(localStorage["points"]) + parseFloat(prizeValue));
                          }
                        } else if (prizeType == "license") {
                          users.set("license", content.querySelector("img").src);
                        }
                        let content1 = document.createElement("div");
                        content1.innerHTML = `
                        Thanks for playing Parking Master 5.0!
                        <br>
                        <br>
                        If you enjoyed this game, be sure to <a href="https://github.com/Parking-Master/Parking-Master-5.0" target="_blank" style="color:#ff0000">star this repository</a> on GitHub, and check out our other projects!
                        `;
                        swal({
                          icon: "/favicon.png",
                          content: content1,
                          button: "Main Menu",
                          closeOnClickOutside: false,
                          closeOnEsc: false,
                          closeOnEnterKey: false,
                          closeOnSpaceKey: false
                        }).then(function() {
                          location.replace("/");
                        });
                      });
                      if (animation) content.querySelector("img").style.animation = "prize .75s step-end infinite";
                    }
                    next();
                  });
                });
              } else {
                swal({
                  title: "Game over",
                  text: reason == "time" ? "You ran out of time!" : "You crashed!",
                  button: "Main Menu",
                  closeOnClickOutside: false,
                  closeOnEsc: false,
                  closeOnEnterKey: false,
                  closeOnSpaceKey: false
                }).then(function() {
                  location.replace("/");
                });
              }
            } else if (utils.data.isBonusLevel) {
              swal({
                text: "You didn't earn any bonus points.",
                button: "Next level ⤳",
                closeOnClickOutside: false,
                closeOnEsc: false,
                closeOnEnterKey: false
              }).then(function() {
                utils.game.resetCar();
                utils.game.loadLevel(utils.game.currentLevel + 1);
              });
            } else {
              swal({
                title: "Game over",
                text: reason == "crash" ? "You crashed!" : reason == "time" ? "You ran out of time!" : reason == "handicap" ? "You parked in a handicap spot. -10 Points." : "You parked in a danger spot.",
                buttons: ["Close", "Try again (10 pts)"],
                closeOnClickOutside: false,
                closeOnEsc: false,
                closeOnEnterKey: false,
                closeOnSpaceKey: false,
              }).then(function(e) {
                if (e) {
                  if (users.loggedIn) {
                    users.set("points", Math.max(parseInt(users.data.points) - 10, 0));
                  } else {
                    localStorage.setItem("points", Math.max(parseInt(localStorage["points"]) - 10, 0));
                  }
                  utils.game.resetLevel();
                } else {
                  location.replace("/");
                }
              });
              let points = 0;
              if (users.loggedIn) {
                points = users.data.points;
              } else {
                points = localStorage["points"];
              }
              if (points < 10) document.querySelector(".swal-button--confirm").disabled = "disabled";
            }
          },
          park: function() {
            let distances = [];
            let parkingSpot = utils.game.getParkingSpot();
            let lowestDistance, highestDistance;
            function getDistance(spotCorners = parkingSpot.corners) {
              for (corner in vehicle.corners) {
                const axis = vehicle.corners[corner].clone().applyQuaternion(vehicle.mesh.quaternion);
                const cornerPosition = vectors[18].copy(vehicle.mesh.position).add(axis);
                const cornerDistance = cornerPosition.distanceTo(spotCorners[corner]);
                distances.push(cornerDistance);
              }
              lowestDistance = Math.min(...distances);
              highestDistance = Math.max(...distances);
              if (highestDistance - lowestDistance > 0.8 || highestDistance > 2.5) {
                if (spotCorners == parkingSpot.corners) {
                  distances = [];
                  return getDistance({ fl: parkingSpot.corners.rr, fr: parkingSpot.corners.rl, rl: parkingSpot.corners.fr, rr: parkingSpot.corners.fl });
                } else {
                  return false;
                }
              }
              return true;
            }
            if (!getDistance()) return Notiflix.Notify.failure("You are not in the parking spot."), false;
            const score = Math.round(Math.max(Math.min(((1 - (highestDistance - lowestDistance) * (1 / 0.7) / 1.4) * 10) + (Math.pow(utils.data.timeLeft / utils.data.levelTime, 5) * 5), 10), 0));
            if (utils.game.currentLevel != 15) {
              utils.data.allowedToUseControls = false;
              if (document.exitPointerLock) document.exitPointerLock();
              PointerControls.isLocked = false;
              TouchControls.isLocked = false;
            }
            let points = 1;
            let icon = null;
            let title = null;
            let text = "";
            if (utils.game.currentLevel == 15) {
              if (parkingSpot.parked) return false;
              parkingSpot.parked = true;
              parkingSpot.lines.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: .3 });
              utils.data.finalParkingSpotCount++;
              return Notiflix.Notify.success("Nice job! Now on to the next spot."), false;
            }
            if (parkingSpot.type == "defaultSpot") {
              let texts = ["Good job!", "Nice job!", "Great!", "Awesome!"];
              if (score < 5) {
                text = "Good";
              } else if (score < 10) {
                text = texts[Math.floor(Math.random() * texts.length)];
              } else {
                text = "Perfect!";
              }
              title = "10/10";
            } else if (parkingSpot.type == "blueSpot") {
              icon = "/images/bluespot.png";
              text = "You parked in a bluespot! You earned an extra point.";
              points = 2;
            } else if (parkingSpot.type == "specialSpot") {
              function useAlternative(hasBothCars) {
                icon = "/images/50pts.png";
                if (hasBothCars) {
                  text = "You earned 50 extra points!";
                } else {
                  text = "You earned 50 extra points!\n\nTo earn a free car, Log in or Sign up next time.";
                }
                points = 50;
              }
              let availableCars = ["Mini_Cooper", "Ford_Victoria"];
              if (users.loggedIn) {
                let hasBothCars = users.data.cars.indexOf(availableCars[0]) > -1 && users.data.cars.indexOf(availableCars[1]) > -1;
                if (hasBothCars) {
                  useAlternative(true);
                } else {
                  let chosenCar = availableCars[0];
                  if (users.data.cars.indexOf(chosenCar) > -1) {
                    chosenCar = availableCars[1];
                  }
                  icon = "/images/cars/" + chosenCar + ".png";
                  text = "You unlocked a new car! You can get in it after this game ends.\n\n" + utils.vehicle.vehicleNames[chosenCar];
                  points = 0;
                  let newCars = users.data.cars;
                  newCars.push(chosenCar);
                  users.set("cars", newCars);
                }
              } else {
                useAlternative(false);
              }
            } else if (parkingSpot.type == "handicapSpot") {
              if (users.loggedIn) {
                users.set("points", Math.max(parseInt(users.data.points) - 10, 0));
              } else {
                localStorage.setItem("points", Math.max(parseInt(localStorage["points"]) - 10, 0));
              }
              utils.data.allowedToUseControls = true;
              return utils.game.gameOver("handicap");
            } else if (parkingSpot.type == "mysterySpot") {
              let number = Math.floor(Math.random() * 10);
              if (number <= 5) {
                let texts = ["Good job!", "Nice job!", "Great!", "Awesome!"];
                if (score < 5) {
                  text = "Good";
                } else if (score < 10) {
                  text = texts[Math.floor(Math.random() * texts.length)];
                } else {
                  text = "Perfect!";
                }
                title = "10/10";
              } else if (number <= 7) {
                utils.data.allowedToUseControls = true;
                return utils.game.gameOver("danger");
              } else {
                icon = "/images/50pts.png";
                text = "You earned 50 extra points!";
                points = 50;
              }
            } else if (parkingSpot.type == "dangerSpot") {
              utils.data.allowedToUseControls = true;
              return utils.game.gameOver("danger");
            }
            swal({
              icon: icon,
              title: title,
              text: text,
              button: "Next level ⤳",
              closeOnClickOutside: false,
              closeOnEsc: false,
              closeOnEnterKey: false
            }).then(function() {
              if (users.loggedIn) {
                users.set("points", Math.max(parseInt(users.data.points) + points, 0));
              } else {
                localStorage.setItem("points", Math.max(parseInt(localStorage["points"]) + points, 0));
              }
              utils.game.loadLevel(utils.game.currentLevel + 1);
              if (document.querySelector(".swal-icon img")) document.querySelector(".swal-icon img").style = "";
            });
            if (title) document.querySelector(".swal-title").innerHTML = '<span style="color:#00aaff">' + score + '</span>/10';
            if (parkingSpot.type == "specialSpot" && points == 0) document.querySelector(".swal-icon img").style = "border-radius: 10px; width: 120px; border-bottom: 5px solid gold";
            sounds.success();
            sounds.stopTimeLow();
            document.querySelector(".loading").style.backgroundImage = "url(/images/loading-screens/" + Math.floor(Math.random() * 4) + ".png)";
            if (points > 0) {
              utils.data.moneyText = "$" + (points * 100);
              utils.scheduleObject({}, "moneyText", 2000);
            }
            return true;
          },
          getParkingSpot: function() {
            let closestSpot = null;
            let closestSpotDistance = null;
            for (type in utils.game.parkingLot.spots) {
              const arrayCorners = Object.values(utils.game.parkingLot.spots[type].corners);
              const distance = arrayCorners.reduce((a, b) => a.clone().add(b)).divide(vectors[19].set(arrayCorners.length, arrayCorners.length, arrayCorners.length)).distanceTo(vehicle.body.position);
              if (!closestSpot || distance < closestSpotDistance) {
                closestSpot = utils.game.parkingLot.spots[type];
                closestSpotDistance = distance;
              }
            }
            return closestSpot;
          },
          startTimer: function() {
            utils.data.countdown = false;
            utils.data.levelTime = utils.game.levels[utils.game.currentLevel - 1].time;
            utils.data.countdownTextEffect = 1;
            if (utils.game.currentLevel == 15) {
              document.querySelector(".ui").style.display = "none";
              let content = document.createElement("div");
              content.innerHTML = "Park in as many spots as you can in <span style='color:#dd0000'>60 seconds</span>. You need to successfully park in at least <span style='color:#dd0000'>4 spots</span> before the time runs out in order to win. The more spots you park in, the better your final reward will be. <span style='color:#dd0000'>NO RETRIES!</span>";
              swal({
                title: "Final Level",
                content: content,
                button: "Start",
                closeOnClickOutside: false,
                closeOnEsc: false,
                closeOnEnterKey: false,
                closeOnSpaceKey: false
              }).then(() => {
                document.querySelector(".ui").style.display = "block";
                utils.scheduleObject({}, "timerStart", 5000);
              });
            } else {
              utils.scheduleObject({}, "timerStart", 3000);
            }
          },
          resetCar: function() {
            vehicle.debris.forEach(x => (scene.remove(x.mesh), world.remove(x.body)));
            vehicle.parts.Exterior.geometry.dispose();
            vehicle.parts.Exterior.geometry = vehicle.originalExteriorGeometry.clone();
            vehicle.parts.Windows.material.map = null;
            vehicle.parts.Windows.material.emissive.setHex(0x000000);
            utils.game.controls.switchView(vehicle.currentView);
            utils.vehicle.setInstruments(false, "Airbag");
          },
          resetLevel: function() {
            utils.game.resetCar();
            utils.map.removeAllPropCars();
            utils.game.parkingLot.traverse(child => child.name.includes("PropCar") && utils.map.addPropCar(child.position.x, child.position.y, child.position.z, child.rotation.y, child.userData.large));
            utils.game.loadLevel(utils.game.currentLevel);
          },
          start: function() {
            updateSettings();
            renderer.shadowMap.needsUpdate = true;
            utils.game.controls.switchView(0);
            animate();
            sounds.startup();
            PointerControls.isLocked = false;
          },
          pause: function() {
            if (utils.data.paused) {
              utils.data.paused = false;
              let timePassed = Date.now() - utils.data.pausedTimestamp;
              utils.data.levelStartTime += timePassed;
              document.querySelector("#pause-menu").style.display = "none";
              sounds.resumeAll();
            } else {
              utils.data.paused = true;
              utils.data.pausedTimestamp = Date.now();
              updateSettings(false);
              document.querySelector("#pause-menu").style.display = "block";
              sounds.pauseAll();
              if (document.exitPointerLock) document.exitPointerLock();
            }
          },
          generateLicense: function(callback = () => {}) {
            const canvas = document.createElement("canvas");
            canvas.width = 500;
            canvas.height = 500;
            const ctx = canvas.getContext("2d");
            const template = new Image();
            template.src = "/images/license_template.png";
            template.onload = function() {
              ctx.drawImage(template, 0, 0, 500, 500);
              const profilePicture = new Image();
              profilePicture.crossOrigin = "anonymous";
              profilePicture.src = users.data.profilePicture;
              profilePicture.onload = function() {
                ctx.drawImage(profilePicture, 50, 180, 170, 170);
                ctx.fillStyle = "#000000";
                ctx.font = "12px Brittany";
                ctx.fillText(users.data.username, 290, 180);
                ctx.font = "12px Arial";
                ctx.fillText(new Date().toLocaleDateString(), 327, 218);
                callback(canvas.toDataURL());
              };
            };
          },
          controls: {
            switchView: function(view = null) {
              let newView = view == null ? vehicle.currentView + 1 : view;
              if (typeof vehicle.views[newView] == "undefined") newView = 0;
              if (newView == 0) {
                utils.data.lastVehicleRotationY = 0;
                camera.rotation.set(-0.1, Math.PI, 0);
                vehicle.parts.Interior.visible = true;
                vehicle.parts.Exterior.visible = false;
                vehicle.parts.Exterior_View.visible = false;
                vehicle.parts.Mirror_L.material.map = utils.vehicle.mirrorRenderTarget.texture;
                vehicle.parts.Mirror_L.material.envMap = null;
                vehicle.parts.Mirror_L.material.needsUpdate = true;
                vehicle.parts.Windows.material.opacity = 0.25;
                vehicle.parts.Windows.material.color.setHex(0x444455);
                vehicle.parts.Windows.material.depthWrite = false;
                utils.vehicle.backupRenderTarget.initialUpdate = true;
              } else {
                vehicle.parts.Interior.visible = false;
                vehicle.parts.Exterior.visible = true;
                vehicle.parts.Exterior_View.visible = true;
                vehicle.parts.Mirror_L.material.map = null;
                vehicle.parts.Mirror_L.material.envMap = utils.vehicle.envMap;
                vehicle.parts.Mirror_L.material.needsUpdate = true;
                vehicle.parts.Windows.material.opacity = 0.8;
                vehicle.parts.Windows.material.color.setHex(0x000000);
                vehicle.parts.Windows.material.depthWrite = true;
              }
              utils.data.initialViewSwitch = true;
              vehicle.currentView = newView;
            },
            brake: function(doSound = true) {
              if (utils.data.throttle) utils.game.controls.stopThrottle();
              utils.data.brake = true;
              utils.vehicle.setLights(true, "brake");
              if (doSound && (Date.now() - utils.data.lastThrottle < 500 || Math.floor(Math.random() * 4) == 0)) sounds.pedal();
            },
            stopBrake: function() {
              utils.data.brake = false;
              utils.vehicle.setLights(false, "brake");
            },
            throttle: function() {
              if (utils.data.brake) utils.game.controls.stopBrake();
              if (utils.data.currentTransmission != "park") utils.data.throttle = true;
            },
            stopThrottle: function() {
              utils.data.throttle = false;
            },
            leftBlinker: function() {
              utils.vehicle.setLights(false, "blinker_r");
              utils.vehicle.setInstruments(false, "Blinker");
              if (utils.data.blinker == "blinker_l") {
                utils.vehicle.setLights(false, "blinker_l");
                vehicle.parts.Lever_L.rotation.x = 0;
                utils.data.blinker = false;
                sounds.stopBlinker();
              } else {
                utils.data.blinker = "blinker_l";
                vehicle.parts.Lever_L.rotation.x = -0.3;
              }
              sounds.controlClick();
            },
            rightBlinker: function() {
              utils.vehicle.setLights(false, "blinker_l");
              utils.vehicle.setInstruments(false, "Blinker");
              if (utils.data.blinker == "blinker_r") {
                utils.vehicle.setLights(false, "blinker_r");
                vehicle.parts.Lever_L.rotation.x = 0;
                utils.data.blinker = false;
                sounds.stopBlinker();
              } else {
                utils.data.blinker = "blinker_r";
                vehicle.parts.Lever_L.rotation.x = 0.3;
              }
              sounds.controlClick();
            },
            stopBlinker: function() {
              utils.vehicle.setLights(false, utils.data.blinker);
              utils.vehicle.setInstruments(false, "Blinker");
              vehicle.parts.Lever_L.rotation.x = 0;
              utils.data.blinker = false;
              sounds.controlClick();
              sounds.stopBlinker();
            },
            shift: function(transmission, direction = null) {
              if (!transmission) {
                if (direction == "forward") {
                  if (utils.data.currentTransmission == "drive") {
                    transmission = "reverse";
                  } else if (utils.data.currentTransmission == "reverse") {
                    transmission = "park";
                  }
                } else {
                  if (utils.data.currentTransmission == "park") {
                    transmission = "reverse"
                  } else if (utils.data.currentTransmission == "reverse") {
                    transmission = "drive";
                  }
                }
              }
              if (transmission == "park" && vehicle.speed > 1) return Notiflix.Notify.warning("You're going too fast to park.");
              if (utils.data.isMobileGame) {
                Object.values(document.querySelector(".shifter-wrapper").children).forEach(element => element.style.color = "");
                document.querySelector(".shifter-button-" + transmission).style.color = "#ff0000";
              }
              if (transmission == utils.data.currentTransmission) return;
              if (utils.data.currentTransmission == "reverse") {
                utils.vehicle.setLights(false, "reverse");
                if (vehicle.hasControlScreen && vehicle.hasBackupCamera) {
                  utils.vehicle.setInstruments(false, "Backup_Camera");
                  vehicle.parts.Control_Screen.material.color.setHex(0x000000);
                  utils.scheduleObject(vehicle.parts.Control_Screen, "backupCameraOff", 500);
                }
              }
              if (transmission == "drive") {
                utils.data.currentTransmission = "drive";
                vehicle.parts.Shifter.rotation.x = 0;
                sounds.controlClick();
              } else if (transmission == "reverse") {
                utils.data.currentTransmission = "reverse";
                vehicle.parts.Shifter.rotation.x = 0.2;
                utils.vehicle.setLights(true, "reverse");
                utils.vehicle.backupRenderTarget.initialUpdate = true;
                if (vehicle.hasControlScreen && vehicle.hasBackupCamera) {
                  vehicle.parts.Control_Screen.material.color.setHex(0x000000);
                  utils.scheduleObject(vehicle.parts.Control_Screen, "backupCameraOn", 500);
                }
                sounds.controlClick();
              } else if (transmission == "park") {
                utils.data.currentTransmission = "park";
                vehicle.parts.Shifter.rotation.x = 0.4;
                sounds.controlClick();
                return utils.game.park();
              }
            },
            simplePark: function() {
              const transmission = utils.data.currentTransmission;
              const parked = utils.game.controls.shift("park");
              if (!parked) utils.game.controls.shift(transmission);
            }
          }
        },
        ui: {
          ctx: null,
          initialize: function() {
            const canvas = document.querySelector(".ui");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            utils.ui.ctx = canvas.getContext("2d");
          },
          update: function(deltaTime, time) {
            const ctx = utils.ui.ctx;
            if (utils.data.allowedToUseControls) utils.data.timeLeft = ((utils.data.levelTime * 1000) - (time - utils.data.levelStartTime)) / 1000;
            const minutesLeft = utils.data.timeLeft / 60;
            const secondsLeft = ("." + minutesLeft.toString().split(".")[1]) * 60;
            const formattedTime = `${Math.floor(minutesLeft)}:${("0" + Math.floor(secondsLeft)).slice(-2)}`;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            if (utils.game.currentLevel == 15 && !utils.data.countdown) return ctx.fillStyle = "#ffffff", ctx.font = "50px Toxigenesis", ctx.shadowColor = "#000000", ctx.shadowBlur = 1, ctx.textAlign = "center", ctx.fillText("Final Level", window.innerWidth / 2, window.innerHeight / 2);
            ctx.beginPath();
            ctx.fillStyle = "#ffffff";
            ctx.moveTo(170, window.innerHeight - 90);
            ctx.arc(90, window.innerHeight - 90, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowColor = "#000000";
            ctx.shadowBlur = 1;
            ctx.textAlign = "center";
            ctx.font = "30px Toxigenesis";
            ctx.fillText(Math.round(vehicle.speedMPH), 90, window.innerHeight - 86);
            ctx.font = "12px Toxigenesis";
            ctx.fillText("mph", 90, window.innerHeight - 74);
            ctx.fillText(utils.data.currentGear + 1, 90, window.innerHeight - 58);
            ctx.strokeStyle = "#ffffff";
            if (!utils.data.isMobileGame) {
              ctx.beginPath();
              ctx.moveTo(window.innerWidth - 50, window.innerHeight - 20);
              ctx.lineTo(window.innerWidth - 50, window.innerHeight - 140);
              ctx.lineTo(window.innerWidth - 20, window.innerHeight - 140);
              ctx.lineTo(window.innerWidth - 20, window.innerHeight - 20);
              ctx.lineTo(window.innerWidth - 50, window.innerHeight - 20);
              ctx.moveTo(window.innerWidth - 50, window.innerHeight - 112);
              ctx.lineTo(window.innerWidth - 40, window.innerHeight - 112);
              if (utils.data.currentTransmission != "park") ctx.fillText("P", window.innerWidth - 36, window.innerHeight - 108);
              ctx.moveTo(window.innerWidth - 50, window.innerHeight - 84);
              ctx.lineTo(window.innerWidth - 40, window.innerHeight - 84);
              if (utils.data.currentTransmission != "reverse") ctx.fillText("R", window.innerWidth - 36, window.innerHeight - 80);
              ctx.moveTo(window.innerWidth - 50, window.innerHeight - 56);
              ctx.lineTo(window.innerWidth - 40, window.innerHeight - 56);
              if (utils.data.currentTransmission != "drive") ctx.fillText("D", window.innerWidth - 36, window.innerHeight - 52);
              ctx.stroke();
              ctx.fillStyle = "#ff0000";
              if (utils.data.currentTransmission == "park") {
                ctx.fillText("P", window.innerWidth - 36, window.innerHeight - 108);
              } else if (utils.data.currentTransmission == "reverse") {
                ctx.fillText("R", window.innerWidth - 36, window.innerHeight - 80);
              } else if (utils.data.currentTransmission == "drive") {
                ctx.fillText("D", window.innerWidth - 36, window.innerHeight - 52);
              }
              ctx.fillStyle = "#ffffff";
            }
            if (utils.data.countdown) {
              if (utils.data.timeLeft <= 0) {
                if (utils.data.allowedToUseControls) utils.game.gameOver("time");
                ctx.font = "50px Toxigenesis";
                ctx.fillText("0:00", window.innerWidth / 2, 50 + 10);
              } else {
                const seconds = Math.floor(secondsLeft);
                if (minutesLeft < 1 && seconds <= 3 && utils.data.previousSeconds != seconds) {
                  utils.data.previousSeconds = seconds;
                  utils.data.countdownTextEffect = 1;
                  sounds.timeLow();
                }
                if (utils.data.countdownTextEffect) {
                  utils.data.countdownTextEffect /= 1.3;
                  ctx.font = `${50 / utils.data.countdownTextEffect}px Toxigenesis`;
                  ctx.fillStyle = `rgba(255, 255, 255, ${utils.data.countdownTextEffect})`;
                  ctx.fillText(formattedTime, window.innerWidth / 2, 50 + 10 + (10 / utils.data.countdownTextEffect));
                  if (utils.data.countdownTextEffect <= 0.03) utils.data.countdownTextEffect = 0;
                  ctx.fillStyle = "#ffffff";
                }
                ctx.font = "50px Toxigenesis";
                ctx.fillText(formattedTime, window.innerWidth / 2, 50 + 10);
              }
            } else {
              const minutes = utils.data.levelTime / 60;
              const seconds = ("." + minutes.toFixed(5).split(".")[1]) * 60;
              const levelTime = `${Math.floor(minutes)}:${("0" + Math.round(seconds)).slice(-2)}`;
              ctx.font = "50px Toxigenesis";
              ctx.fillText(levelTime, window.innerWidth / 2, 50 + 10);
            }
            ctx.font = "22px Toxigenesis";
            if (utils.game.currentLevel == 15) {
              ctx.fillText(utils.data.finalParkingSpotCount + "/4 Spots", window.innerWidth / 2, 90);
            } else if (utils.data.isBonusLevel) {
              ctx.fillText("Bonus Level", window.innerWidth / 2, 90);
            }
            ctx.textAlign = "left";
            ctx.fillStyle = "#dddddd";
            if (!utils.data.isBonusLevel) ctx.fillText("Level " + utils.data.realLevel, 20, window.innerHeight - 202);
            ctx.fillText((users.loggedIn ? users.data.points : localStorage["points"]) + " PTS", 20, window.innerHeight - 180);
            if (utils.data.moneyText) ctx.fillStyle = "#00ff00", ctx.fillText("+ " + utils.data.moneyText, 20, 50);
            ctx.restore();
          }
        }
      };

      const PointerControls = new PointerLockControls(camera, renderer.domElement);
      PointerControls.maxPolarAngle = Math.PI - 0.15;
      PointerControls.minPolarAngle = 0.15;
      PointerControls.pointerSpeed = 0.6;
      PointerControls.isLocked = false;
      const TouchControls = new TouchScreenControls(camera, renderer.domElement);
      TouchControls.isLocked = false;

      document.addEventListener("keydown", function(event) {
        if (!utils.data.allowedToUseControls) return;
        keyStates[event.key] = true;
        if (!event.repeat) {
          if (vehicle.currentView == 0 && vehicle.currentControl == "Shifter") {
            if (event.key == "ArrowUp") utils.game.controls.shift(null, "forward");
            if (event.key == "ArrowDown") utils.game.controls.shift(null, "backward");
          }
          if (event.key == "v") utils.game.controls.switchView();
          if (event.key == "b") utils.game.controls.brake();
          if (event.key == "ArrowUp" && vehicle.currentControl != "Shifter") utils.game.controls.throttle();
          if (event.key == "[") utils.game.controls.leftBlinker();
          if (event.key == "]") utils.game.controls.rightBlinker();
          if (event.key == "p") utils.game.controls.shift("park");
          if (event.key == "r") utils.game.controls.shift("reverse");
          if (event.key == "d") utils.game.controls.shift("drive");
          if (event.key == "Enter") event.preventDefault(), utils.game.controls.simplePark();
          if (event.key == " ") utils.game.pause();
        }
      });
      document.addEventListener("keyup", function(event) {
        if (!utils.data.allowedToUseControls) return;
        keyStates[event.key] = false;
        if (event.key == "b") utils.game.controls.stopBrake();
        if (event.key == "ArrowUp") utils.game.controls.stopThrottle();
      });
      document.addEventListener("mousedown", function(event) {
        if (utils.data.paused || !utils.data.allowedToUseControls || document.pointerLockElement != null || swal.getState().isOpen) return;
        document.body.requestPointerLock();
        PointerControls.lock();
      });
      document.addEventListener("mouseup", function(event) {
        if (utils.data.paused || !utils.data.allowedToUseControls || !PointerControls.isLocked) return;
        PointerControls.lock();
      });

      utils.ui.initialize();
      utils.vehicle.initialize();