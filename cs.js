(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const wrapper = document.getElementById('game-wrapper');
    const menuOverlay = document.getElementById('menu-overlay');
    const optionsOverlay = document.getElementById('options-overlay');
    const gameoverOverlay = document.getElementById('gameover-overlay');
    const winOverlay = document.getElementById('win-overlay');
    const btnStart = document.getElementById('btn-start');
    const btnOptions = document.getElementById('btn-options');
    const btnExit = document.getElementById('btn-exit');
    const btnBackOptions = document.getElementById('btn-back-options');
    const btnRetry = document.getElementById('btn-retry');
    const btnMenuFromGo = document.getElementById('btn-menu-from-go');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnMenuFromWin = document.getElementById('btn-menu-from-win');
    const sliderMaster = document.getElementById('slider-master');
    const sliderMusic = document.getElementById('slider-music');
    const sliderSfx = document.getElementById('slider-sfx');
    const valMaster = document.getElementById('val-master');
    const valMusic = document.getElementById('val-music');
    const valSfx = document.getElementById('val-sfx');
    const goScoreEl = document.getElementById('go-score');
    const goCoinsEl = document.getElementById('go-coins');
    const winScoreEl = document.getElementById('win-score');
    const winCoinsEl = document.getElementById('win-coins');

    const INTERNAL_W = 960;
    const INTERNAL_H = 540;
    canvas.width = INTERNAL_W;
    canvas.height = INTERNAL_H;
    ctx.imageSmoothingEnabled = false;

    function resizeCanvas() {
        const wrapperW = wrapper.clientWidth;
        const wrapperH = wrapper.clientHeight;
        const scale = Math.min(wrapperW / INTERNAL_W, wrapperH / INTERNAL_H);
        canvas.style.width = (INTERNAL_W * scale) + 'px';
        canvas.style.height = (INTERNAL_H * scale) + 'px';
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ============ Created by Emir Satarov;) ============
    let audioCtx = null;
    let masterGain, musicGain, sfxGain;
    let masterVol = 0.8;
    let musicVol = 0.6;
    let sfxVol = 0.9;
    let currentMusicTrack = null;
    let musicNoteIdx = 0;
    let musicTimer = 0;
    let musicNoteDuration = 0;
    let musicTrackData = null;
    let musicActive = false;


    const MUSIC_MENU = 'menu';
    const MUSIC_GAMEPLAY = 'gameplay';
    const MUSIC_BONUS = 'bonus';
    const MUSIC_STAR = 'star';
    const MUSIC_VICTORY = 'victory';
    const MUSIC_GAMEOVER = 'gameover';

    const musicTracks = {
        menu: {
            bpm: 72,
            notes: [
                262, 0, 330, 0, 392, 0, 330, 0, 262, 0, 294, 0, 349, 0, 294, 0,
                262, 0, 330, 0, 392, 0, 523, 0, 440, 0, 349, 0, 330, 0, 262, 0,
                196, 0, 247, 0, 294, 0, 247, 0, 196, 0, 262, 0, 330, 0, 262, 0,
                196, 0, 247, 0, 294, 0, 392, 0, 349, 0, 294, 0, 262, 0, 196, 0,
            ],
            waveType: 'triangle',
            baseVol: 0.1,
            echo: 0.4,
        },
        gameplay: {
            bpm: 155,
            notes: [
                392, 392, 0, 392, 0, 330, 392, 0, 523, 0, 0, 0, 440, 0, 0, 0,
                349, 349, 0, 349, 0, 294, 349, 0, 440, 0, 0, 0, 392, 0, 0, 0,
                330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 330, 0, 294, 0, 262, 0,
                392, 392, 0, 392, 0, 330, 392, 0, 523, 0, 440, 0, 349, 392, 0, 0,
            ],
            waveType: 'square',
            baseVol: 0.09,
            echo: 0.15,
        },
        bonus: {
            bpm: 170,
            notes: [
                523, 0, 587, 0, 659, 0, 587, 0, 523, 0, 440, 0, 392, 0, 440, 0,
                523, 0, 587, 0, 659, 0, 784, 0, 659, 0, 587, 0, 523, 0, 440, 0,
                523, 0, 587, 0, 523, 0, 440, 0, 392, 0, 440, 0, 523, 0, 587, 0,
                659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 523, 0, 440, 0, 392, 0,
            ],
            waveType: 'square',
            baseVol: 0.1,
            echo: 0.2,
        },
        star: {
            bpm: 200,
            notes: [
                523, 659, 784, 659, 523, 659, 784, 880, 784, 659, 523, 440, 392, 440, 523, 659,
                784, 880, 988, 880, 784, 659, 523, 659, 784, 880, 988, 1047, 988, 880, 784, 659,
            ],
            waveType: 'square',
            baseVol: 0.11,
            echo: 0.1,
        },
        victory: {
            bpm: 130,
            notes: [
                523, 0, 659, 0, 784, 0, 1047, 0, 784, 0, 1047, 0, 0, 0, 0, 0,
                523, 659, 784, 880, 988, 1047, 1175, 1319, 0, 0, 0, 0, 0, 0, 0, 0,
                1047, 0, 0, 0, 784, 0, 0, 0, 523, 0, 0, 0, 659, 0, 784, 0,
                880, 0, 988, 0, 1047, 0, 1175, 0, 1319, 0, 0, 0, 1568, 0, 0, 0,
            ],
            waveType: 'square',
            baseVol: 0.12,
            echo: 0.25,
        },
        gameover: {
            bpm: 50,
            notes: [
                262, 0, 0, 0, 247, 0, 0, 0, 220, 0, 0, 0, 196, 0, 0, 0,
                175, 0, 0, 0, 165, 0, 0, 0, 147, 0, 0, 0, 131, 0, 0, 0,
            ],
            waveType: 'triangle',
            baseVol: 0.09,
            echo: 0.5,
        },
    };

    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            musicGain = audioCtx.createGain();
            sfxGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
            musicGain.connect(masterGain);
            sfxGain.connect(masterGain);
            masterGain.gain.setValueAtTime(masterVol, audioCtx.currentTime);
            musicGain.gain.setValueAtTime(musicVol, audioCtx.currentTime);
            sfxGain.gain.setValueAtTime(sfxVol, audioCtx.currentTime);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    function switchMusicTrack(trackName) {
        currentMusicTrack = trackName;
        musicTrackData = musicTracks[trackName];
        musicNoteIdx = 0;
        musicTimer = 0;
        musicNoteDuration = 60 / musicTrackData.bpm;
        musicActive = true;
    }

    function updateMusic(dt) {
        if (!audioCtx || !musicActive || !musicTrackData || !musicGain) return;
        musicTimer += dt;
        if (musicTimer >= musicNoteDuration) {
            musicTimer -= musicNoteDuration;
            const noteFreq = musicTrackData.notes[musicNoteIdx % musicTrackData.notes.length];
            musicNoteIdx++;
            if (noteFreq > 0) {
                const t = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.type = musicTrackData.waveType;
                osc.frequency.setValueAtTime(noteFreq, t);
                const vol = musicTrackData.baseVol;
                g.gain.setValueAtTime(vol, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + musicNoteDuration * 1.3);
                osc.connect(g);
                g.connect(musicGain);
                osc.start(t);
                osc.stop(t + musicNoteDuration * 1.5);
                // Echo
                if (musicTrackData.echo > 0) {
                    const osc2 = audioCtx.createOscillator();
                    const g2 = audioCtx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(noteFreq, t + musicNoteDuration * 0.4);
                    g2.gain.setValueAtTime(vol * musicTrackData.echo, t + musicNoteDuration * 0.4);
                    g2.gain.exponentialRampToValueAtTime(0.001, t + musicNoteDuration * 1.6);
                    osc2.connect(g2);
                    g2.connect(musicGain);
                    osc2.start(t + musicNoteDuration * 0.4);
                    osc2.stop(t + musicNoteDuration * 1.8);
                }
            }
        }
    }

    function stopMusic() {
        musicActive = false;
        currentMusicTrack = null;
        musicTrackData = null;
    }

    function updateAudioVolumes() {
        if (masterGain) masterGain.gain.setValueAtTime(masterVol, audioCtx.currentTime);
        if (musicGain) musicGain.gain.setValueAtTime(musicVol, audioCtx.currentTime);
        if (sfxGain) sfxGain.gain.setValueAtTime(sfxVol, audioCtx.currentTime);
    }

    function playTone(freq, duration, type = 'square', vol = 0.3) {
        if (!audioCtx || !sfxGain) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    function sfxJump() {
        playTone(220, 0.08, 'square', 0.22);
        playTone(380, 0.1, 'square', 0.18);
    }

    function sfxDoubleJump() {
        playTone(330, 0.06, 'square', 0.25);
        playTone(500, 0.08, 'square', 0.22);
        playTone(660, 0.1, 'square', 0.15);
    }

    function sfxCoin() {
        playTone(880, 0.05, 'square', 0.18);
        playTone(1100, 0.07, 'square', 0.16);
    }

    function sfxStomp() { playTone(70, 0.12, 'triangle', 0.28); }

    function sfxPowerup() {
        playTone(440, 0.06, 'square', 0.22);
        playTone(660, 0.06, 'square', 0.2);
        playTone(880, 0.1, 'square', 0.18);
    }

    function sfxDamage() { playTone(55, 0.2, 'sawtooth', 0.3); }

    function sfxStar() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => playTone(600 + i * 150, 0.08, 'square',
                0.22), i * 55);
        }
    }

    function sfxGoal() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => playTone(400 + i * 100, 0.12, 'square',
                0.28), i * 70);
        }
    }

    function sfxGameOver() {
        playTone(140, 0.25, 'sawtooth', 0.3);
        playTone(90, 0.35, 'triangle', 0.25);
    }

    function sfxShell() {
        playTone(170, 0.08, 'square', 0.18);
        playTone(240, 0.06, 'square', 0.16);
    }

    function sfxLand() { playTone(100, 0.05, 'triangle', 0.15); }

    //  GAME STATE 
    const STATE_MENU = 'menu';
    const STATE_OPTIONS = 'options';
    const STATE_PLAYING = 'playing';
    const STATE_BONUS = 'bonus';
    const STATE_GAMEOVER = 'gameover';
    const STATE_WIN = 'win';
    let gameState = STATE_MENU;
    let score = 0;
    let coins = 0;
    let lives = 3;
    let timeRemaining = 300;
    let lastTimeUpdate = 0;
    let checkpointX = 100;
    let checkpointY = 400;
    let invincibilityTimer = 0;
    let starPowerTimer = 0;
    let screenShake = 0;
    let bonusRoomReturnX = 0;
    let bonusRoomReturnY = 0;
    let particles = [];
    let floatingTexts = [];
    let prevGameState = STATE_MENU;

    // INPUT
    const keys = {};
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space') e.preventDefault();
        if (e.code === 'KeyA' || e.code === 'KeyD') e.preventDefault();
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') e.preventDefault();
        if (gameState === STATE_MENU && !audioCtx) initAudio();
    });
    window.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (e.code === 'KeyA' || e.code === 'KeyD') e.preventDefault();
    });

    //  PLAYER 
    const player = {
        x: 100,
        y: 400,
        width: 28,
        height: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        wasOnGround: true,
        isBig: false,
        isInvincible: false,
        facingRight: true,
        walkSpeed: 220,
        runSpeed: 380,
        maxSpeed: 380,
        acceleration: 800,
        deceleration: 600,
        jumpForce: -560,
        doubleJumpForce: -460,
        gravity: 950,
        maxFallSpeed: 650,
        animState: 'idle',
        animTimer: 0,
        animFrame: 0,
        doubleJumpAvailable: true,
        landingTimer: 0,
        idleTimer: 0,
        idleBlinkTimer: 2,
    };

    function resetPlayer(fullReset = false) {
        player.width = 28;
        player.height = 40;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        player.wasOnGround = true;
        player.isBig = false;
        player.isInvincible = false;
        player.animState = 'idle';
        player.animTimer = 0;
        player.animFrame = 0;
        player.facingRight = true;
        player.doubleJumpAvailable = true;
        player.landingTimer = 0;
        player.idleTimer = 0;
        player.idleBlinkTimer = 2;
        invincibilityTimer = 0;
        starPowerTimer = 0;
        if (fullReset) {
            player.x = 100;
            player.y = 400;
            checkpointX = 100;
            checkpointY = 400;
        } else {
            player.x = checkpointX;
            player.y = checkpointY;
        }
    }

    function makeBig() {
        if (!player.isBig) {
            player.isBig = true;
            player.width = 36;
            player.height = 56;
            player.y -= 16;
            sfxPowerup();
            spawnFloatingText(player.x, player.y - 10, 'BIG!', '#4af');
        }
    }

    function shrinkPlayer() {
        if (player.isBig) {
            player.isBig = false;
            player.width = 28;
            player.height = 40;
            player.y += 8;
            invincibilityTimer = 1.5;
            player.isInvincible = true;
            sfxDamage();
            spawnFloatingText(player.x, player.y - 10, 'Ouch!', '#f84');
        }
    }

    function killPlayer() {
        if (player.isInvincible && starPowerTimer <= 0) return;
        if (starPowerTimer > 0) return;
        if (player.isBig) { shrinkPlayer(); return; }
        lives--;
        sfxGameOver();
        screenShake = 0.4;
        spawnFloatingText(player.x, player.y - 10, 'DEAD', '#f44');
        if (lives <= 0) {
            gameState = STATE_GAMEOVER;
            updateGameOverUI();
            showOverlay(gameoverOverlay);
        } else {
            resetPlayer(false);
            timeRemaining = Math.max(timeRemaining, 60);
        }
    }

    function spawnFloatingText(x, y, text, color) {
        floatingTexts.push({ x, y, text, color, life: 1.2, vy: -140 });
    }

    //  CAMERA 
    const camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothSpeed: 6 };
    const LEVEL_WIDTH = 7000;
    const LEVEL_HEIGHT = INTERNAL_H;

    function updateCamera(dt) {
        camera.targetX = player.x - INTERNAL_W / 2 + player.width / 2;
        camera.targetY = player.y - INTERNAL_H / 2 + player.height / 2;
        camera.targetX = Math.max(0, Math.min(camera.targetX, LEVEL_WIDTH - INTERNAL_W));
        camera.targetY = Math.max(0, Math.min(camera.targetY, LEVEL_HEIGHT - INTERNAL_H));
        camera.x += (camera.targetX - camera.x) * Math.min(camera.smoothSpeed * dt, 1);
        camera.y += (camera.targetY - camera.y) * Math.min(camera.smoothSpeed * dt, 1);
    }

    //  LEVEL DATA 
    const TILE = 40;
    const GROUND_Y = 440;
    const groundSegments = [
        { startX: 0, endX: 800 }, { startX: 880, endX: 1400 }, { startX: 1500, endX: 2100 },
        { startX: 2200, endX: 2800 }, { startX: 2920, endX: 3500 }, { startX: 3620, endX: 4200 },
        { startX: 4320, endX: 5000 }, { startX: 5120, endX: 5700 }, { startX: 5820, endX: 6400 },
        { startX: 6500, endX: 7000 },
    ];
    const platforms = [
        { x: 300, y: 340, w: 3 }, { x: 500, y: 280, w: 4 }, { x: 750, y: 320, w: 3 },
        { x: 1000, y: 350, w: 5 }, { x: 1300, y: 290, w: 3 }, { x: 1600, y: 340, w: 4 },
        { x: 1900, y: 260, w: 3 }, { x: 2100, y: 310, w: 5 }, { x: 2500, y: 340, w: 4 },
        { x: 2800, y: 280, w: 3 }, { x: 3100, y: 350, w: 6 }, { x: 3400, y: 300, w: 3 },
        { x: 3700, y: 340, w: 4 }, { x: 4000, y: 260, w: 5 }, { x: 4400, y: 330, w: 3 },
        { x: 4700, y: 280, w: 4 }, { x: 5000, y: 350, w: 3 }, { x: 5300, y: 300, w: 5 },
        { x: 5600, y: 340, w: 3 }, { x: 5900, y: 270, w: 4 }, { x: 6200, y: 320, w: 3 },
        { x: 6600, y: 340, w: 4 },
    ];
    let questionBlocks = [
        { x: 350, y: 280, contains: 'coin', used: false }, { x: 550, y: 220, contains: 'protein', used: false },
        { x: 650, y: 220, contains: 'coin', used: false }, { x: 1050, y: 290, contains: 'coin', used: false },
        { x: 1350, y: 230, contains: 'star', used: false }, { x: 1650, y: 280, contains: 'coin', used: false },
        { x: 1950, y: 200, contains: 'protein', used: false }, { x: 2150, y: 250, contains: 'coin', used: false },
        { x: 2550, y: 280, contains: 'coin', used: false }, {
            x: 2850, y: 220, contains: 'loststar',
            used: false
        },
        { x: 3450, y: 240, contains: 'coin', used: false }, { x: 3750, y: 280, contains: 'protein', used: false },
        { x: 4050, y: 200, contains: 'star', used: false }, { x: 4450, y: 270, contains: 'coin', used: false },
        { x: 5050, y: 290, contains: 'coin', used: false }, {
            x: 5350, y: 240, contains: 'loststar',
            used: false
        },
        { x: 5950, y: 210, contains: 'protein', used: false }, { x: 6250, y: 260, contains: 'coin', used: false },
        { x: 6650, y: 280, contains: 'star', used: false },
    ];
    const bricks = [
        { x: 400, y: 300, w: 2, h: 1 }, { x: 600, y: 320, w: 1, h: 1 }, { x: 1100, y: 310, w: 2, h: 1 },
        { x: 1400, y: 250, w: 1, h: 1 }, { x: 1700, y: 300, w: 3, h: 1 }, { x: 2000, y: 220, w: 2, h: 1 },
        { x: 2600, y: 300, w: 2, h: 1 }, { x: 3200, y: 310, w: 3, h: 1 }, { x: 3500, y: 260, w: 1, h: 1 },
        { x: 4100, y: 220, w: 2, h: 1 }, { x: 4800, y: 240, w: 2, h: 1 }, { x: 5400, y: 260, w: 3, h: 1 },
        { x: 6000, y: 230, w: 2, h: 1 },
    ];
    let coinItems = [];
    const pipes = [
        { x: 900, y: GROUND_Y - 80, width: 50, height: 80, isEntrance: true, bonusId: 0, isExit: false },
        { x: 3000, y: GROUND_Y - 70, width: 50, height: 70, isEntrance: true, bonusId: 1, isExit: false },
        { x: 5500, y: GROUND_Y - 90, width: 50, height: 90, isEntrance: true, bonusId: 2, isExit: false },
    ];
    let enemies = [];
    let groundItems = [];
    let shells = [];
    let projectiles = [];
    const GOAL_STAR_X = 6850;
    const GOAL_STAR_Y = 300;

    function generateCoins() {
        coinItems = [];
        const coinPositions = [
            [320, 310],
            [360, 310],
            [400, 310],
            [520, 250],
            [560, 250],
            [780, 290],
            [820, 290],
            [1020, 320],
            [1060, 320],
            [1100, 320],
            [1320, 260],
            [1360, 260],
            [1620, 310],
            [1660, 310],
            [1920, 230],
            [1960, 230],
            [2120, 280],
            [2160, 280],
            [2520, 310],
            [2560, 310],
            [2820, 250],
            [2860, 250],
            [3120, 320],
            [3160, 320],
            [3420, 270],
            [3460, 270],
            [3720, 310],
            [3760, 310],
            [4020, 230],
            [4060, 230],
            [4420, 300],
            [4460, 300],
            [4720, 250],
            [4760, 250],
            [5020, 320],
            [5060, 320],
            [5320, 270],
            [5360, 270],
            [5620, 310],
            [5660, 310],
            [5920, 240],
            [5960, 240],
            [6220, 290],
            [6260, 290],
            [6620, 310],
            [6660, 310],
        ];
        coinPositions.forEach(([cx, cy]) => { coinItems.push({ x: cx, y: cy, collected: false }); });
    }

    function generateEnemies() {
        enemies = [
            {
                type: 'alien', x: 400, y: GROUND_Y - 30, width: 24, height: 24, vx: -60, vy: 0, alive: true,
                patrolMin: 320, patrolMax: 550, onGround: true
            },
            {
                type: 'alien', x: 700, y: GROUND_Y - 30, width: 24, height: 24, vx: -50, vy: 0, alive: true,
                patrolMin: 600, patrolMax: 780, onGround: true
            },
            {
                type: 'alien', x: 1200, y: GROUND_Y - 30, width: 24, height: 24, vx: 55, vy: 0, alive: true,
                patrolMin: 1050, patrolMax: 1350, onGround: true
            },
            {
                type: 'alien', x: 1800, y: GROUND_Y - 30, width: 24, height: 24, vx: -60, vy: 0, alive: true,
                patrolMin: 1700, patrolMax: 1950, onGround: true
            },
            {
                type: 'alien', x: 2400, y: GROUND_Y - 30, width: 24, height: 24, vx: 50, vy: 0, alive: true,
                patrolMin: 2250, patrolMax: 2550, onGround: true
            },
            {
                type: 'alien', x: 3200, y: GROUND_Y - 30, width: 24, height: 24, vx: -55, vy: 0, alive: true,
                patrolMin: 3100, patrolMax: 3400, onGround: true
            },
            {
                type: 'alien', x: 3800, y: GROUND_Y - 30, width: 24, height: 24, vx: 60, vy: 0, alive: true,
                patrolMin: 3650, patrolMax: 3950, onGround: true
            },
            {
                type: 'alien', x: 4500, y: GROUND_Y - 30, width: 24, height: 24, vx: -50, vy: 0, alive: true,
                patrolMin: 4350, patrolMax: 4700, onGround: true
            },
            {
                type: 'alien', x: 5200, y: GROUND_Y - 30, width: 24, height: 24, vx: 55, vy: 0, alive: true,
                patrolMin: 5150, patrolMax: 5450, onGround: true
            },
            {
                type: 'alien', x: 5800, y: GROUND_Y - 30, width: 24, height: 24, vx: -60, vy: 0, alive: true,
                patrolMin: 5700, patrolMax: 6000, onGround: true
            },
            {
                type: 'turtle', x: 600, y: GROUND_Y - 22, width: 24, height: 20, vx: -35, vy: 0, alive: true,
                inShell: false, shellVx: 0, patrolMin: 500, patrolMax: 700, onGround: true
            },
            {
                type: 'turtle', x: 1500, y: GROUND_Y - 22, width: 24, height: 20, vx: 35, vy: 0, alive: true,
                inShell: false, shellVx: 0, patrolMin: 1400, patrolMax: 1600, onGround: true
            },
            {
                type: 'turtle', x: 2700, y: GROUND_Y - 22, width: 24, height: 20, vx: -30, vy: 0, alive: true,
                inShell: false, shellVx: 0, patrolMin: 2600, patrolMax: 2800, onGround: true
            },
            {
                type: 'turtle', x: 3500, y: GROUND_Y - 22, width: 24, height: 20, vx: 35, vy: 0, alive: true,
                inShell: false, shellVx: 0, patrolMin: 3400, patrolMax: 3600, onGround: true
            },
            {
                type: 'turtle', x: 4900, y: GROUND_Y - 22, width: 24, height: 20, vx: -35, vy: 0, alive: true,
                inShell: false, shellVx: 0, patrolMin: 4800, patrolMax: 5000, onGround: true
            },
            {
                type: 'avoma', x: 800, y: 180, width: 28, height: 24, vx: -70, vy: 0, alive: true, dropTimer: 2.5,
                flyMin: 700, flyMax: 900
            },
            {
                type: 'avoma', x: 2000, y: 150, width: 28, height: 24, vx: 65, vy: 0, alive: true, dropTimer: 3.0,
                flyMin: 1900, flyMax: 2200
            },
            {
                type: 'avoma', x: 3300, y: 170, width: 28, height: 24, vx: -75, vy: 0, alive: true, dropTimer: 2.8,
                flyMin: 3100, flyMax: 3500
            },
            {
                type: 'avoma', x: 4200, y: 160, width: 28, height: 24, vx: 70, vy: 0, alive: true, dropTimer: 3.2,
                flyMin: 4000, flyMax: 4400
            },
            {
                type: 'avoma', x: 5600, y: 175, width: 28, height: 24, vx: -65, vy: 0, alive: true, dropTimer: 2.6,
                flyMin: 5400, flyMax: 5800
            },
        ];
    }

    function generateGroundItems() {
        groundItems = [
            { type: 'protein', x: 1100, y: GROUND_Y - 20, width: 22, height: 22, collected: false },
            { type: 'star', x: 2300, y: GROUND_Y - 20, width: 22, height: 22, collected: false },
            { type: 'protein', x: 3600, y: GROUND_Y - 20, width: 22, height: 22, collected: false },
            { type: 'loststar', x: 1800, y: GROUND_Y - 20, width: 20, height: 20, collected: false },
            { type: 'loststar', x: 4300, y: GROUND_Y - 20, width: 20, height: 20, collected: false },
            { type: 'star', x: 5000, y: GROUND_Y - 20, width: 22, height: 22, collected: false },
            { type: 'protein', x: 5700, y: GROUND_Y - 20, width: 22, height: 22, collected: false },
        ];
    }

    function resetLevel() {
        generateCoins();
        generateEnemies();
        generateGroundItems();
        shells = [];
        projectiles = [];
        questionBlocks.forEach(qb => qb.used = false);
        particles = [];
        floatingTexts = [];
        timeRemaining = 300;
        lastTimeUpdate = 0;
        score = 0;
        coins = 0;
        lives = 3;
        checkpointX = 100;
        checkpointY = 400;
        resetPlayer(true);
        camera.x = 0;
        camera.y = 0;
        camera.targetX = 0;
        camera.targetY = 0;
    }

    function rectsCollide(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    function getGroundYAt(x) {
        for (const seg of groundSegments) { if (x >= seg.startX && x <= seg.endX) return GROUND_Y; }
        return 9999;
    }

    function getPlatformCollisions(x, y, width, height) {
        const colls = [];
        for (const plat of platforms) {
            const pw = plat.w * TILE;
            const pr = { x: plat.x, y: plat.y, width: pw, height: TILE };
            if (rectsCollide({ x, y, width, height }, pr)) colls.push(pr);
        }
        for (const brick of bricks) {
            const br = { x: brick.x, y: brick.y, width: brick.w * TILE, height: brick.h * TILE };
            if (rectsCollide({ x, y, width, height }, br)) colls.push(br);
        }
        for (const qb of questionBlocks) {
            if (qb.used) continue;
            const qr = { x: qb.x, y: qb.y, width: TILE, height: TILE };
            if (rectsCollide({ x, y, width, height }, qr)) colls.push({ ...qr, isQuestion: true, qbRef: qb });
        }
        for (const qb of questionBlocks) {
            if (!qb.used) continue;
            const qr = { x: qb.x, y: qb.y, width: TILE, height: TILE };
            if (rectsCollide({ x, y, width, height }, qr)) colls.push({ ...qr, isUsedQuestion: true });
        }
        for (const pipe of pipes) {
            const pr = { x: pipe.x, y: pipe.y, width: pipe.width, height: pipe.height };
            if (rectsCollide({ x, y, width, height }, pr)) colls.push({ ...pr, isPipe: true, pipeRef: pipe });
        }
        return colls;
    }

    function resolveCollisions(entity, dt) {
        const allColls = getPlatformCollisions(entity.x, entity.y, entity.width, entity.height);
        const groundY = getGroundYAt(entity.x + entity.width / 2);
        const footY = entity.y + entity.height;
        if (footY >= groundY && groundY < 9000 && entity.vy >= 0) {
            entity.y = groundY - entity.height;
            entity.vy = 0;
            entity.onGround = true;
        }
        let resolvedGround = entity.onGround;
        for (const coll of allColls) {
            const overlapX = Math.min(entity.x + entity.width, coll.x + coll.width) - Math.max(entity.x, coll.x);
            const overlapY = Math.min(entity.y + entity.height, coll.y + coll.height) - Math.max(entity.y, coll
                .y);
            if (overlapX <= 0 || overlapY <= 0) continue;
            const fromTop = entity.y + entity.height - coll.y;
            const fromBottom = coll.y + coll.height - entity.y;
            const fromLeft = entity.x + entity.width - coll.x;
            const fromRight = coll.x + coll.width - entity.x;
            const minVal = Math.min(fromTop, fromBottom, fromLeft, fromRight);
            if (minVal === fromTop && entity.vy >= 0 && fromTop < entity.height * 0.8) {
                entity.y = coll.y - entity.height;
                entity.vy = 0;
                resolvedGround = true;
            } else if (minVal === fromBottom && entity.vy < 0 && fromBottom < entity.height * 0.6) {
                entity.y = coll.y + coll.height;
                entity.vy = Math.max(entity.vy, 0);
                if (coll.isQuestion && coll.qbRef && !coll.qbRef.used) activateQuestionBlock(coll.qbRef);
            } else if (minVal === fromLeft && entity.vx > 0) {
                entity.x = coll.x - entity.width;
                entity.vx = 0;
            } else if (minVal === fromRight && entity.vx < 0) {
                entity.x = coll.x + coll
                    .width;
                entity.vx = 0;
            }
        }
        entity.onGround = resolvedGround;
        if (entity.y > INTERNAL_H + 100 && entity === player) killPlayer();
    }

    function activateQuestionBlock(qb) {
        if (qb.used) return;
        qb.used = true;
        const itemType = qb.contains;
        if (itemType === 'coin') {
            coins++;
            score += 100;
            sfxCoin();
            spawnFloatingText(qb.x, qb.y - 20, '+100', '#ffd740'); if (coins >= 100) {
                coins -= 100;
                lives++;
                spawnFloatingText(qb.x, qb.y - 40, '1UP!', '#4f4');
            }
        } else if (itemType === 'protein') {
            groundItems.push({
                type: 'protein', x: qb.x + 5, y: qb.y - 26, width: 22, height: 22,
                collected: false, vy: -150
            });
        } else if (itemType === 'star') {
            groundItems.push({
                type: 'star',
                x: qb.x + 5, y: qb.y - 26, width: 22, height: 22, collected: false, vy: -150
            });
        } else if (
            itemType === 'loststar') {
                groundItems.push({
                    type: 'loststar', x: qb.x + 5, y: qb.y - 26, width: 20,
                    height: 20, collected: false, vy: -120
                });
        }
        particles.push({
            x: qb.x + TILE / 2, y: qb.y, vx: (Math.random() - 0.5) * 80, vy: -100 - Math.random() *
                150, life: 0.6, color: '#ccc', size: 3
        });
    }

    const bonusRooms = [
        {
            id: 0, coins: [{ x: 7220, y: 430 }, { x: 7250, y: 430 }, { x: 7280, y: 430 }, { x: 7240, y: 400 },
            { x: 7270, y: 400 }
            ], exitPipeX: 7200, exitPipeY: 460, exitPipeW: 50, exitPipeH: 80, returnX: 920,
            returnY: GROUND_Y - 100
        },
        {
            id: 1, coins: [{ x: 7320, y: 430 }, { x: 7350, y: 430 }, { x: 7380, y: 430 }, { x: 7340, y: 400 },
            { x: 7370, y: 400 }, { x: 7330, y: 370 }
            ], exitPipeX: 7300, exitPipeY: 460, exitPipeW: 50, exitPipeH: 70, returnX: 3020,
            returnY: GROUND_Y - 90
        },
        {
            id: 2, coins: [{ x: 7420, y: 430 }, { x: 7450, y: 430 }, { x: 7480, y: 430 }, { x: 7440, y: 400 },
            { x: 7470, y: 400 }, { x: 7430, y: 370 }, { x: 7460, y: 370 }
            ], exitPipeX: 7400, exitPipeY: 460, exitPipeW: 50, exitPipeH: 90, returnX: 5520,
            returnY: GROUND_Y - 110
        },
    ];
    let bonusRoomCoins = [];
    let currentBonusRoom = null;

    function enterBonusRoom(bonusId) {
        const room = bonusRooms.find(r => r.id === bonusId);
        if (!room) return;
        currentBonusRoom = room;
        bonusRoomCoins = room.coins.map(c => ({ ...c, collected: false }));
        bonusRoomReturnX = room.returnX;
        bonusRoomReturnY = room.returnY;
        player.x = room.exitPipeX + room.exitPipeW + 10;
        player.y = room.exitPipeY - player.height;
        player.vy = 0;
        player.vx = 0;
        gameState = STATE_BONUS;
        camera.x = 7150;
        camera.y = 350;
        camera.targetX = 7180;
        camera.targetY = 350;
    }

    function exitBonusRoom() {
        player.x = bonusRoomReturnX;
        player.y = bonusRoomReturnY;
        player.vy = 0;
        player.vx = 0;
        player.onGround = false;
        currentBonusRoom = null;
        bonusRoomCoins = [];
        gameState = STATE_PLAYING;
        camera.targetX = player.x - INTERNAL_W / 2;
        camera.targetY = player.y - INTERNAL_H / 2;
    }

    let spacePrev = false;

    function updatePlayer(dt) {
        if (gameState !== STATE_PLAYING && gameState !== STATE_BONUS) return;
        const aDown = keys['KeyA'] || false;
        const dDown = keys['KeyD'] || false;
        const shiftDown = keys['ShiftLeft'] || keys['ShiftRight'] || false;
        const spaceDown = keys['Space'] || false;
        const targetSpeed = shiftDown ? player.runSpeed : player.walkSpeed;

        // Horizontal movement with acceleration/deceleration
        if (aDown && !dDown) {
            player.vx = Math.max(player.vx - player.acceleration * dt, -targetSpeed);
            player.facingRight = false;
        } else if (dDown && !aDown) {
            player.vx = Math.min(player.vx + player.acceleration * dt, targetSpeed);
            player.facingRight = true;
        } else {
            // Deceleration
            if (player.vx > 0) player.vx = Math.max(0, player.vx - player.deceleration * dt);
            else if (player.vx < 0) player.vx = Math.min(0, player.vx + player.deceleration * dt);
        }

        // Jumping and double jump
        const spacePressed = spaceDown && !spacePrev;
        if (spacePressed) {
            if (player.onGround) {
                player.vy = player.jumpForce;
                player.onGround = false;
                player.doubleJumpAvailable = true;
                sfxJump();
            } else if (player.doubleJumpAvailable && !player.onGround) {
                player.vy = player.doubleJumpForce;
                player.doubleJumpAvailable = false;
                sfxDoubleJump();
                spawnFloatingText(player.x, player.y - 10, 'Double!', '#8af');
            }
        }
        spacePrev = spaceDown;
        if (!spaceDown && player.vy < -120) player.vy *= 0.75;
        player.vy += player.gravity * dt;
        if (player.vy > player.maxFallSpeed) player.vy = player.maxFallSpeed;
        player.x += player.vx * dt;
        player.y += player.vy * dt;
        if (player.x < 0) player.x = 0;
        if (player.x > LEVEL_WIDTH - player.width) player.x = LEVEL_WIDTH - player.width;
        player.wasOnGround = player.onGround;
        player.onGround = false;
        resolveCollisions(player, dt);
        if (player.onGround && !player.wasOnGround) {
            player.landingTimer = 0.15;
            sfxLand();
        }
        if (player.onGround) player.doubleJumpAvailable = true;
        if (player.landingTimer > 0) player.landingTimer -= dt;

        // Animation state
        if (!player.onGround) {
            if (player.vy < -50) player.animState = 'jump';
            else player.animState = 'fall';
        } else if (player.landingTimer > 0) {
            player.animState = 'land';
        } else if (Math.abs(player.vx) > 5) {
            player.animState = Math.abs(player.vx) > player.walkSpeed + 20 ? 'run' : 'walk';
        } else {
            player.animState = 'idle';
        }
        // Update animation
        const animSpeeds = { idle: 1.5, walk: 0.1, run: 0.06, jump: 0, fall: 0, land: 0.08 };
        const animFrames = { idle: 4, walk: 6, run: 6, jump: 1, fall: 1, land: 2 };
        const spd = animSpeeds[player.animState] || 0.12;
        const maxF = animFrames[player.animState] || 4;
        player.animTimer += dt;
        if (player.animTimer > spd && spd > 0) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % maxF;
        }
        if (player.animState === 'jump') player.animFrame = 0;
        if (player.animState === 'fall') player.animFrame = 1;
        player.idleTimer += dt;
        if (player.idleTimer > player.idleBlinkTimer) {
            player.idleTimer = 0;
            player.idleBlinkTimer = 1.5 + Math.random() * 3;
        }
        if (invincibilityTimer > 0) {
            invincibilityTimer -= dt; if (invincibilityTimer <= 0) {
                player
                    .isInvincible = false;
                invincibilityTimer = 0;
            }
        }
        if (starPowerTimer > 0) {
            starPowerTimer -= dt; if (starPowerTimer <= 0) {
                starPowerTimer = 0;
                player.isInvincible = false;
            }
        }
        // Pipe entry
        if (player.onGround && gameState === STATE_PLAYING) {
            for (const pipe of pipes) {
                if (pipe.isEntrance && !pipe.isExit) {
                    const pipeTop = { x: pipe.x, y: pipe.y, width: pipe.width, height: 16 };
                    const playerFoot = {
                        x: player.x, y: player.y + player.height - 8, width: player.width,
                        height: 10
                    };
                    if (rectsCollide(playerFoot, pipeTop) && player.vy >= 0 && (keys['KeyW'] || keys['KeyS'])) {
                        enterBonusRoom(pipe.bonusId);
                        break;
                    }
                }
            }
        }
        if (gameState === STATE_BONUS && currentBonusRoom && player.onGround) {
            const ep = {
                x: currentBonusRoom.exitPipeX, y: currentBonusRoom.exitPipeY, width: currentBonusRoom
                    .exitPipeW, height: 16
            };
            const pf = { x: player.x, y: player.y + player.height - 8, width: player.width, height: 10 };
            if (rectsCollide(pf, ep) && player.vy >= 0 && (keys['KeyW'] || keys['KeyS'])) exitBonusRoom();
        }
        if (gameState === STATE_PLAYING) {
            const goalRect = { x: GOAL_STAR_X - 30, y: GOAL_STAR_Y - 40, width: 60, height: 80 };
            const pRect = { x: player.x, y: player.y, width: player.width, height: player.height };
            if (rectsCollide(pRect, goalRect)) {
                score += 5000;
                sfxGoal();
                gameState = STATE_WIN;
                updateWinUI();
                showOverlay(winOverlay);
            }
        }
        if (player.onGround && player.x > checkpointX + 400 && gameState === STATE_PLAYING) {
            checkpointX = player
                .x;
            checkpointY = player.y;
        }
    }

    function updateEnemies(dt) {
        if (gameState !== STATE_PLAYING && gameState !== STATE_BONUS) return;
        if (gameState === STATE_BONUS) return;
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            if (enemy.type === 'alien' || enemy.type === 'turtle') {
                if (enemy.inShell) {
                    enemy.shellVx = enemy.shellVx || 0;
                    if (Math.abs(enemy.shellVx) < 5) enemy.shellVx = 0;
                    enemy.x += enemy.shellVx * dt;
                    const gy = getGroundYAt(enemy.x + enemy.width / 2);
                    if (enemy.y + enemy.height >= gy && gy < 9000) enemy.y = gy - enemy.height;
                    const pcolls = getPlatformCollisions(enemy.x, enemy.y, enemy.width, enemy.height);
                    for (const pc of pcolls) {
                        if (enemy.shellVx > 0) enemy.x = pc.x - enemy.width;
                        else if (enemy.shellVx < 0) enemy.x = pc.x + pc.width;
                        enemy.shellVx = 0;
                    }
                    for (const other of enemies) {
                        if (other === enemy || !other.alive) continue;
                        if (rectsCollide({ x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }, {
                            x: other
                                .x, y: other.y, width: other.width, height: other.height
                        })) {
                            other.alive =
                            false;
                            score += 200;
                            sfxStomp();
                            spawnFloatingText(other.x, other.y - 10, '+200', '#ff8');
                            particles.push({
                                x: other.x + other.width / 2, y: other.y + other.height / 2, vx: (Math
                                    .random() - 0.5) * 100, vy: -80 - Math.random() * 120, life: 0.5,
                                color: '#f84', size: 4
                            });
                        }
                    }
                    if (enemy.y > INTERNAL_H + 100 || enemy.x < -100 || enemy.x > LEVEL_WIDTH + 100) enemy.alive =
                        false;
                } else {
                    enemy.x += enemy.vx * dt;
                    enemy.y += enemy.vy * dt;
                    if (enemy.vy < 600) enemy.vy += 1000 * dt;
                    const gy = getGroundYAt(enemy.x + enemy.width / 2);
                    if (enemy.y + enemy.height >= gy && gy < 9000 && enemy.vy >= 0) {
                        enemy.y = gy - enemy.height;
                        enemy.vy = 0;
                        enemy.onGround = true;
                    }
                    const pcolls = getPlatformCollisions(enemy.x, enemy.y, enemy.width, enemy.height);
                    for (const pc of pcolls) {
                        const overlapY = Math.min(enemy.y + enemy.height, pc.y + pc.height) - Math.max(enemy.y,
                            pc.y);
                        if (overlapY > 0 && enemy.vy >= 0 && enemy.y + enemy.height - pc.y < 20) {
                            enemy.y = pc.y -
                                enemy.height;
                            enemy.vy = 0;
                            enemy.onGround = true;
                        } else if (enemy.vx > 0) {
                            enemy.x = pc.x - enemy.width;
                            enemy.vx *= -1;
                        } else if (enemy.vx < 0) {
                            enemy.x = pc.x + pc.width;
                            enemy.vx *= -1;
                        }
                    }
                    if (enemy.x <= enemy.patrolMin) {
                        enemy.x = enemy.patrolMin;
                        enemy.vx = Math.abs(enemy.vx);
                    }
                    if (enemy.x + enemy.width >= enemy.patrolMax) {
                        enemy.x = enemy.patrolMax - enemy.width;
                        enemy.vx = -Math.abs(enemy.vx);
                    }
                    if (enemy.y > INTERNAL_H + 150) enemy.alive = false;
                }
            } else if (enemy.type === 'avoma') {
                enemy.x += enemy.vx * dt;
                if (enemy.x <= enemy.flyMin) {
                    enemy.x = enemy.flyMin;
                    enemy.vx = Math.abs(enemy.vx);
                }
                if (enemy.x + enemy.width >= enemy.flyMax) {
                    enemy.x = enemy.flyMax - enemy.width;
                    enemy.vx = -Math.abs(enemy.vx);
                }
                enemy.dropTimer -= dt;
                if (enemy.dropTimer <= 0) {
                    enemy.dropTimer = 2.5 + Math.random() * 2;
                    projectiles.push({
                        x: enemy.x + enemy.width / 2 - 6, y: enemy.y + enemy.height, width: 12,
                        height: 12, vy: 100, alive: true
                    });
                }
            }
        }
        for (const proj of projectiles) {
            if (!proj.alive) continue;
            proj.vy += 600 * dt;
            proj.y += proj.vy * dt; if (proj.y > INTERNAL_H + 50) proj.alive = false;
        }
        for (const shell of shells) {
            if (Math.abs(shell.vx) < 5) shell.vx = 0;
            shell.x += shell.vx * dt; const gy = getGroundYAt(shell.x + shell.width / 2); if (shell.y + shell
                .height >= gy && gy < 9000) shell.y = gy - shell.height; if (shell.y > INTERNAL_H + 100 || shell
                    .x < -100 || shell.x > LEVEL_WIDTH + 100) shell.alive = false;
        }
        enemies = enemies.filter(e => e.alive);
        projectiles = projectiles.filter(p => p.alive);
        shells = shells.filter(s => s.alive);
    }

    function updateItems(dt) {
        if (gameState !== STATE_PLAYING && gameState !== STATE_BONUS) return;
        for (const item of groundItems) {
            if (item.vy !== undefined && item.vy < 0) {
                item.y += item.vy * dt;
                item.vy += 600 * dt; const gy = getGroundYAt(item.x + item.width / 2); if (item.y + item.height >=
                    gy && gy < 9000 && item.vy > 0) {
                        item.y = gy - item.height;
                    item.vy = 0;
                }
            }
        }
        const pRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        for (const item of groundItems) {
            if (item.collected) continue;
            const iRect = { x: item.x, y: item.y, width: item.width, height: item.height };
            if (rectsCollide(pRect, iRect)) {
                item.collected = true; if (item.type === 'protein') {
                    makeBig();
                    score += 300;
                } else if (item.type === 'star') {
                    starPowerTimer = 10;
                    player.isInvincible = true;
                    score += 500;
                    sfxStar();
                    spawnFloatingText(item.x, item.y - 10, 'STAR!', '#ff0');
                } else if (item.type === 'loststar') {
                    if (starPowerTimer > 0) score += 200;
                    else killPlayer();
                }
            }
        }
        groundItems = groundItems.filter(i => !i.collected);
        for (const coin of coinItems) {
            if (coin.collected) continue;
            const cRect = { x: coin.x, y: coin.y, width: 14, height: 14 };
            if (rectsCollide(pRect, cRect)) {
                coin.collected = true;
                coins++;
                score += 50;
                sfxCoin();
                particles.push({
                    x: coin.x, y: coin.y, vx: (Math.random() - 0.5) * 40, vy: -60 - Math.random() *
                        60, life: 0.4, color: '#ffd740', size: 2
                }); if (coins >= 100) {
                    coins -= 100;
                    lives++;
                    spawnFloatingText(coin.x, coin.y - 15, '1UP!', '#4f4');
                }
            }
        }
        coinItems = coinItems.filter(c => !c.collected);
        if (gameState === STATE_BONUS && bonusRoomCoins.length > 0) {
            for (const bc of bonusRoomCoins) {
                if (bc.collected) continue; const bcRect = {
                    x: bc.x, y: bc.y,
                    width: 14, height: 14
                }; if (rectsCollide(pRect, bcRect)) {
                    bc.collected = true;
                    coins++;
                    score += 100;
                    sfxCoin(); if (coins >= 100) {
                        coins -= 100;
                        lives++;
                    }
                }
            }
        }
        if (gameState === STATE_PLAYING) {
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const eRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
                if (rectsCollide(pRect, eRect)) {
                    const playerBottom = player.y + player.height;
                    const enemyTop = enemy.y;
                    const playerWasAbove = player.vy > 0 && (playerBottom - enemyTop) < 25;
                    if (starPowerTimer > 0) {
                        enemy.alive = false;
                        score += 200;
                        sfxStomp();
                        spawnFloatingText(enemy.x, enemy.y - 10, '+200', '#ff0');
                        particles.push({
                            x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2, vx: (Math
                                .random() - 0.5) * 120, vy: -100 - Math.random() * 150, life: 0.5,
                            color: '#ff0', size: 5
                        });
                    } else if (playerWasAbove && player.vy > 50) {
                        if (enemy.type === 'turtle' && !enemy.inShell) {
                            enemy.inShell = true;
                            enemy.height = 14;
                            enemy.y += 6;
                            enemy.vx = 0;
                            enemy.shellVx = 0;
                            sfxShell();
                            score += 150;
                            spawnFloatingText(enemy.x, enemy.y - 10, '+150', '#ff8');
                        } else if (enemy.type ===
                            'turtle' && enemy.inShell && Math.abs(enemy.shellVx) < 5) {
                                enemy.shellVx =
                                400;
                            sfxShell();
                            score += 100;
                        } else if (enemy.type === 'turtle' && enemy.inShell && Math.abs(enemy
                            .shellVx) > 5) {
                                enemy.shellVx = 0;
                            sfxShell();
                        } else {
                            enemy.alive = false;
                            score += 150;
                            sfxStomp();
                            spawnFloatingText(enemy.x, enemy.y - 10, '+150', '#ff8');
                            particles.push({
                                x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2, vx: (Math
                                    .random() - 0.5) * 80, vy: -80 - Math.random() * 100, life: 0.4,
                                color: '#8f8', size: 3
                            });
                        }
                        player.vy = -280;
                    } else { if (!player.isInvincible) killPlayer(); }
                }
            }
            for (const proj of projectiles) {
                if (!proj.alive) continue; const prRect = {
                    x: proj.x, y: proj.y,
                    width: proj.width, height: proj.height
                }; if (rectsCollide(pRect, prRect)) {
                    proj.alive =
                    false; if (!player.isInvincible && starPowerTimer <= 0) killPlayer();
                }
            }
            for (const shell of shells) {
                if (!shell.alive) continue; const sRect = {
                    x: shell.x, y: shell.y,
                    width: shell.width, height: shell.height
                }; if (rectsCollide(pRect, sRect)) {
                    if (
                        starPowerTimer > 0) {
                            shell.alive = false;
                        score += 200;
                    } else if (!player.isInvincible) killPlayer();
                }
            }
        }
        enemies = enemies.filter(e => e.alive);
        projectiles = projectiles.filter(p => p.alive);
        shells = shells.filter(s => s.alive);
    }

    function updateParticles(dt) {
        for (const p of particles) {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
        }
        particles = particles.filter(p => p.life > 0);
        for (const ft of floatingTexts) {
            ft.life -= dt;
            ft.y += ft.vy * dt;
        }
        floatingTexts = floatingTexts.filter(ft => ft.life > 0);
    }

    function updateTimer(dt) {
        if (gameState !== STATE_PLAYING && gameState !== STATE_BONUS) return;
        lastTimeUpdate += dt; if (lastTimeUpdate >= 1.0) {
            lastTimeUpdate -= 1.0;
            timeRemaining--; if (timeRemaining <= 0) {
                timeRemaining = 0;
                killPlayer(); if (lives > 0) timeRemaining = 60;
            }
        }
    }

    function updateMusicState() {
        if (gameState !== prevGameState) {
            prevGameState = gameState;
            if (gameState === STATE_MENU || gameState === STATE_OPTIONS) switchMusicTrack(MUSIC_MENU);
            else if (gameState === STATE_PLAYING) {
                if (starPowerTimer > 0) switchMusicTrack(MUSIC_STAR);
                else switchMusicTrack(MUSIC_GAMEPLAY);
            } else if (gameState === STATE_BONUS) switchMusicTrack(MUSIC_BONUS);
            else if (gameState === STATE_WIN) switchMusicTrack(MUSIC_VICTORY);
            else if (gameState === STATE_GAMEOVER) switchMusicTrack(MUSIC_GAMEOVER);
        }
        if (gameState === STATE_PLAYING && starPowerTimer > 0 && currentMusicTrack !== MUSIC_STAR) {
            switchMusicTrack(MUSIC_STAR);
        } else if (gameState === STATE_PLAYING && starPowerTimer <= 0 && currentMusicTrack === MUSIC_STAR) {
            switchMusicTrack(MUSIC_GAMEPLAY);
        }
    }

    function update(dt) {
        updateMusicState();
        updateMusic(dt);
        if (gameState !== STATE_PLAYING && gameState !== STATE_BONUS) { updateParticles(dt); return; }
        const cappedDt = Math.min(dt, 0.1);
        updatePlayer(cappedDt);
        updateEnemies(cappedDt);
        updateItems(cappedDt);
        updateParticles(cappedDt);
        updateTimer(cappedDt);
        updateCamera(cappedDt);
        if (screenShake > 0) screenShake -= cappedDt;
    }

    // RENDER 
    function drawPixelChar(x, y, w, h, colors, pixels, flipX = false) {
        const pxW = w / 8;
        const pxH = h / 8;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const colorIdx = pixels[row * 8 + col];
                if (colorIdx >= 0 && colorIdx < colors.length) {
                    const destCol = flipX ? (7 - col) : col;
                    ctx.fillStyle = colors[colorIdx];
                    ctx.fillRect(Math.floor(x + destCol * pxW), Math.floor(y + row * pxH), Math.ceil(pxW), Math
                        .ceil(pxH));
                }
            }
        }
    }

    function drawLilBro(x, y, w, h, isInvincible, animFrame, animState, facingRight, idleTimer) {
        const flash = isInvincible && Math.floor(Date.now() / 80) % 2 === 0;
        const colors = flash ? ['#fff', '#aaf', '#eef', '#111', '#ff8', '#667', '#faa', '#8cf'] :
            ['#fff', '#3388ff', '#ddeeff', '#111', '#ffaa30', '#556', '#ff8866', '#88ccff'];

        let pixels;
        if (animState === 'idle') {
            const breathe = Math.sin(idleTimer * 2.5) * 0.5;
            const blink = idleTimer % 4 < 0.15 ? 3 : 2;
            pixels = [
                -1, 0, 0, 0, 0, 0, -1, -1,
                0, 0, 0, 0, 0, 0, 0, -1,
                0, 0, blink, blink, blink, blink, 0, 0,
                0, 0, blink, 4, 4, blink, 0, 0,
                0, 1, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 5, 5, 0, 1, 0,
                -1, 0, 1, 0, 0, 1, 0, -1,
                -1, -1, 0, 1, 1, 0, -1, -1,
            ];
        } else if (animState === 'walk' || animState === 'run') {
            const legPhase = animFrame;
            const armSwing = Math.sin(legPhase * Math.PI / 3) * 2;
            pixels = [
                -1, 0, 0, 0, 0, 0, -1, -1,
                0, 0, 0, 0, 0, 0, 0, -1,
                0, 0, 2, 2, 2, 2, 0, 0,
                0, 0, 2, 4, 4, 2, 0, 0,
                0, 1, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 5, 5, 0, 1, 0,
                -1, 0, 1, 0, 0, 1, 0, -1,
                -1, -1, 0, 1, 1, 0, -1, -1,
            ];
        } else if (animState === 'jump') {
            pixels = [
                -1, 0, 0, 0, 0, 0, 0, -1,
                0, 0, 0, 0, 0, 0, 0, -1,
                0, 0, 2, 2, 2, 2, 0, 0,
                0, 0, 2, 4, 4, 2, 0, 0,
                0, 1, 0, 0, 0, 0, 1, 0,
                -1, 0, 1, 5, 5, 1, 0, -1,
                -1, -1, 0, 1, 1, 0, -1, -1,
                -1, -1, -1, 0, 0, -1, -1, -1,
            ];
        } else if (animState === 'fall') {
            pixels = [
                -1, -1, 0, 0, 0, 0, -1, -1,
                -1, 0, 0, 0, 0, 0, 0, -1,
                0, 0, 2, 2, 2, 2, 0, 0,
                0, 0, 2, 4, 4, 2, 0, 0,
                -1, 1, 0, 0, 0, 0, 1, -1,
                -1, -1, 1, 5, 5, 1, -1, -1,
                0, 1, 0, 0, 0, 0, 1, 0,
                -1, 0, 0, 1, 1, 0, 0, -1,
            ];
        } else if (animState === 'land') {
            const squash = animFrame === 0 ? 0.9 : 1.0;
            pixels = [
                -1, 0, 0, 0, 0, 0, -1, -1,
                0, 0, 0, 0, 0, 0, 0, -1,
                0, 0, 2, 2, 2, 2, 0, 0,
                0, 0, 2, 4, 4, 2, 0, 0,
                0, 1, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 5, 5, 0, 1, 0,
                0, 0, 1, 0, 0, 1, 0, 0,
                -1, 0, 0, 1, 1, 0, 0, -1,
            ];
        } else {
            pixels = [
                -1, 0, 0, 0, 0, 0, -1, -1,
                0, 0, 0, 0, 0, 0, 0, -1,
                0, 0, 2, 2, 2, 2, 0, 0,
                0, 0, 2, 4, 4, 2, 0, 0,
                0, 1, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 5, 5, 0, 1, 0,
                -1, 0, 1, 0, 0, 1, 0, -1,
                -1, -1, 0, 1, 1, 0, -1, -1,
            ];
        }
        drawPixelChar(x, y, w, h, colors, pixels, !facingRight);
    }

    function drawBigBro(x, y, w, h, isInvincible, animFrame, animState, facingRight, idleTimer) {
        const flash = isInvincible && Math.floor(Date.now() / 80) % 2 === 0;
        const colors = flash ? ['#fff', '#55aaff', '#eef', '#111', '#ffbb40', '#778', '#faa', '#9df'] :
            ['#fff', '#4499ff', '#ddeeff', '#111', '#ffbb40', '#667', '#ff8866', '#99ddff'];
        const blink = idleTimer % 4 < 0.15 ? 3 : 2;
        const pixels = [
            -1, 0, 0, 0, 0, 0, 0, -1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, blink, blink, blink, blink, 0, 0,
            0, 0, blink, 4, 4, blink, 0, 0,
            0, 1, 0, 0, 0, 0, 1, 0,
            0, 1, 0, 5, 5, 0, 1, 0,
            0, 1, 1, 0, 0, 1, 1, 0,
            0, 0, 1, 1, 1, 1, 0, 0,
        ];
        drawPixelChar(x, y, w, h, colors, pixels, !facingRight);
    }

    function drawAlien(x, y, w, h) {
        const colors = ['#2d8', '#1a5', '#000', '#fff', '#ff0'];
        const pixels = [
            -1, -1, 0, 0, 0, 0, -1, -1, -1, 0, 0, 0, 0, 0, 0, -1,
            0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 3, 4, 4, 3, 0, 0,
            0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 1, 0, 0, 1, 0, -1,
            -1, 0, 0, 1, 1, 0, 0, -1, -1, -1, 0, 0, 0, 0, -1, -1,
        ];
        drawPixelChar(x, y, w, h, colors, pixels);
    }

    function drawTurtle(x, y, w, h, inShell) {
        if (inShell) {
            const colors = ['#73a', '#528', '#000'];
            const pixels = [
                -1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 1, 1, 1, 1, 0, 0,
                0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 1, 1, 1, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            ];
            drawPixelChar(x, y, w, h, colors, pixels);
        } else {
            const colors = ['#73a', '#528', '#000', '#fff', '#ff0'];
            const pixels = [
                -1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 1, 1, 1, 1, 0, 0,
                0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 3, 3, 0, 1, 0,
                0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 1, 1, 0, 0, -1,
                -1, -1, 0, 0, 0, 0, -1, -1, -1, -1, 0, 0, 0, 0, -1, -1,
            ];
            drawPixelChar(x, y, w, h, colors, pixels);
        }
    }

    function drawAvoma(x, y, w, h) {
        const colors = ['#83c', '#529', '#000', '#fff'];
        const pixels = [
            -1, 0, 0, -1, -1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0,
            -1, 0, 1, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 0, -1, -1,
            -1, -1, 0, 0, 0, 0, -1, -1, -1, -1, 0, 0, 0, 0, -1, -1,
        ];
        drawPixelChar(x, y, w, h, colors, pixels);
    }

    function drawCoin(x, y, size) {
        const colors = ['#ffd740', '#ffb300', '#fff8c0', '#8b6914'];
        const s = size / 8;
        const pixels = [
            -1, -1, 1, 1, 1, 1, -1, -1, -1, 1, 2, 2, 2, 2, 1, -1,
            1, 2, 2, 0, 0, 2, 2, 1, 1, 2, 0, 0, 0, 0, 2, 1,
            1, 2, 0, 0, 0, 0, 2, 1, 1, 2, 2, 0, 0, 2, 2, 1,
            -1, 1, 2, 2, 2, 2, 1, -1, -1, -1, 1, 1, 1, 1, -1, -1,
        ];
        for (let row = 0; row < 8; row++)
            for (let col = 0; col < 8; col++) {
                const ci = pixels[row * 8 + col]; if (ci >= 0) {
                    ctx.fillStyle =
                    colors[ci];
                    ctx.fillRect(x + col * s, y + row * s, Math.ceil(s), Math.ceil(s));
                }
            }
    }

    function drawStar(x, y, size, color) {
        ctx.fillStyle = color;
        const cx = x + size / 2,
            cy = y + size / 2,
            r = size / 2;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2,
                rad = i % 2 === 0 ? r : r * 0.4;
            const sx = cx + Math.cos(angle) * rad,
                sy = cy + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
    }

    function renderBackground() {
        const grad = ctx.createLinearGradient(0, 0, 0, INTERNAL_H);
        grad.addColorStop(0, '#000015');
        grad.addColorStop(0.5, '#0a0020');
        grad.addColorStop(1, '#000018');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
        const starSeed = 42;
        const pseudoRandom = (n) => {
            const x = Math.sin(n * 127.1 + starSeed) * 43758.5453; return x - Math.floor(
                x);
        };
        for (let i = 0; i < 200; i++) {
            const sx = (pseudoRandom(i * 3) * INTERNAL_W - camera.x * 0.1) % INTERNAL_W;
            const sy = pseudoRandom(i * 7) * INTERNAL_H;
            const sr = pseudoRandom(i * 11) * 2 + 0.5;
            const brightness = pseudoRandom(i * 13) * 0.6 + 0.4;
            ctx.fillStyle = `rgba(255,255,255,${brightness})`;
            ctx.fillRect(((sx % INTERNAL_W) + INTERNAL_W) % INTERNAL_W, sy, sr, sr);
        }
        for (let i = 0; i < 5; i++) {
            const nx = ((pseudoRandom(i * 17 + 5) * INTERNAL_W * 2 - camera.x * 0.05) % (INTERNAL_W * 2));
            const ny = pseudoRandom(i * 19 + 10) * INTERNAL_H;
            const nr = pseudoRandom(i * 23 + 15) * 60 + 40;
            const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
            ng.addColorStop(0, `hsla(${pseudoRandom(i * 29) * 360},60%,40%,0.15)`);
            ng.addColorStop(1, 'transparent');
            ctx.fillStyle = ng;
            ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
        }
        for (let i = 0; i < 3; i++) {
            const px = ((pseudoRandom(i * 31 + 20) * INTERNAL_W * 3 - camera.x * 0.03) % (INTERNAL_W * 3));
            const py = pseudoRandom(i * 37 + 25) * INTERNAL_H * 0.6 + INTERNAL_H * 0.1;
            const pr = pseudoRandom(i * 41 + 30) * 25 + 15;
            const pg = ctx.createRadialGradient(px - pr * 0.2, py - pr * 0.2, pr * 0.1, px, py, pr);
            pg.addColorStop(0, `hsla(${pseudoRandom(i * 43) * 360},50%,60%,0.8)`);
            pg.addColorStop(0.6, `hsla(${pseudoRandom(i * 43) * 360},60%,30%,0.5)`);
            pg.addColorStop(1, 'transparent');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function renderLevel() {
        ctx.save();
        ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
        let shakeX = 0,
            shakeY = 0;
        if (screenShake > 0) {
            shakeX = (Math.random() - 0.5) * 8;
            shakeY = (Math.random() - 0.5) * 8;
            ctx.translate(shakeX, shakeY);
        }
        for (const seg of groundSegments) {
            const numTiles = Math.ceil((seg.endX - seg.startX) / TILE);
            for (let i = 0; i < numTiles; i++) {
                const tx = seg.startX + i * TILE,
                    ty = GROUND_Y;
                ctx.fillStyle = '#6b6b7b';
                ctx.fillRect(tx, ty, TILE, TILE);
                ctx.fillStyle = '#5a5a6a';
                ctx.fillRect(tx + 2, ty + 2, TILE - 4, TILE - 4);
                ctx.fillStyle = '#7a7a8a';
                ctx.fillRect(tx + 8, ty + 6, 6, 4);
                ctx.fillRect(tx + 24, ty + 10, 5, 3);
                ctx.fillStyle = '#555565';
                ctx.fillRect(tx + 10, ty + 7, 3, 2);
                ctx.fillRect(tx + 26, ty + 11, 2, 1);
            }
        }
        for (const plat of platforms) {
            for (let i = 0; i < plat.w; i++) {
                const tx = plat.x + i * TILE,
                    ty = plat.y;
                ctx.fillStyle = '#7a7a8e';
                ctx.fillRect(tx, ty, TILE, TILE);
                ctx.fillStyle = '#8a8a9e';
                ctx.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
                ctx.fillStyle = '#6a6a7e';
                ctx.fillRect(tx + 2, ty + 2, TILE - 4, TILE - 4);
                ctx.fillStyle = '#9a9aae';
                ctx.fillRect(tx + 4, ty + 4, 3, 3);
                ctx.fillRect(tx + 20, ty + 6, 4, 2);
            }
        }
        for (const brick of bricks)
            for (let r = 0; r < brick.h; r++)
                for (let c = 0; c < brick.w; c++) {
                    const tx = brick.x + c * TILE,
                        ty = brick.y + r * TILE;
                    ctx.fillStyle = '#8a7a6e';
                    ctx.fillRect(tx, ty, TILE, TILE);
                    ctx.fillStyle = '#9a8a7e';
                    ctx.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
                    ctx.fillStyle = '#7a6a5e';
                    ctx.fillRect(tx + 3, ty + 3, TILE - 6, TILE - 6);
                }
        for (const qb of questionBlocks) {
            if (qb.used) {
                ctx.fillStyle = '#555';
                ctx.fillRect(qb.x, qb.y, TILE, TILE);
            } else {
                ctx.fillStyle = '#e8b830';
                ctx.fillRect(qb.x, qb.y, TILE, TILE);
                ctx.fillStyle = '#f0c840';
                ctx.fillRect(qb.x + 1, qb.y + 1, TILE - 2, TILE - 2);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 22px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('?', qb.x + TILE / 2, qb.y + TILE / 2 + 8);
            }
        }
        for (const pipe of pipes) {
            const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
            grad.addColorStop(0, '#667');
            grad.addColorStop(0.5, '#aab');
            grad.addColorStop(1, '#556');
            ctx.fillStyle = grad;
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            ctx.fillStyle = '#889';
            ctx.fillRect(pipe.x - 4, pipe.y, pipe.width + 8, 14);
        }
        if (gameState === STATE_BONUS && currentBonusRoom) {
            const ep = currentBonusRoom;
            ctx.fillStyle = '#667';
            ctx.fillRect(ep.exitPipeX, ep.exitPipeY, ep.exitPipeW, ep.exitPipeH);
            ctx.fillStyle = '#889';
            ctx.fillRect(ep.exitPipeX - 4, ep.exitPipeY, ep.exitPipeW + 8, 14);
        }
        for (const coin of coinItems) {
            if (!coin.collected) drawCoin(coin.x, coin.y + Math.sin(Date.now() / 400 +
                coin.x) * 3, 14);
        }
        if (gameState === STATE_BONUS)
            for (const bc of bonusRoomCoins) {
                if (!bc.collected) drawCoin(bc.x, bc.y + Math.sin(Date.now() / 400 +
                    bc.x) * 3, 14);
            }
        for (const item of groundItems) {
            if (item.collected) continue;
            if (item.type === 'protein') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(item.x + 2, item.y, 18, 18);
                ctx.fillStyle = '#48f';
                ctx.fillRect(item.x + 4, item.y + 3, 14, 12);
                ctx.fillStyle = '#f84';
                ctx.fillRect(item.x + 8, item.y + 14, 6, 4);
            } else if (item.type === 'star') drawStar(item.x + 11,
                item.y + 11, 20, '#ffd740');
            else if (item.type === 'loststar') drawStar(item.x + 10, item.y + 10, 18, '#4f8');
        }
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            if (enemy.type === 'alien') drawAlien(enemy.x, enemy.y, enemy.width, enemy.height);
            else if (enemy.type === 'turtle') drawTurtle(enemy.x, enemy.y, enemy.width, enemy.height, enemy.inShell);
            else if (enemy.type === 'avoma') drawAvoma(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        for (const proj of projectiles) {
            if (!proj.alive) continue;
            ctx.fillStyle = '#8f4';
            ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        }
        for (const shell of shells) {
            if (shell.alive) drawTurtle(shell.x, shell.y, shell.width, shell.height,
                true);
        }
        const goalBob = Math.sin(Date.now() / 600) * 15;
        const gsx = GOAL_STAR_X,
            gsy = GOAL_STAR_Y + goalBob;
        const glowGrad = ctx.createRadialGradient(gsx, gsy, 5, gsx, gsy, 55);
        glowGrad.addColorStop(0, 'rgba(255,255,200,0.9)');
        glowGrad.addColorStop(0.3, 'rgba(255,220,100,0.5)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(gsx - 55, gsy - 55, 110, 110);
        drawStar(gsx - 22, gsy - 22, 44, '#fffde0');
        drawStar(gsx - 16, gsy - 16, 32, '#ffe860');
        if (player.isBig) drawBigBro(player.x, player.y, player.width, player.height, player.isInvincible, player
            .animFrame, player.animState, player.facingRight, player.idleTimer);
        else drawLilBro(player.x, player.y, player.width, player.height, player.isInvincible, player.animFrame,
            player.animState, player.facingRight, player.idleTimer);
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life / 0.6);
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        for (const ft of floatingTexts) {
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = Math.max(0, ft.life / 1.2);
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function renderHUD() {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, INTERNAL_W, 36);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score.toString().padStart(7, '0')}`, 14, 24);
        ctx.fillStyle = '#ffd740';
        ctx.fillText(`COINS: ${coins}`, 290, 24);
        ctx.fillStyle = '#f66';
        ctx.fillText(`LIVES: ${lives}`, 450, 24);
        const mins = Math.floor(timeRemaining / 60),
            secs = timeRemaining % 60;
        ctx.fillStyle = timeRemaining <= 30 ? '#f66' : '#fff';
        ctx.fillText(`TIME: ${mins}:${secs.toString().padStart(2, '0')}`, 600, 24);
        if (starPowerTimer > 0) {
            ctx.fillStyle = '#ff0';
            ctx.fillText(`STAR: ${Math.ceil(starPowerTimer)}s`, 760, 24);
        }
        if (player.isBig && starPowerTimer <= 0) {
            ctx.fillStyle = '#4af';
            ctx.fillText('BIG', 890, 24);
        }
    }

    function render() {
        ctx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
        renderBackground();
        if (gameState === STATE_PLAYING || gameState === STATE_BONUS) {
            renderLevel();
            renderHUD();
        } else if (gameState === STATE_MENU || gameState === STATE_OPTIONS) {
            const t = Date.now() / 1000;
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle =
                `rgba(255,255,255,${0.3 + Math.sin(t + i) * 0.2})`;
                ctx.fillRect((Math.sin(t * 0.7 + i * 2.1) * 0.5 + 0.5) * INTERNAL_W, (Math.cos(t * 0.5 + i * 1.7) *
                    0.5 + 0.5) * INTERNAL_H, 2, 2);
            }
            const px = INTERNAL_W * 0.75 + Math.sin(t * 0.1) * 40,
                py = INTERNAL_H * 0.25;
            const pg = ctx.createRadialGradient(px - 10, py - 10, 5, px, py, 70);
            pg.addColorStop(0, '#4499cc');
            pg.addColorStop(0.5, '#225577');
            pg.addColorStop(1, 'transparent');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(px, py, 70, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(200,220,255,0.3)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(px, py, 90, 25, 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function showOverlay(overlay) {
        [menuOverlay, optionsOverlay, gameoverOverlay, winOverlay].forEach(o => {
            o.classList.add('hidden');
            o.classList.remove('active');
        });
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
    }

    function hideAllOverlays() {
        [menuOverlay, optionsOverlay, gameoverOverlay, winOverlay].forEach(o => {
            o.classList.add('hidden');
            o.classList.remove('active');
        });
    }

    function updateGameOverUI() {
        goScoreEl.textContent = `Score: ${score}`;
        goCoinsEl.textContent = `Coins: ${coins}`;
    }

    function updateWinUI() {
        winScoreEl.textContent = `Score: ${score}`;
        winCoinsEl.textContent = `Coins: ${coins}`;
    }
    let lastTime = performance.now();

    function gameLoop(timestamp) {
        let dt = (timestamp - lastTime) / 1000;
        if (dt <= 0) dt = 0.016; if (dt > 0.2) dt = 0.2;
        lastTime = timestamp;
        update(dt);
        render();
        requestAnimationFrame(gameLoop);
    }
    btnStart.addEventListener('click', () => {
        initAudio();
        resetLevel();
        hideAllOverlays();
        gameState = STATE_PLAYING;
        camera.x = 0;
        camera.y = 0;
        camera.targetX = 0;
        camera.targetY = 0;
    });
    btnOptions.addEventListener('click', () => {
        initAudio();
        gameState = STATE_OPTIONS;
        showOverlay(optionsOverlay);
    });
    btnExit.addEventListener('click', () => {
        const msg = document.createElement('div');
        msg.style.cssText =
            'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:#fff;padding:30px 40px;border-radius:10px;font-family:"Courier New",monospace;font-size:18px;z-index:999;text-align:center;border:2px solid #556;';
        msg.textContent = 'Thanks for Playing! 🚀\n\nClose this tab to exit.';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    });
    btnBackOptions.addEventListener('click', () => {
        gameState = STATE_MENU;
        showOverlay(menuOverlay);
    });
    btnRetry.addEventListener('click', () => {
        resetLevel();
        hideAllOverlays();
        gameState = STATE_PLAYING;
    });
    btnMenuFromGo.addEventListener('click', () => {
        gameState = STATE_MENU;
        hideAllOverlays();
        showOverlay(menuOverlay);
    });
    btnPlayAgain.addEventListener('click', () => {
        resetLevel();
        hideAllOverlays();
        gameState = STATE_PLAYING;
    });
    btnMenuFromWin.addEventListener('click', () => {
        gameState = STATE_MENU;
        hideAllOverlays();
        showOverlay(menuOverlay);
    });
    sliderMaster.addEventListener('input', () => {
        masterVol = parseInt(sliderMaster.value) / 100;
        valMaster.textContent = sliderMaster.value + '%';
        updateAudioVolumes();
    });
    sliderMusic.addEventListener('input', () => {
        musicVol = parseInt(sliderMusic.value) / 100;
        valMusic.textContent = sliderMusic.value + '%';
        updateAudioVolumes();
    });
    sliderSfx.addEventListener('input', () => {
        sfxVol = parseInt(sliderSfx.value) / 100;
        valSfx.textContent = sliderSfx.value + '%';
        updateAudioVolumes();
    });

    function init() {
        resetLevel();
        gameState = STATE_MENU;
        prevGameState = STATE_MENU;
        showOverlay(menuOverlay);
        lastTime = performance.now();
        switchMusicTrack(MUSIC_MENU);
        requestAnimationFrame(gameLoop);
    }
    init();
    console.log('🚀 Among the Space ready!');
    console.log('Controls: A/D = Move | Shift = Run | Space = Jump / Double Jump');
})();