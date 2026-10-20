(() => {
  const canvas = document.querySelector("#scene");
  const context = canvas.getContext("2d", { alpha: false });
  const width = 720;
  const height = 1280;
  const heartPath = new Path2D();
  const particles = [];
  const glints = [];
  const floatParticles = [];
  const burstParticles = [];
  const risingParticles = [];
  const currents = [];
  const smokePuffs = [];
  const particleLayer = document.createElement("canvas");
  particleLayer.width = width;
  particleLayer.height = height;
  const particleContext = particleLayer.getContext("2d");
  const particleGlowLayer = document.createElement("canvas");
  particleGlowLayer.width = width;
  particleGlowLayer.height = height;
  const particleGlowContext = particleGlowLayer.getContext("2d");
  const smokeLayer = document.createElement("canvas");
  smokeLayer.width = width / 2;
  smokeLayer.height = height / 2;
  const smokeContext = smokeLayer.getContext("2d");
  smokeContext.scale(0.5, 0.5);
  const random = (min, max) => min + Math.random() * (max - min);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactMode = window.matchMedia("(max-width: 700px)").matches
    || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
  const FLOAT_COUNT = compactMode ? 54 : 140;
  const HEART_PARTICLE_COUNT = compactMode ? 4600 : 9500;
  const GLINT_COUNT = compactMode ? 105 : 240;
  const RISING_COUNT = compactMode ? 150 : 360;
  const CURRENT_COUNT = compactMode ? 18 : 46;
  const SMOKE_COUNT = compactMode ? 28 : 105;
  const BURST_COUNT = compactMode ? 7 : 12;
  const BLUE_SHADES = [
    "#3b82f6", "#60a5fa", "#93c5fd",
    "#2563eb", "#bfdbfe", "#1d4ed8"
  ];

  heartPath.moveTo(360, 505.5);
  for (let step = 0; step <= 240; step++) {
    const angle = (step / 240) * Math.PI * 2;
    const x = 16 * Math.sin(angle) ** 3;
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle)
      - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    heartPath.lineTo(360 + x * 10.1, 574 - y * 11.4);
  }
  heartPath.closePath();

  const colors = ["#d8efff", "#278cff", "#55efff"];
  const particlePaths = colors.map(() => new Path2D());
  for (let i = 0; i < HEART_PARTICLE_COUNT; i++) {
    const x = random(105, 615);
    const y = random(325, 785);
    if (!particleContext.isPointInPath(heartPath, x, y)) continue;
    const size = random(0.55, 1.8);
    const color = Math.random() > 0.84 ? 2 : Math.random() > 0.36 ? 1 : 0;
    particlePaths[color].moveTo(x + size, y);
    particlePaths[color].arc(x, y, size, 0, Math.PI * 2);
    particles.push({ x, y, size, phase: random(0, Math.PI * 2), color });
  }

  particleContext.save();
  particleContext.clip(heartPath);
  particlePaths.forEach((path, index) => {
    particleContext.fillStyle = colors[index];
    particleContext.fill(path);
  });
  particleContext.restore();
  particleGlowContext.filter = "blur(7px)";
  particleGlowContext.drawImage(particleLayer, 0, 0);
  particleGlowContext.filter = "none";
  const lowerHeartTargets = particles.filter((particle) => particle.y > 690 && particle.y < 790);

  class Particle {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.originX = x;
      this.originY = y;
      this.type = type;
      this.color = BLUE_SHADES[Math.floor(random(0, BLUE_SHADES.length))];
      this.size = type === "burst" ? random(1.5, 2.8) : random(0.7, 1.4);
      this.maxLife = type === "burst" ? random(1.5, 2.3) : random(4, 7);
      this.life = 0;
      this.phase = random(0, Math.PI * 2);
      this.velocityX = random(-13, 13);
      this.velocityY = random(-20, -5);
      this.target = type === "burst"
        ? lowerHeartTargets[Math.floor(random(0, lowerHeartTargets.length))]
        : null;
      this.alpha = 0;
    }

    update(delta) {
      this.life += delta;
      if (this.life >= this.maxLife) {
        if (this.type === "burst") return false;
        this.reset();
      }

      if (this.type === "burst") {
        const progress = Math.min(1, this.life / this.maxLife);
        const ease = 1 - (1 - progress) ** 3;
        const swirl = Math.sin(progress * Math.PI) * 10;
        this.x = this.originX + (this.target.x - this.originX) * ease
          + Math.cos(this.phase) * swirl;
        this.y = this.originY + (this.target.y - this.originY) * ease
          + Math.sin(this.phase) * swirl;
        this.alpha = (0.35 + Math.sin(progress * Math.PI) * 0.65);
      } else {
        this.x += this.velocityX * delta + Math.sin(this.phase + this.life) * 0.45;
        this.y += this.velocityY * delta;
        this.alpha = Math.sin(Math.PI * this.life / this.maxLife) * 0.28;
        if (this.y < -10 || this.x < -10 || this.x > width + 10) this.reset();
      }
      return true;
    }

    reset() {
      this.x = random(300, 420);
      this.y = random(660, 1060);
      this.originX = this.x;
      this.originY = this.y;
      this.life = 0;
      this.maxLife = random(4, 9);
      this.velocityX = random(-13, 13);
      this.velocityY = random(-20, -5);
    }
  }

  for (let i = 0; i < FLOAT_COUNT; i++) {
    const particle = new Particle(random(300, 420), random(680, 1060), "float");
    particle.life = Math.random() * particle.maxLife;
    floatParticles.push(particle);
  }

  function spawnHeartBurst(x, y) {
    for (let i = 0; i < BURST_COUNT; i++) {
      burstParticles.push(new Particle(x + random(-12, 12), y + random(-5, 5), "burst"));
    }
  }

  const particleSprites = BLUE_SHADES.map((color) => {
    const sprite = document.createElement("canvas");
    sprite.width = 32;
    sprite.height = 32;
    const spriteContext = sprite.getContext("2d");
    const gradient = spriteContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.16, color);
    gradient.addColorStop(0.42, `${color}aa`);
    gradient.addColorStop(1, `${color}00`);
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, 32, 32);
    return sprite;
  });

  function updateParticles(delta) {
    for (const particle of floatParticles) particle.update(delta);
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      if (!burstParticles[i].update(delta)) burstParticles.splice(i, 1);
    }
  }

  function drawParticles() {
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const group of [floatParticles, burstParticles]) {
      for (const particle of group) {
        context.globalAlpha = particle.alpha;
        const sprite = particleSprites[BLUE_SHADES.indexOf(particle.color)];
        const size = particle.size * (particle.type === "burst" ? 7 : 5);
        context.drawImage(sprite, particle.x - size / 2, particle.y - size / 2, size, size);
      }
    }
    context.restore();
  }

  for (let i = 0; i < GLINT_COUNT; i++) {
    const particle = particles[Math.floor(random(0, particles.length))];
    glints.push({
      x: particle.x, y: particle.y, phase: random(0, Math.PI * 2),
      size: random(1, 2.8), color: Math.random() > 0.5 ? "#a8faff" : "#7cc6ff"
    });
  }
  for (let i = 0; i < RISING_COUNT; i++) {
    risingParticles.push({
      x: random(-1, 1), drift: random(-1, 1), speed: random(45, 150),
      phase: random(0, 8), size: random(0.8, 2.4)
    });
  }
  for (let i = 0; i < CURRENT_COUNT; i++) {
    currents.push({ offset: random(-105, 105), phase: random(0, Math.PI * 2), bend: random(15, 60) });
  }
  for (let i = 0; i < SMOKE_COUNT; i++) {
    smokePuffs.push({
      phase: random(0, 8), speed: random(30, 72), drift: random(-1, 1),
      size: random(35, 90), opacity: random(0.035, 0.09)
    });
  }

  const smokeSprite = document.createElement("canvas");
  smokeSprite.width = 128;
  smokeSprite.height = 128;
  const spriteContext = smokeSprite.getContext("2d");
  const smokeGradient = spriteContext.createRadialGradient(64, 64, 2, 64, 64, 64);
  smokeGradient.addColorStop(0, "rgba(205,252,255,.52)");
  smokeGradient.addColorStop(0.28, "rgba(39,165,255,.34)");
  smokeGradient.addColorStop(0.62, "rgba(24,110,235,.14)");
  smokeGradient.addColorStop(1, "rgba(15,45,150,0)");
  spriteContext.fillStyle = smokeGradient;
  spriteContext.fillRect(0, 0, 128, 128);

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, compactMode ? 1 : 1.5);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    const scale = Math.min(canvas.width / width, canvas.height / height);
    context.setTransform(scale, 0, 0, scale,
      (canvas.width - width * scale) / 2, (canvas.height - height * scale) / 2);
  }

  function drawPlatform(seconds) {
    const pulse = 1 + Math.sin(seconds * 2.2) * 0.055;
    context.save();
    context.translate(360, 1050);
    context.scale(pulse, 1);
    context.globalCompositeOperation = "lighter";

    const pool = context.createRadialGradient(0, -5, 2, 0, 0, 180);
    pool.addColorStop(0, "rgba(210,255,255,1)");
    pool.addColorStop(0.12, "rgba(27,235,255,.98)");
    pool.addColorStop(0.4, "rgba(0,133,255,.68)");
    pool.addColorStop(1, "rgba(0,65,255,0)");
    context.fillStyle = pool;
    context.beginPath();
    context.ellipse(0, 0, 175, 52, 0, 0, Math.PI * 2);
    context.fill();

    context.shadowColor = "#19ddff";
    context.shadowBlur = 14;
    for (let i = 0; i < 7; i++) {
      const start = seconds * (i % 2 ? -0.26 : 0.26);
      context.beginPath();
      context.ellipse(0, 0, 120 + i * 13, 15 + i * 4, 0,
        start, start + Math.PI * 1.55);
      context.strokeStyle = `rgba(35,${220 - i * 12},255,${0.75 - i * 0.065})`;
      context.lineWidth = i < 2 ? 3 : 1.5;
      context.stroke();
    }
    context.restore();
    context.globalCompositeOperation = "source-over";
  }

  function drawSmoke(seconds) {
    smokeContext.clearRect(0, 0, width, height);
    smokeContext.globalCompositeOperation = "screen";
    for (const puff of smokePuffs) {
      const travel = (seconds * puff.speed + puff.phase * 48) % 520;
      const rise = travel / 520;
      const x = 360 + puff.drift * (18 + rise * 145)
        + Math.sin(seconds * 0.75 + puff.phase) * (9 + rise * 25);
      const y = 1042 - travel;
      const size = puff.size * (0.45 + rise * 0.7);
      const fadeIn = Math.min(1, travel / 55);
      const fadeOut = Math.max(0, 1 - rise * 0.92);
      smokeContext.globalAlpha = puff.opacity * fadeIn * fadeOut;
      smokeContext.drawImage(smokeSprite, x - size, y - size, size * 2, size * 2);
    }
    smokeContext.globalAlpha = 1;
    smokeContext.globalCompositeOperation = "source-over";
    context.drawImage(smokeLayer, 0, 0, width, height);
  }

  function draw(seconds) {
    context.fillStyle = "#02040b";
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(360, 570, 15, 360, 570, 390);
    glow.addColorStop(0, "rgba(0,92,255,.2)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = glow;
    context.fillRect(0, 180, width, 760);

    drawSmoke(seconds);

    const pulse = (Math.sin(seconds * 2.2) + 1) / 2;
    const beat = 1 + Math.sin(seconds * 2.2) * 0.022 + pulse ** 12 * 0.018;
    const reveal = Math.min(1, seconds / 2.5);
    context.save();
    context.translate(360, 574);
    context.scale(beat, beat);
    context.translate(-360, -574);
    context.globalCompositeOperation = "lighter";

    context.globalAlpha = reveal;
    context.drawImage(particleGlowLayer, 0, 0);
    context.save();
    const revealHeight = 430 * reveal;
    context.beginPath();
    context.rect(0, 790 - revealHeight, width, revealHeight);
    context.clip();
    context.drawImage(particleLayer, 0, 0);
    context.restore();

    context.save();
    context.beginPath();
    context.clip(heartPath);
    context.lineWidth = 1;
    context.shadowColor = "#32bfff";
    context.shadowBlur = 10;
    for (const current of currents) {
      const wave = Math.sin(seconds * 1.35 + current.phase);
      context.beginPath();
      context.moveTo(360 + current.offset, 390 + current.phase * 18);
      context.bezierCurveTo(
        360 + current.offset + wave * current.bend * 2, 480,
        360 - current.offset + Math.cos(seconds + current.phase) * current.bend * 2, 650,
        360 + current.offset * 0.12, 785
      );
      context.strokeStyle = `rgba(35,190,255,${0.11 + (wave + 1) * 0.09})`;
      context.lineWidth = 0.9 + Math.abs(current.offset) * 0.006;
      context.stroke();
    }
    context.restore();

    for (const glint of glints) {
      const flash = Math.max(0, Math.sin(seconds * 2.4 + glint.phase)) ** 8;
      if (flash < 0.08) continue;
      const radius = glint.size * (1 + flash * 1.6);
      context.globalAlpha = flash * reveal;
      context.fillStyle = glint.color;
      context.beginPath();
      context.arc(glint.x, glint.y, radius, 0, Math.PI * 2);
      context.fill();
      if (flash > 0.7) {
        context.fillRect(glint.x - radius * 2.5, glint.y - 0.5, radius * 5, 1);
        context.fillRect(glint.x - 0.5, glint.y - radius * 2.5, 1, radius * 5);
      }
    }
    context.globalAlpha = 1;

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "italic 600 78px 'Segoe Script', 'Brush Script MT', cursive";
    context.globalAlpha = reveal * (0.75 + Math.sin(seconds * 2.1) * 0.15);
    context.fillStyle = "#62dfff";
    context.shadowColor = "#008dff";
    context.shadowBlur = 30;
    context.fillText("Sasha", 360, 584);
    context.shadowBlur = 8;
    context.fillStyle = "#d5faff";
    context.fillText("Sasha", 360, 584);
    context.restore();

    drawPlatform(seconds);

    context.globalCompositeOperation = "lighter";
    const streamCore = new Path2D();
    const streamHalo = new Path2D();
    for (const particle of risingParticles) {
      const travel = (seconds * particle.speed + particle.phase * 75) % 370;
      const spread = 5 + travel * 0.17;
      const x = 360 + particle.x * spread
        + Math.sin(seconds * 1.6 + particle.phase) * (3 + travel * 0.035)
        + particle.drift * travel * 0.13;
      const y = 1040 - travel;
      const radius = particle.size * (travel > 260 ? 0.8 : 1);
      (particle.size > 1.7 ? streamHalo : streamCore)
        .moveTo(x + radius, y);
      (particle.size > 1.7 ? streamHalo : streamCore)
        .arc(x, y, radius, 0, Math.PI * 2);
    }
    context.fillStyle = "#56dfff";
    context.fill(streamCore);
    context.shadowColor = "#25cfff";
    context.shadowBlur = 8;
    context.fillStyle = "#d2fbff";
    context.fill(streamHalo);
    context.shadowBlur = 0;
    context.globalCompositeOperation = "source-over";
    drawParticles();
  }

  let lastFrame = 0;
  let animationFrame = 0;
  const frameInterval = 1000 / (compactMode ? 24 : 30);
  let nextBurstAt = 0;

  function animate(timestamp) {
    if (timestamp - lastFrame >= frameInterval) {
      const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.05) : 0;
      lastFrame = timestamp;
      const seconds = timestamp / 1000;
      if (seconds >= nextBurstAt) {
        spawnHeartBurst(360, 1045);
        nextBurstAt = seconds + 0.12;
      }
      updateParticles(delta);
      draw(seconds);
    }
    if (!reducedMotion.matches && !document.hidden) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  function start() {
    cancelAnimationFrame(animationFrame);
    lastFrame = 0;
    animationFrame = requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else start();
  });
  reducedMotion.addEventListener?.("change", start);
  resize();
  if (reducedMotion.matches) draw(0);
  else start();
})();
