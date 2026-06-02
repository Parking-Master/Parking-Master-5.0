let bursts = [];
let MAX_BURSTS = 20;
let dustGeometry, dustPoints, bloodGeometry, bloodPoints, explosionGeometry, explosionPoints, plasmaGeometry, plasmaPoints;

const noiseSize = 64;
const noiseData = new Uint8Array(noiseSize * noiseSize);
for (let i = 0; i < noiseSize * noiseSize; i++) {
  noiseData[i] = Math.random() * 255;
}
const noiseTexture = new THREE.DataTexture(noiseData, noiseSize, noiseSize, THREE.RedFormat);
noiseTexture.needsUpdate = true;

let dustMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader: `
    attribute float size;
    attribute vec3 customPosition;
    attribute float life;
    varying float vLife;
    
    void main() {
        vLife = life;
        vec4 pos = modelViewMatrix * vec4(customPosition, 1.0);
        gl_PointSize = size * 40.0 * (300.0 / -pos.z);
        gl_Position = projectionMatrix * pos;
    }`,
  fragmentShader: `
    varying float vLife;
    uniform sampler2D noiseTexture;
    
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      
      vec2 noiseCoord = gl_PointCoord * 4.0 + fract(vLife * 10.0);
      float noise = texture2D(noiseTexture, noiseCoord).r * 0.5 + 0.5;
      
      float alpha = 0.15 * vLife * noise * (1.0 - dist * 2.0);
      vec3 dustColor = vec3(0.7, 0.65, 0.6);
      gl_FragColor = vec4(dustColor, alpha);
    }`,
  transparent: true,
  blending: THREE.NormalBlending,
  depthWrite: false
});

let bloodMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader: `
    attribute float size;
    attribute vec3 customPosition;
    attribute float life;
    varying float vLife;
    
    void main() {
        vLife = life;
        vec4 pos = modelViewMatrix * vec4(customPosition, 1.0);
        gl_PointSize = size * 40.0 * (300.0 / -pos.z);
        gl_Position = projectionMatrix * pos;
    }`,
  fragmentShader: `
    varying float vLife;
    uniform sampler2D noiseTexture;
    
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      
      vec2 noiseCoord = gl_PointCoord * 4.0 + fract(vLife * 10.0);
      float noise = texture2D(noiseTexture, noiseCoord).r * 0.5 + 0.5;
      
      float alpha = 0.15 * vLife * noise * (1.0 - dist * 2.0) * 0.6;
      vec3 dustColor = vec3(0.4, 0.1, 0.1);
      gl_FragColor = vec4(dustColor, alpha);
    }`,
  transparent: true,
  blending: THREE.NormalBlending,
  depthWrite: false
});

let explosionMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    noiseTexture: { value: noiseTexture }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 customPosition;
    attribute float life;
    uniform float time;
    varying float vLife;
    varying float vAge;
    
    void main() {
      vLife = life;
      vAge = 1.0 - life;
      
      vec3 pos = customPosition;
      
      float risePhase = smoothstep(0.0, 0.1, vAge);
      float peakPhase = smoothstep(0.1, 0.15, vAge);
      float fadePhase = smoothstep(0.15, 1.0, vAge);
      
      pos.y += risePhase * 0.8;
      pos.z += risePhase * 0.6;
      
      float turbulence = sin(vAge * 8.0 + pos.x * 5.0 + pos.y * 3.0) * 0.1;
      pos.x += turbulence * risePhase;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      float sizeCurve = 0.0;
      sizeCurve += risePhase * 2.0;
      sizeCurve -= peakPhase * 1.5;
      sizeCurve *= (1.0 - fadePhase * 0.5);
      
      gl_PointSize = size * 45.0 * (300.0 / -mvPosition.z) * sizeCurve;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D noiseTexture;
    uniform float time;
    varying float vLife;
    varying float vAge;
    
    void main() {
      vec2 coord = gl_PointCoord - 0.5;
      float dist = length(coord);
      if (dist > 0.45) discard;
      
      float risePhase = smoothstep(0.0, 0.3, vAge);
      float peakPhase = smoothstep(0.3, 0.6, vAge);
      float fadePhase = smoothstep(0.6, 1.0, vAge);
      
      vec3 fireCore = vec3(1.2, 0.3, 0.1);
      vec3 fireEdge = vec3(1.0, 0.3, 0.05);
      vec3 smoke = vec3(0.2, 0.2, 0.25);
      
      vec3 color = mix(fireCore, fireEdge, dist);
      color = mix(color, smoke, fadePhase);
      
      vec2 noiseCoord = gl_PointCoord * 5.0 + vAge * 12.0;
      float noise = texture2D(noiseTexture, noiseCoord).r * 0.3 + 0.7;
      
      float alpha = vLife * (1.0 - dist * 1.8) * noise;
      alpha *= 1.0 - fadePhase * 0.3;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

let plasmaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    noiseTexture: { value: noiseTexture }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 customPosition;
    attribute float life;
    uniform float time;
    varying float vLife;
    varying float vAge;
    
    void main() {
      vLife = life;
      vAge = 1.0 - life;
      
      vec3 pos = customPosition;
      
      float risePhase = smoothstep(0.0, 0.1, vAge);
      float peakPhase = smoothstep(0.1, 0.15, vAge);
      float fadePhase = smoothstep(0.15, 1.0, vAge);
      
      pos.y += risePhase * 0.8;
      pos.z += risePhase * 0.6;
      
      float turbulence = sin(vAge * 8.0 + pos.x * 5.0 + pos.y * 3.0) * 0.1;
      pos.x += turbulence * risePhase;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      float sizeCurve = 0.0;
      sizeCurve += risePhase * 2.0;
      sizeCurve -= peakPhase * 1.5;
      sizeCurve *= (1.0 - fadePhase * 0.5);
      
      gl_PointSize = size * 80.0 * (300.0 / -mvPosition.z) * sizeCurve;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D noiseTexture;
    uniform float time;
    varying float vLife;
    varying float vAge;
    
    void main() {
      vec2 coord = gl_PointCoord - 0.5;
      float dist = length(coord);
      if (dist > 0.45) discard;
      
      float risePhase = smoothstep(0.0, 0.3, vAge);
      float peakPhase = smoothstep(0.3, 0.6, vAge);
      float fadePhase = smoothstep(0.6, 1.0, vAge);
      
      vec3 fireCore = vec3(0.1, 0.3, 1);
      vec3 fireEdge = vec3(0.05, 0.3, 1);
      vec3 smoke = vec3(0.5, 0.2, 0.7);
      
      vec3 color = mix(fireCore, fireEdge, dist);
      color = mix(color, smoke, fadePhase);
      
      vec2 noiseCoord = gl_PointCoord * 5.0 + vAge * 12.0;
      float noise = texture2D(noiseTexture, noiseCoord).r * 0.3 + 0.7;
      
      float alpha = vLife * (1.0 - dist * 1.8) * noise;
      alpha *= 1.0 - fadePhase * 0.3;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

particles = {
  dust: function(position, size = 1, life = 1) {
    const burst = { particles: [], material: dustMaterial };
    for (let i = 0; i < 20; i++) {
      const particle = {
        x: position.x + (Math.random() - 0.5) * 0.12,
        y: position.y + (Math.random() - 0.5) * 0.12,
        z: position.z + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.4) * 0.05,
        vz: (Math.random() - 0.4) * 0.06,
        life: 2 * life,
        maxLife: 2 * life,
        size: 0.01 + Math.random() * 0.015 * size
      };
      burst.particles.push(particle);
    }
    bursts.push(burst);
    if (bursts.length > MAX_BURSTS) {
      bursts.shift();
    }
  },
  blood: function(position) {
    const burst = { particles: [], material: bloodMaterial };
    for (let i = 0; i < 20; i++) {
      const particle = {
        x: position.x + (Math.random() - 0.5) * 0.12,
        y: position.y + (Math.random() - 0.5) * 0.12,
        z: position.z + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 0.012,
        vy: (Math.random() - 0.4) * 0.012,
        vz: (Math.random() - 0.4) * 0.012,
        life: 2.0,
        maxLife: 2.0,
        size: 0.001 + Math.random() * 0.015
      };
      burst.particles.push(particle);
    }
    bursts.push(burst);
    if (bursts.length > MAX_BURSTS) {
      bursts.shift();
    }
  },
  explosion: function(position, size = 1) {
    const burst = { particles: [], material: explosionMaterial };
    for (let i = 0; i < 80; i++) {
      const particle = {
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
        z: (position.z + Math.random() * 0.15) - 1,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: 0.15 + Math.random() * 0.2,
        life: 1.2,
        maxLife: 1.2,
        size: 0.02 + Math.random() * 0.04 * size
      };
      burst.particles.push(particle);
    }
    bursts.push(burst);
    if (bursts.length > MAX_BURSTS) {
      bursts.shift();
    }
  },
  plasma: function(position) {
    const burst = { particles: [], material: plasmaMaterial };
    for (let i = 0; i < 80; i++) {
      const particle = {
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
        z: (position.z + Math.random() * 0.15) - 1,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: 0.15 + Math.random() * 0.2,
        life: 1.2,
        maxLife: 1.2,
        size: 0.02 + Math.random() * 0.04
      };
      burst.particles.push(particle);
    }
    bursts.push(burst);
    if (bursts.length > MAX_BURSTS) {
      bursts.shift();
    }
  },
  update: function() {
    const now = performance.now();
    explosionMaterial.uniforms.time.value = now * 0.001;
    plasmaMaterial.uniforms.time.value = now * 0.001;
    for (let b = bursts.length - 1; b >= 0; b--) {
      const particles = bursts[b].particles;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.vz *= 0.92;
        p.vy -= 0.002;
        p.x += p.vx * 0.8;
        p.y += p.vy * 0.8;
        p.z += p.vz * 0.8;
        p.size *= 0.98;
        p.life -= 0.022;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
      if (particles.length === 0) {
        bursts.splice(b, 1);
      }
    }
    const dustParticles = [];
    const bloodParticles = [];
    const explosionParticles = [];
    const plasmaParticles = [];
    for (let b = 0; b < bursts.length; b++) {
      if (bursts[b].material === dustMaterial) {
        dustParticles.push(...bursts[b].particles);
      } else if (bursts[b].material === bloodMaterial) {
        bloodParticles.push(...bursts[b].particles);
      } else if (bursts[b].material === explosionMaterial) {
        explosionParticles.push(...bursts[b].particles);
      } else if (bursts[b].material === plasmaMaterial) {
        plasmaParticles.push(...bursts[b].particles);
      }
    }
    if (dustParticles.length > 0) {
      if (!dustGeometry || dustPoints === undefined) {
        dustGeometry = new THREE.BufferGeometry();
        dustPoints = new THREE.Points(dustGeometry, dustMaterial);
        dustPoints.frustumCulled = false;
        scene.add(dustPoints);
      }
      const positions = new Float32Array(dustParticles.length * 3);
      const sizes = new Float32Array(dustParticles.length);
      const lifeAttr = new Float32Array(dustParticles.length);
      for (let i = 0; i < dustParticles.length; i++) {
        const p = dustParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      dustGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      dustGeometry.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      dustGeometry.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      dustGeometry.attributes.position.needsUpdate = true;
      dustGeometry.attributes.size.needsUpdate = true;
      dustGeometry.attributes.customPosition.needsUpdate = true;
      dustGeometry.attributes.life.needsUpdate = true;
      dustGeometry.computeBoundingSphere();
    } else if (dustPoints) {
      scene.remove(dustPoints);
      dustGeometry.dispose();
      dustPoints.material.dispose();
      dustPoints = undefined;
      dustGeometry = undefined;
    }
    if (bloodParticles.length > 0) {
      if (!bloodGeometry || bloodPoints === undefined) {
        bloodGeometry = new THREE.BufferGeometry();
        bloodPoints = new THREE.Points(bloodGeometry, bloodMaterial);
        bloodPoints.frustumCulled = false;
        scene.add(bloodPoints);
      }
      const positions = new Float32Array(bloodParticles.length * 3);
      const sizes = new Float32Array(bloodParticles.length);
      const lifeAttr = new Float32Array(bloodParticles.length);
      for (let i = 0; i < bloodParticles.length; i++) {
        const p = bloodParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      bloodGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      bloodGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      bloodGeometry.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      bloodGeometry.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      bloodGeometry.attributes.position.needsUpdate = true;
      bloodGeometry.attributes.size.needsUpdate = true;
      bloodGeometry.attributes.customPosition.needsUpdate = true;
      bloodGeometry.attributes.life.needsUpdate = true;
      bloodGeometry.computeBoundingSphere();
    } else if (bloodPoints) {
      scene.remove(bloodPoints);
      bloodGeometry.dispose();
      bloodPoints.material.dispose();
      bloodPoints = undefined;
      bloodGeometry = undefined;
    }
    if (explosionParticles.length > 0) {
      if (!explosionGeometry || explosionPoints === undefined) {
        explosionGeometry = new THREE.BufferGeometry();
        explosionPoints = new THREE.Points(explosionGeometry, explosionMaterial);
        explosionPoints.frustumCulled = false;
        scene.add(explosionPoints);
      }
      const positions = new Float32Array(explosionParticles.length * 3);
      const sizes = new Float32Array(explosionParticles.length);
      const lifeAttr = new Float32Array(explosionParticles.length);
      for (let i = 0; i < explosionParticles.length; i++) {
        const p = explosionParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      explosionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      explosionGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      explosionGeometry.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      explosionGeometry.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      explosionGeometry.attributes.position.needsUpdate = true;
      explosionGeometry.attributes.size.needsUpdate = true;
      explosionGeometry.attributes.customPosition.needsUpdate = true;
      explosionGeometry.attributes.life.needsUpdate = true;
    } else if (explosionPoints) {
      scene.remove(explosionPoints);
      explosionGeometry.dispose();
      explosionPoints.material.dispose();
      explosionPoints = undefined;
      explosionGeometry = undefined;
    }
    if (plasmaParticles.length > 0) {
      if (!plasmaGeometry || plasmaPoints === undefined) {
        plasmaGeometry = new THREE.BufferGeometry();
        plasmaPoints = new THREE.Points(plasmaGeometry, plasmaMaterial);
        plasmaPoints.frustumCulled = false;
        scene.add(plasmaPoints);
      }
      const positions = new Float32Array(plasmaParticles.length * 3);
      const sizes = new Float32Array(plasmaParticles.length);
      const lifeAttr = new Float32Array(plasmaParticles.length);
      for (let i = 0; i < plasmaParticles.length; i++) {
        const p = plasmaParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      plasmaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      plasmaGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      plasmaGeometry.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      plasmaGeometry.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      plasmaGeometry.attributes.position.needsUpdate = true;
      plasmaGeometry.attributes.size.needsUpdate = true;
      plasmaGeometry.attributes.customPosition.needsUpdate = true;
      plasmaGeometry.attributes.life.needsUpdate = true;
    } else if (plasmaPoints) {
      scene.remove(plasmaPoints);
      plasmaGeometry.dispose();
      plasmaPoints.material.dispose();
      plasmaPoints = undefined;
      plasmaGeometry = undefined;
    }
  }
};