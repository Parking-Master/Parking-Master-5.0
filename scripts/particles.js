let bursts = [];
let MAX_BURSTS = 20;
let dustGeometry, dustPoints;
const noiseSize = 32;
const noiseData = new Uint8Array(noiseSize * noiseSize);
for (let i = 0; i < noiseSize * noiseSize; i++) noiseData[i] = Math.random() * 255;
const noiseTexture = new THREE.DataTexture(noiseData, noiseSize, noiseSize, THREE.RedFormat);
noiseTexture.needsUpdate = true;
let dustMaterial = new THREE.ShaderMaterial({
  uniforms: {
    noiseTexture: { value: noiseTexture }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 customPosition;
    attribute float life;
    varying float vLife;
    
    void main() {
        vLife = life;
        vec4 pos = modelViewMatrix * vec4(customPosition, 1.0);
        gl_PointSize = size * 0.5 * (300.0 / -pos.z);
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

particles = {
  dust: function(position, size = 1) {
    const burst = { particles: [], material: dustMaterial };
    for (let i = 0; i < 50; i++) {
      const particle = {
        x: position.x + (Math.random() - 0.5) * 1.2,
        y: position.y + (Math.random() - 0.5) * 1.2,
        z: position.z + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 0.5 * (size / 10),
        vy: (Math.random() - 0.1) * 0.5 * (size / 10),
        vz: (Math.random() - 0.5) * 0.5 * (size / 10),
        life: 2,
        maxLife: 2,
        size: Math.random() * size
      };
      burst.particles.push(particle);
    }
    bursts.push(burst);
    if (bursts.length > MAX_BURSTS) bursts.shift();
  },
  update: function() {
    const now = performance.now();
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
        if (p.life <= 0) particles.splice(i, 1);
      }
      if (particles.length === 0) bursts.splice(b, 1);
    }
    const dustParticles = [];
    for (let b = 0; b < bursts.length; b++) {
      dustParticles.push(...bursts[b].particles);
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
  }
};