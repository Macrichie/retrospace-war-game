/* ═══════════════════════════════════════════════════════════
   SPACE INVADERS — Vanilla HTML + JS + Canvas
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  /* ── Canvas ─────────────────────────────────────── */
  const canvas = document.getElementById("game-canvas");
  const ctx    = canvas.getContext("2d");
  const W = canvas.width;   // 640
  const H = canvas.height;  // 480

  /* ── DOM refs ───────────────────────────────────── */
  const $score     = document.getElementById("score");
  const $hiScore   = document.getElementById("hi-score");
  const $level     = document.getElementById("level");
  const $lives     = document.getElementById("lives");
  const $start     = document.getElementById("start-screen");
  const $startBtn  = document.getElementById("start-btn");
  const $over      = document.getElementById("gameover-screen");
  const $overTitle = document.getElementById("gameover-title");
  const $finalScore = document.getElementById("final-score");
  const $restartBtn = document.getElementById("restart-btn");
  const $pause     = document.getElementById("pause-screen");

  /* ── Audio (Web Audio bleeps) ───────────────────── */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx;
  function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }

  function tone(freq, dur, type = "square", vol = 0.1) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  }

  const sfx = {
    shoot()      { tone(880, 0.08); },
    hit()        { tone(220, 0.15, "sawtooth", 0.12); },
    playerHit()  { tone(100, 0.4, "sawtooth", 0.15); },
    enemyShoot() { tone(180, 0.1, "triangle", 0.05); },
    ufoHit()     { tone(600, 0.25, "sine", 0.12); },
    levelUp()    { tone(523, 0.12); setTimeout(() => tone(659, 0.12), 140); setTimeout(() => tone(784, 0.25), 280); },
    gameOver()   { tone(300, 0.3, "sawtooth", 0.14); setTimeout(() => tone(200, 0.5, "sawtooth", 0.14), 320); },
  };

  /* ── Pixel-art sprite maps ─────────────────────── */
  //  1 = filled pixel, 0 = empty.  Two frames per invader type.
  const SPRITES = {
    // ── Squid (top rows — 30 pts) ──
    squidA: [
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,0,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,0,1,0,0,1,0,0,0],
      [0,0,1,0,0,0,0,1,0,0],
      [0,0,0,1,0,0,1,0,0,0],
    ],
    squidB: [
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,0,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,1,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,1,0],
      [0,0,1,0,0,0,0,1,0,0],
    ],
    // ── Crab (middle rows — 20 pts) ──
    crabA: [
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,0,0,1,0,0,0,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1],
      [0,0,0,1,1,0,1,1,0,0,0],
    ],
    crabB: [
      [0,0,1,0,0,0,0,0,1,0,0],
      [1,0,0,1,0,0,0,1,0,0,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,1,1,0,1,1,1,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,0,1,0],
    ],
    // ── Octopus (bottom rows — 10 pts) ──
    octoA: [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,1,1,0,1,1,0,1,1,0,0],
      [1,1,0,0,0,0,0,0,0,0,1,1],
    ],
    octoB: [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,1,1,0,1,1,0,0],
      [0,1,0,0,1,0,0,1,0,0,1,0],
      [0,0,1,0,0,0,0,0,0,1,0,0],
    ],
    // ── UFO ──
    ufo: [
      [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,1,0,0,0,0,0,1,1,1,0,0],
      [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    ],
    // ── Player ship ──
    ship: [
      [0,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
    ],
  };

  /* ── Constants ──────────────────────────────────── */
  const PX            = 3;        // pixel scale for sprites
  const PLAYER_SPEED  = 5;
  const BULLET_SPEED  = 7;
  const ENEMY_BULLET_SPEED = 3;
  const INV_COLS      = 11;
  const INV_ROWS      = 5;
  const INV_PAD_X     = 44;
  const INV_PAD_Y     = 36;
  const INV_START_Y   = 56;
  const PLAYER_Y      = H - 50;
  const SHIP_W        = SPRITES.ship[0].length * PX;   // 33
  const SHIP_H        = SPRITES.ship.length    * PX;   // 21
  const STAR_COUNT    = 90;

  // Row config [type, spriteKeyPrefix, color, points]
  const ROW_CFG = [
    { key: "squid", color: "#ff4444", pts: 30 },
    { key: "crab",  color: "#ffaa00", pts: 20 },
    { key: "crab",  color: "#ffcc33", pts: 20 },
    { key: "octo",  color: "#44ff44", pts: 10 },
    { key: "octo",  color: "#44ffcc", pts: 10 },
  ];

  /* ── Shield / barrier template (22 × 16 pixel grid) */
  function makeShieldGrid() {
    const rows = 16, cols = 22;
    const g = [];
    for (let r = 0; r < rows; r++) {
      g[r] = [];
      for (let c = 0; c < cols; c++) {
        // rounded top corners
        if (r < 2 && (c < 4 || c > cols - 5)) { g[r][c] = 0; continue; }
        if (r < 1 && (c < 6 || c > cols - 7)) { g[r][c] = 0; continue; }
        // arch cutout at bottom centre
        if (r >= 11 && c >= 7 && c <= 14)      { g[r][c] = 0; continue; }
        if (r >= 10 && c >= 8 && c <= 13)       { g[r][c] = 0; continue; }
        g[r][c] = 1;
      }
    }
    return g;
  }
  const SHIELD_PX = 3;
  const SHIELD_W  = 22 * SHIELD_PX;
  const SHIELD_H  = 16 * SHIELD_PX;
  const SHIELD_Y  = H - 110;

  /* ── Helpers ────────────────────────────────────── */
  const pad4   = n => String(n).padStart(4, "0");
  const rand   = (a, b) => Math.random() * (b - a) + a;
  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rects  = (ax, ay, aw, ah, bx, by, bw, bh) =>
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  /* ── State ──────────────────────────────────────── */
  let state;      // "menu" | "play" | "pause" | "dying" | "over" | "nextlevel"
  let score, lives, level, hiScore;
  let player, bullets, eBullets, invaders, shields, ufo, particles;
  let invDir, invMoveTimer, invInterval, animFrame;
  let ufoTimer, shootCooldown, dyingTimer, nextLevelTimer;
  let keys = {};

  /* ── Starfield (generated once, twinkles) ──────── */
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: rand(0, W), y: rand(0, H), s: rand(0.8, 2), b: rand(0.2, 0.9),
  }));

  /* ── Input ──────────────────────────────────────── */
  document.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
  });
  document.addEventListener("keyup", e => { keys[e.code] = false; });

  /* ── Drawing primitives ─────────────────────────── */
  function drawSprite(x, y, map, scale, color) {
    ctx.fillStyle = color;
    for (let r = 0; r < map.length; r++)
      for (let c = 0; c < map[r].length; c++)
        if (map[r][c]) ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
  }

  function drawStars() {
    const t = performance.now() * 0.001;
    for (const s of stars) {
      ctx.globalAlpha = s.b * (0.55 + 0.45 * Math.sin(t * 1.5 + s.x + s.y));
      ctx.fillStyle = "#bbc";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  /* ── Particle system ────────────────────────────── */
  function spawnParticles(x, y, color, n) {
    for (let i = 0; i < n; i++)
      particles.push({ x, y, vx: rand(-3, 3), vy: rand(-3, 3), life: 1, decay: rand(0.02, 0.05), color, sz: rand(2, 5) });
  }
  function updateParticles() {
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.life -= p.decay; }
    particles = particles.filter(p => p.life > 0);
  }
  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.sz, p.sz);
    }
    ctx.globalAlpha = 1;
  }

  /* ── Init / Reset ───────────────────────────────── */
  function initGame(fresh) {
    if (fresh) { score = 0; lives = 3; level = 1; }
    player = { x: W / 2 - SHIP_W / 2, alive: true };
    bullets   = [];
    eBullets  = [];
    particles = [];
    shootCooldown = 0;

    // Shields
    shields = [];
    const count = 4;
    const gap = (W - count * SHIELD_W) / (count + 1);
    for (let i = 0; i < count; i++)
      shields.push({ x: gap + i * (SHIELD_W + gap), y: SHIELD_Y, grid: makeShieldGrid() });

    // Invaders
    invaders = [];
    for (let r = 0; r < INV_ROWS; r++)
      for (let c = 0; c < INV_COLS; c++) {
        const cfg = ROW_CFG[r];
        invaders.push({
          r, c,
          x: 36 + c * INV_PAD_X,
          y: INV_START_Y + r * INV_PAD_Y,
          key: cfg.key, color: cfg.color, pts: cfg.pts, alive: true,
        });
      }

    invDir  = 1;
    invMoveTimer = 0;
    invInterval  = Math.max(8, 38 - (level - 1) * 5);
    animFrame    = 0;

    ufo      = null;
    ufoTimer = Math.floor(rand(400, 900));
  }

  function updateHUD() {
    $score.textContent   = pad4(score);
    $hiScore.textContent = pad4(hiScore);
    $level.textContent   = level;
    $lives.textContent   = "▲ ".repeat(lives);
  }

  /* ── Invader bounds helper ──────────────────────── */
  function invBounds(inv) {
    const spr = SPRITES[inv.key + "A"];
    return { w: spr[0].length * PX, h: spr.length * PX };
  }

  /* ── Shield damage ──────────────────────────────── */
  function damageShield(sh, bx, by, bw, bh, rad) {
    let hit = false;
    const c0 = Math.floor((bx - sh.x) / SHIELD_PX) - rad;
    const c1 = Math.ceil((bx + bw - sh.x) / SHIELD_PX) + rad;
    const r0 = Math.floor((by - sh.y) / SHIELD_PX) - rad;
    const r1 = Math.ceil((by + bh - sh.y) / SHIELD_PX) + rad;
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        if (r >= 0 && r < sh.grid.length && c >= 0 && c < sh.grid[0].length && sh.grid[r][c]) {
          sh.grid[r][c] = 0;
          hit = true;
        }
    return hit;
  }

  /* ── Core update ────────────────────────────────── */
  function updatePlay() {
    // Player movement
    if (keys.ArrowLeft  || keys.KeyA) player.x -= PLAYER_SPEED;
    if (keys.ArrowRight || keys.KeyD) player.x += PLAYER_SPEED;
    player.x = clamp(player.x, 4, W - SHIP_W - 4);

    // Player shoot
    if (shootCooldown > 0) shootCooldown--;
    if ((keys.Space || keys.ArrowUp) && bullets.length < 2 && shootCooldown === 0) {
      bullets.push({ x: player.x + SHIP_W / 2 - 1.5, y: PLAYER_Y - 10 });
      shootCooldown = 14;
      sfx.shoot();
    }

    // Move bullets
    for (const b of bullets)  b.y -= BULLET_SPEED;
    for (const b of eBullets) b.y += ENEMY_BULLET_SPEED + level * 0.25;
    bullets  = bullets.filter(b => b.y > -14);
    eBullets = eBullets.filter(b => b.y < H + 14);

    // ── Invader march ──
    invMoveTimer++;
    const alive = invaders.filter(i => i.alive).length;
    const dynInterval = Math.max(2, Math.floor(invInterval * (alive / (INV_ROWS * INV_COLS))));

    if (invMoveTimer >= dynInterval) {
      invMoveTimer = 0;
      animFrame++;

      let edge = false;
      for (const inv of invaders) {
        if (!inv.alive) continue;
        const { w } = invBounds(inv);
        if ((invDir > 0 && inv.x + w >= W - 10) || (invDir < 0 && inv.x <= 10)) { edge = true; break; }
      }
      if (edge) {
        invDir *= -1;
        for (const inv of invaders) if (inv.alive) inv.y += 12;
      } else {
        const step = 7 + level;
        for (const inv of invaders) if (inv.alive) inv.x += invDir * step;
      }
    }

    // ── Invader shooting ──
    const cols = {};
    for (const inv of invaders) {
      if (!inv.alive) continue;
      if (!cols[inv.c] || inv.r > cols[inv.c].r) cols[inv.c] = inv;
    }
    const shootChance = 0.007 + level * 0.003;
    for (const inv of Object.values(cols)) {
      if (Math.random() < shootChance && eBullets.length < 4 + level) {
        const { w, h } = invBounds(inv);
        eBullets.push({ x: inv.x + w / 2 - 1.5, y: inv.y + h });
        sfx.enemyShoot();
      }
    }

    // ── Bullet ↔ Invader ──
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (const inv of invaders) {
        if (!inv.alive) continue;
        const { w, h } = invBounds(inv);
        if (rects(b.x, b.y, 3, 10, inv.x, inv.y, w, h)) {
          inv.alive = false;
          bullets.splice(bi, 1);
          score += inv.pts;
          spawnParticles(inv.x + w / 2, inv.y + h / 2, inv.color, 14);
          sfx.hit();
          break;
        }
      }
    }

    // ── Bullet ↔ Shields ──
    for (const sh of shields) {
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        if (rects(b.x, b.y, 3, 10, sh.x, sh.y, SHIELD_W, SHIELD_H))
          if (damageShield(sh, b.x, b.y, 3, 10, 2)) bullets.splice(bi, 1);
      }
      for (let bi = eBullets.length - 1; bi >= 0; bi--) {
        const b = eBullets[bi];
        if (rects(b.x, b.y, 3, 12, sh.x, sh.y, SHIELD_W, SHIELD_H))
          if (damageShield(sh, b.x, b.y, 3, 12, 2)) eBullets.splice(bi, 1);
      }
    }

    // ── Invaders eating shields ──
    for (const inv of invaders) {
      if (!inv.alive) continue;
      const { w, h } = invBounds(inv);
      for (const sh of shields)
        if (rects(inv.x, inv.y, w, h, sh.x, sh.y, SHIELD_W, SHIELD_H))
          damageShield(sh, inv.x, inv.y + h - 4, w, 4, 1);
    }

    // ── Enemy bullet ↔ Player ──
    for (let bi = eBullets.length - 1; bi >= 0; bi--) {
      const b = eBullets[bi];
      if (rects(b.x, b.y, 3, 12, player.x, PLAYER_Y, SHIP_W, SHIP_H)) {
        eBullets.splice(bi, 1);
        playerDie();
        return;
      }
    }

    // ── Invader reaches player row ──
    for (const inv of invaders) {
      if (inv.alive) {
        const { h } = invBounds(inv);
        if (inv.y + h >= PLAYER_Y) { endGame(); return; }
      }
    }

    // ── UFO ──
    if (!ufo) {
      ufoTimer--;
      if (ufoTimer <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        ufo = { x: dir > 0 ? -50 : W + 50, y: 20, dir, scored: null, timer: 0 };
        ufoTimer = Math.floor(rand(600, 1100));
      }
    } else if (!ufo.scored) {
      ufo.x += ufo.dir * 2;
      if (ufo.x < -60 || ufo.x > W + 60) ufo = null;
    } else {
      ufo.timer--;
      if (ufo.timer <= 0) ufo = null;
    }

    // Bullet ↔ UFO
    if (ufo && !ufo.scored) {
      const uw = SPRITES.ufo[0].length * PX, uh = SPRITES.ufo.length * PX;
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        if (rects(b.x, b.y, 3, 10, ufo.x, ufo.y, uw, uh)) {
          bullets.splice(bi, 1);
          const pts = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
          score += pts;
          ufo.scored = pts;
          ufo.timer  = 50;
          spawnParticles(ufo.x + uw / 2, ufo.y + uh / 2, "#ff44ff", 22);
          sfx.ufoHit();
          break;
        }
      }
    }

    // Particles
    updateParticles();

    // Win check
    if (invaders.every(i => !i.alive)) {
      state = "nextlevel";
      nextLevelTimer = 90;
      sfx.levelUp();
    }

    // Hi-score
    if (score > hiScore) { hiScore = score; localStorage.setItem("si_hi", hiScore); }
    updateHUD();
  }

  function playerDie() {
    player.alive = false;
    spawnParticles(player.x + SHIP_W / 2, PLAYER_Y + SHIP_H / 2, "#00ff88", 28);
    sfx.playerHit();
    lives--;
    if (lives <= 0) {
      state = "dying";
      dyingTimer = 70;
    } else {
      state = "dying";
      dyingTimer = 60;
    }
  }

  function endGame() {
    state = "over";
    if (score > hiScore) { hiScore = score; localStorage.setItem("si_hi", hiScore); }
    updateHUD();
    sfx.gameOver();
    $overTitle.textContent = "GAME OVER";
    $overTitle.className = "title";
    $overTitle.style.color = "#f44";
    $overTitle.style.textShadow = "0 0 20px #f44, 0 0 40px #a00";
    $finalScore.textContent = "FINAL SCORE: " + pad4(score);
    $over.classList.remove("hidden");
  }

  /* ── Render ─────────────────────────────────────── */
  function render() {
    ctx.clearRect(0, 0, W, H);
    drawStars();

    // Ground line
    ctx.strokeStyle = "#0a0";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 18); ctx.lineTo(W, H - 18); ctx.stroke();

    // Shields
    for (const sh of shields) {
      ctx.fillStyle = "#00cc66";
      for (let r = 0; r < sh.grid.length; r++)
        for (let c = 0; c < sh.grid[r].length; c++)
          if (sh.grid[r][c]) ctx.fillRect(sh.x + c * SHIELD_PX, sh.y + r * SHIELD_PX, SHIELD_PX, SHIELD_PX);
    }

    // Invaders
    for (const inv of invaders) {
      if (!inv.alive) continue;
      const frame = animFrame % 2 === 0 ? "A" : "B";
      drawSprite(inv.x, inv.y, SPRITES[inv.key + frame], PX, inv.color);
    }

    // UFO
    if (ufo) {
      if (!ufo.scored) {
        drawSprite(ufo.x, ufo.y, SPRITES.ufo, PX, "#ff44ff");
      } else {
        // Show scored points text
        ctx.fillStyle = "#ff44ff";
        ctx.font = "bold 16px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(String(ufo.scored), ufo.x + (SPRITES.ufo[0].length * PX) / 2, ufo.y + 12);
      }
    }

    // Bullets
    ctx.fillStyle = "#fff";
    for (const b of bullets) {
      ctx.fillRect(b.x, b.y, 3, 10);
      ctx.shadowColor = "#ff0"; ctx.shadowBlur = 6;
      ctx.fillRect(b.x, b.y, 3, 10);
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = "#ff4444";
    for (const b of eBullets) {
      ctx.fillRect(b.x, b.y, 3, 12);
      ctx.shadowColor = "#f44"; ctx.shadowBlur = 5;
      ctx.fillRect(b.x, b.y, 3, 12);
      ctx.shadowBlur = 0;
    }

    // Player
    if (player.alive) drawSprite(player.x, PLAYER_Y, SPRITES.ship, PX, "#00ff88");

    // Particles
    drawParticles();
  }

  /* ── Main loop ──────────────────────────────────── */
  let prevEnter = false;

  function mainLoop() {
    requestAnimationFrame(mainLoop);

    const enterNow = !!(keys.Enter || keys.NumpadEnter);
    const enterHit = enterNow && !prevEnter;
    prevEnter = enterNow;

    switch (state) {

      case "menu":
        render();
        if (enterHit) startGame();
        break;

      case "play":
        // Pause toggle
        if (enterHit || (keys.KeyP && !keys._pPrev)) {
          state = "pause";
          $pause.classList.remove("hidden");
          keys._pPrev = true;
          break;
        }
        keys._pPrev = !!keys.KeyP;
        updatePlay();
        render();
        break;

      case "pause":
        render();
        if (enterHit || (keys.KeyP && !keys._pPrev)) {
          state = "play";
          $pause.classList.add("hidden");
          keys._pPrev = true;
        }
        keys._pPrev = !!keys.KeyP;
        break;

      case "dying":
        dyingTimer--;
        updateParticles();
        render();
        if (dyingTimer <= 0) {
          if (lives <= 0) {
            endGame();
          } else {
            player.alive = true;
            player.x = W / 2 - SHIP_W / 2;
            bullets = [];
            eBullets = [];
            state = "play";
          }
        }
        break;

      case "over":
        updateParticles();
        render();
        if (enterHit) startGame();
        break;

      case "nextlevel":
        nextLevelTimer--;
        ctx.clearRect(0, 0, W, H);
        drawStars();
        ctx.fillStyle = "#0f0";
        ctx.font = "bold 32px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL " + level + " COMPLETE!", W / 2, H / 2 - 20);
        ctx.font = "18px 'Courier New'";
        ctx.fillText("Get ready...", W / 2, H / 2 + 20);
        if (nextLevelTimer <= 0) {
          level++;
          initGame(false);
          state = "play";
          updateHUD();
        }
        break;
    }
  }

  /* ── Start game ─────────────────────────────────── */
  function startGame() {
    ensureAudio();
    initGame(true);
    updateHUD();
    $start.classList.add("hidden");
    $over.classList.add("hidden");
    $pause.classList.add("hidden");
    state = "play";
  }

  /* ── Button handlers ────────────────────────────── */
  $startBtn.addEventListener("click", startGame);
  $restartBtn.addEventListener("click", startGame);

  /* ── Touch controls (mobile) ────────────────────── */
  let touchX = null;
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    if (state === "menu" || state === "over") { startGame(); return; }
    touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    keys.Space = true;
  }, { passive: false });
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  }, { passive: false });
  canvas.addEventListener("touchend", e => {
    e.preventDefault();
    touchX = null;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.Space = false;
  }, { passive: false });

  function handleTouch() {
    if (touchX === null) return;
    const half = W / 2;
    keys.ArrowLeft  = touchX < half - 30;
    keys.ArrowRight = touchX > half + 30;
  }

  /* ── Boot ───────────────────────────────────────── */
  hiScore = parseInt(localStorage.getItem("si_hi") || "0", 10);
  $hiScore.textContent = pad4(hiScore);
  state = "menu";

  // Wrap main loop to include touch
  const _mainLoop = mainLoop;
  function gameLoop() {
    handleTouch();
    _mainLoop();
  }

  // Override — just call gameLoop as the rAF entry
  function go() {
    handleTouch();
    requestAnimationFrame(go);

    const enterNow = !!(keys.Enter || keys.NumpadEnter);
    const enterHit = enterNow && !prevEnter;
    prevEnter = enterNow;

    switch (state) {
      case "menu":
        render();
        if (enterHit) startGame();
        break;
      case "play":
        if (enterHit || (keys.KeyP && !keys._pPrev)) {
          state = "pause"; $pause.classList.remove("hidden"); keys._pPrev = true; break;
        }
        keys._pPrev = !!keys.KeyP;
        updatePlay();
        render();
        break;
      case "pause":
        render();
        if (enterHit || (keys.KeyP && !keys._pPrev)) {
          state = "play"; $pause.classList.add("hidden"); keys._pPrev = true;
        }
        keys._pPrev = !!keys.KeyP;
        break;
      case "dying":
        dyingTimer--;
        updateParticles();
        render();
        if (dyingTimer <= 0) {
          if (lives <= 0) endGame();
          else { player.alive = true; player.x = W / 2 - SHIP_W / 2; bullets = []; eBullets = []; state = "play"; }
        }
        break;
      case "over":
        updateParticles();
        render();
        if (enterHit) startGame();
        break;
      case "nextlevel":
        nextLevelTimer--;
        ctx.clearRect(0, 0, W, H);
        drawStars();
        ctx.fillStyle = "#0f0";
        ctx.font = "bold 32px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL " + level + " COMPLETE!", W / 2, H / 2 - 20);
        ctx.font = "18px 'Courier New'";
        ctx.fillText("Get ready...", W / 2, H / 2 + 20);
        if (nextLevelTimer <= 0) { level++; initGame(false); state = "play"; updateHUD(); }
        break;
    }
  }

  go();
})();
