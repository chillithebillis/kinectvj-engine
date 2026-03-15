import './style.css';

// ---------------------------------------------------------
// AUDIO & CANVAS SETUP
// ---------------------------------------------------------
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;
let mediaStream: MediaStream | null = null;
let source: MediaStreamAudioSourceNode | null = null;

const mainCanvas = document.getElementById('visualizer-canvas') as HTMLCanvasElement;
const mainCtx = mainCanvas.getContext('2d')!;

const canvasA = document.createElement('canvas');
const ctxA = canvasA.getContext('2d')!;
const canvasB = document.createElement('canvas');
const ctxB = canvasB.getContext('2d')!;

let isRunning = false;
let globalTime = 0;
let kickLevel = 0, bassLevel = 0, midLevel = 0, highLevel = 0;

// VJ GUI State
let deckAMode = 1;
let deckBMode = 7;
let crossfadeValue = 0.5;
let hueA = 0;
let hueB = 0;
let autoHue = false;
let mirrorH = false;
let mirrorV = false;
let mirrorC = false;
let trailValue = 0.3;

let strobeMode = 0;
let mixBlendMode: GlobalCompositeOperation = 'screen';
let bassMultiplier = 1.0;
let hudVisible = true;
let isBlackout = false;

const mirrorCanvas = document.createElement('canvas');
const mirrorCtx = mirrorCanvas.getContext('2d')!;

const userVideo = document.getElementById('user-video') as HTMLVideoElement;
const videoUpload = document.getElementById('video-upload') as HTMLInputElement;


// Recording State
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let isRecording = false;

// Advanced Beat Detection
const beatHistory: number[] = new Array(60).fill(0);
let beatRollingAverage = 0;
let isBeatExtracted = false;

const vjPanel = document.getElementById('vj-panel')!;
const mixSlider = document.getElementById('mix-slider') as HTMLInputElement;
const hueSliderA = document.getElementById('hue-slider-a') as HTMLInputElement;
const hueSliderB = document.getElementById('hue-slider-b') as HTMLInputElement;

// Warp Variables
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let isPointerDown = false;
let dragStartX = window.innerWidth / 2;
let dragStartY = window.innerHeight / 2;

// ---------------------------------------------------------
// RESIZE & EVENTS
// ---------------------------------------------------------
function resize() {
  mainCanvas.width = window.innerWidth; mainCanvas.height = window.innerHeight;
  canvasA.width = window.innerWidth; canvasA.height = window.innerHeight;
  canvasB.width = window.innerWidth; canvasB.height = window.innerHeight;
  mirrorCanvas.width = window.innerWidth; mirrorCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).tagName === 'BUTTON' || (e.target as Element).tagName === 'INPUT') return;
    isPointerDown = true;
    pointerX = e.clientX; pointerY = e.clientY;
    dragStartX = e.clientX; dragStartY = e.clientY;
});
window.addEventListener('pointermove', (e) => {
    if (isPointerDown) {
        pointerX = e.clientX; pointerY = e.clientY;
    } else {
        pointerX += (e.clientX - pointerX) * 0.1;
        pointerY += (e.clientY - pointerY) * 0.1;
    }
});
window.addEventListener('pointerup', () => isPointerDown = false);

window.addEventListener('wheel', (e) => {
    crossfadeValue += e.deltaY * 0.001;
    if (crossfadeValue < 0) crossfadeValue = 0;
    if (crossfadeValue > 1) crossfadeValue = 1;
    mixSlider.value = crossfadeValue.toString();
});

window.addEventListener('keydown', (e) => {
    // HUD Toggle
    if (e.key.toLowerCase() === 'h' || e.key === 'Escape') {
        hudVisible = !hudVisible;
        const uiElements = [vjPanel, document.getElementById('top-tools'), document.getElementById('vhs-effects'), document.getElementById('mobile-toggle-btn')];
        uiElements.forEach(el => el?.classList.toggle('hidden', !hudVisible));
        return;
    }

    // Blackout Toggle
    if (e.key.toLowerCase() === 'b') {
        isBlackout = !isBlackout;
        document.getElementById('btn-blackout')?.classList.toggle('active', isBlackout);
    }

    switch(e.key) {
        case '1': deckAMode = 1; updateDeckButtons('.mode-a', 1); break;
        case '2': deckAMode = 2; updateDeckButtons('.mode-a', 2); break;
        case '3': deckAMode = 3; updateDeckButtons('.mode-a', 3); break;
        case '4': deckAMode = 4; updateDeckButtons('.mode-a', 4); break;
        case '5': deckAMode = 5; updateDeckButtons('.mode-a', 5); break;
        case '6': deckBMode = 6; updateDeckButtons('.mode-b', 6); break;
        case '7': deckBMode = 7; updateDeckButtons('.mode-b', 7); break;
        case '8': deckBMode = 8; updateDeckButtons('.mode-b', 8); break;
        case '9': deckBMode = 9; updateDeckButtons('.mode-b', 9); break;
        case '0': deckBMode = 10; updateDeckButtons('.mode-b', 10); break;
    }
});

function updateDeckButtons(selector: string, val: number) {
    document.querySelectorAll(selector).forEach(b => {
        b.classList.toggle('active', parseInt((b as HTMLElement).getAttribute('data-val')!) === val);
    });
}


// GUI Events
mixSlider.addEventListener('input', (e) => crossfadeValue = parseFloat((e.target as HTMLInputElement).value));
hueSliderA.addEventListener('input', (e) => hueA = parseInt((e.target as HTMLInputElement).value));
hueSliderB.addEventListener('input', (e) => hueB = parseInt((e.target as HTMLInputElement).value));

const btnAutoHue = document.getElementById('btn-auto-hue')!;
btnAutoHue.addEventListener('click', () => { autoHue = !autoHue; btnAutoHue.classList.toggle('active', autoHue); });
const btnMirrorH = document.getElementById('btn-mirror-h')!;
btnMirrorH.addEventListener('click', () => { mirrorH = !mirrorH; btnMirrorH.classList.toggle('active', mirrorH); });
const btnMirrorV = document.getElementById('btn-mirror-v')!;
btnMirrorV.addEventListener('click', () => { mirrorV = !mirrorV; btnMirrorV.classList.toggle('active', mirrorV); });
const btnMirrorC = document.getElementById('btn-mirror-c')!;
btnMirrorC.addEventListener('click', () => { mirrorC = !mirrorC; btnMirrorC.classList.toggle('active', mirrorC); });

const strobeSelect = document.getElementById('strobe-select') as HTMLSelectElement;
strobeSelect.addEventListener('change', (e) => strobeMode = parseInt((e.target as HTMLSelectElement).value));

const btnBlackout = document.getElementById('btn-blackout')!;
btnBlackout.addEventListener('click', () => { isBlackout = !isBlackout; btnBlackout.classList.toggle('active', isBlackout); });

const btnTap = document.getElementById('btn-tap')!;

function triggerTap() {
    isBeatExtracted = true;
    kickLevel = 2.0;
    btnTap.classList.add('active');
}

function releaseTap() {
    btnTap.classList.remove('active');
}

btnTap.addEventListener('mousedown', triggerTap);
btnTap.addEventListener('touchstart', (e) => { e.preventDefault(); triggerTap(); });

btnTap.addEventListener('mouseup', releaseTap);
btnTap.addEventListener('touchend', (e) => { e.preventDefault(); releaseTap(); });
btnTap.addEventListener('mouseleave', releaseTap);

// Mobile Toggle Handle
const mobileToggleBtn = document.getElementById('mobile-toggle-btn')!;
mobileToggleBtn.addEventListener('click', () => {
    vjPanel.classList.toggle('show-mobile');
    vjPanel.classList.toggle('hidden');
});

// Detach HUD Logic
const btnPopout = document.getElementById('btn-popout')!;
btnPopout.addEventListener('click', () => {
    hudVisible = false;
    vjPanel.classList.add('hidden');
    document.getElementById('top-tools')?.classList.add('hidden');
    
    // Open Controller Window
    const win = window.open('', 'VJControls', 'width=500,height=800,menubar=no,toolbar=no');
    if (win) {
        const doc = win.document;
        doc.body.style.backgroundColor = '#030303';
        doc.title = 'KinectVJ Remote';
        
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => doc.head.appendChild(el.cloneNode(true)));
        
        doc.body.appendChild(vjPanel);
        vjPanel.classList.remove('hidden');
        vjPanel.style.position = 'relative';
        vjPanel.style.bottom = 'auto';
        vjPanel.style.left = 'auto';
        vjPanel.style.transform = 'none';
        vjPanel.style.margin = '2rem auto';
        
        win.addEventListener('unload', () => {
             document.body.appendChild(vjPanel);
             vjPanel.style.position = '';
             vjPanel.style.bottom = '';
             vjPanel.style.left = '';
             vjPanel.style.transform = '';
             vjPanel.style.margin = '';
             vjPanel.classList.add('hidden'); 
        });
    } else {
        alert('Popup bloqueado! Permita popups para usar a tela destacável.');
    }
});

const blendSelect = document.getElementById('blend-mode-select') as HTMLSelectElement;
blendSelect.addEventListener('change', (e) => mixBlendMode = (e.target as HTMLSelectElement).value as GlobalCompositeOperation);

const bassSlider = document.getElementById('bass-slider') as HTMLInputElement;
bassSlider.addEventListener('input', (e) => bassMultiplier = parseFloat((e.target as HTMLInputElement).value));

const trailSlider = document.getElementById('trail-slider') as HTMLInputElement;
trailSlider.addEventListener('input', (e) => trailValue = parseFloat((e.target as HTMLInputElement).value));

document.querySelectorAll('.mode-a').forEach(btn => {
    btn.addEventListener('click', (e) => {
        deckAMode = parseInt((e.target as HTMLElement).getAttribute('data-val')!);
        updateDeckButtons('.mode-a', deckAMode);
    });
});
document.querySelectorAll('.mode-b').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = parseInt((e.target as HTMLElement).getAttribute('data-val')!);
        deckBMode = val;
        updateDeckButtons('.mode-b', deckBMode);
        
        // Trigger video upload if mode 11 is selected and no video loaded
        if (val === 11 && !userVideo.src) {
            videoUpload.click();
        }
    });
});

videoUpload.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        userVideo.src = URL.createObjectURL(file);
        userVideo.play();
    }
});

// ---------------------------------------------------------
// DATA STRUCTURES
// ---------------------------------------------------------
interface Point3D { originalX: number; originalY: number; originalZ: number; freqBin: number; }
const galaxyPoints: Point3D[] = [];
function generateGalaxy() {
  galaxyPoints.length = 0;
  for (let arm = 0; arm < 5; arm++) {
    const armOffset = ((Math.PI * 2) / 5) * arm;
    for (let i = 0; i < 300; i++) {
        const factor = Math.pow(i / 300, 1.2);
        const dist = factor * 1200;
        const angle = factor * 5 + armOffset + (Math.random() - 0.5) * 0.5;
        const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
        const y = (Math.random() - 0.5) * (40 + factor * 300);
        const freqBin = Math.floor(Math.pow(Math.random(), 2) * 150) + Math.floor(factor * 50);
        galaxyPoints.push({ originalX: x, originalY: y, originalZ: z, freqBin });
    }
  }
}
generateGalaxy();
const tunnelRings: { z: number; scaleMult: number; }[] = [];
for (let i = 0; i < 30; i++) tunnelRings.push({ z: i * 150, scaleMult: Math.random() + 0.5 });

const dustPoints = Array.from({length: 200}, () => ({
  x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, z: Math.random() * 2000, speed: Math.random() * 2 + 0.5
}));

// DECK B Punk Geometries
interface HarshLine { x1: number; y1: number; x2: number; y2: number; z: number; thickness: number; }
const brutalLines: HarshLine[] = [];
for(let i=0; i<60; i++) brutalLines.push({
    x1: (Math.random() - 0.5) * 2000, y1: (Math.random() - 0.5) * 2000, 
    x2: (Math.random() - 0.5) * 2000, y2: (Math.random() - 0.5) * 2000, 
    z: Math.random() * 2000, thickness: Math.random() * 5 + 1
});

// ---------------------------------------------------------
// RECORDING API (MediaRecorder)
// ---------------------------------------------------------
const btnRec = document.getElementById('btn-rec')!;
btnRec.addEventListener('click', () => {
    if (!isRunning) return alert("Inicie o visualizador antes de gravar.");
    if (!isRecording) {
        const stream = mainCanvas.captureStream(60); // 60fps
        // Optionally bind audio inside if stream exists, but for visuals we just need video usually.
        // We can mix in the audio track
        if (mediaStream) {
            mediaStream.getAudioTracks().forEach(track => stream.addTrack(track));
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kinectVJ_mix_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            recordedChunks = [];
        };
        mediaRecorder.start();
        isRecording = true;
        btnRec.classList.add('recording');
        btnRec.innerText = "PARAR REC (BAIXAR)";
    } else {
        mediaRecorder?.stop();
        isRecording = false;
        btnRec.classList.remove('recording');
        btnRec.innerText = "REC";
    }
});

// ---------------------------------------------------------
// WEB MIDI API
// ---------------------------------------------------------
const midiStatus = document.getElementById('midi-status')!;
async function initMIDI() {
    try {
        const midiAccess = await navigator.requestMIDIAccess();
        midiStatus.classList.add('midi-on');
        midiStatus.innerText = "MIDI ON";
        
        midiAccess.inputs.forEach((input) => {
            input.onmidimessage = (msg: any) => {
                const data = msg.data as Uint8Array;
                if (!data) return;
                const [status, data1, data2] = data;
                // CC Message logic (Channel 1)
                if (status === 176) {
                    // Mappings for generic controllers
                    if (data1 === 1) { // Knob 1 for Hue A
                        hueA = (data2 / 127) * 360;
                        hueSliderA.value = hueA.toString();
                    }
                    if (data1 === 2) { // Knob 2 for Hue B
                        hueB = (data2 / 127) * 360;
                        hueSliderB.value = hueB.toString();
                    }
                    if (data1 === 7 || data1 === 3) { // Fader for Crossfade
                        crossfadeValue = data2 / 127;
                        mixSlider.value = crossfadeValue.toString();
                    }
                }
            };
        });
        
        midiAccess.onstatechange = (e) => {
            const port = e.port as any;
            if(port.state === 'connected') {
                midiStatus.classList.add('midi-on');
                midiStatus.innerText = "MIDI ON";
            }
        };
    } catch(err) {
        console.warn("MIDI not supported or denied.");
    }
}
initMIDI(); // Call instantly to see if midi is attached

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
async function initAudio(type: 'display' | 'mic') {
  try {
    const constraints: any = { audio: true };
    if (type === 'display') constraints.video = true;
    
    mediaStream = type === 'display' ? 
        await navigator.mediaDevices.getDisplayMedia(constraints) : 
        await navigator.mediaDevices.getUserMedia(constraints);
    
    if (mediaStream.getAudioTracks().length === 0) return alert("Nenhuma faixa de áudio.");
    startVisualizer();
    document.getElementById('ui-container')?.classList.add('hidden');
    vjPanel.classList.remove('hidden');
    document.getElementById('top-tools')?.classList.remove('hidden');
  } catch (err) { console.error(err); }
}

function startVisualizer() {
  if (!mediaStream) return;
  audioCtx = new AudioContext(); analyser = audioCtx.createAnalyser(); audioCtx.resume();
  source = audioCtx.createMediaStreamSource(mediaStream);
  analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.5; // CRITICAL for Psytrance response
  source.connect(analyser); dataArray = new Uint8Array(analyser.frequencyBinCount);
  isRunning = true; requestAnimationFrame(drawSuperloop);
}

// ---------------------------------------------------------
// WARP & DRAW HELPERS
// ---------------------------------------------------------
function applyWarp(x: number, y: number, scale: number) {
    let dx = x - pointerX; let dy = y - pointerY; let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (isPointerDown) {
        const pinchStrength = Math.sqrt((pointerX - dragStartX)**2 + (pointerY - dragStartY)**2);
        const radius = 300 + pinchStrength;
        if (dist < radius) {
            const force = (radius - dist) * 0.02;
            x -= (dx / dist) * force * (10 + pinchStrength * 0.05); 
            y -= (dy / dist) * force * (10 + pinchStrength * 0.05);
            
            const angle = Math.atan2(dy, dx) + force * 0.02 * (pointerX > dragStartX ? 1 : -1);
            const dist2 = dist * (1 - force*0.01);
            x = pointerX + Math.cos(angle) * dist2;
            y = pointerY + Math.sin(angle) * dist2;
            
            scale *= 1 + (force * 0.05);
        }
    } else {
        if (dist < 300) {
            const force = (300 - dist) * 0.15;
            x -= (dx / dist) * force * 10; y -= (dy / dist) * force * 10;
            scale *= 1 + (force * 0.002);
        }
    }
    return { x, y, scale };
}

function project3D(x: number, y: number, z: number, cameraZ: number, cx: number, cy: number, globalDistortion: number = -0.000002) {
    const zAdjusted = z + cameraZ;
    if (zAdjusted <= 0.1) return null;
    const s = 500 / zAdjusted;
    let x2d = x * s, y2d = y * s; const r2 = x2d*x2d + y2d*y2d; const lens = 1 + globalDistortion * r2;
    const warped = applyWarp(x2d * lens + cx, y2d * lens + cy, s);
    return { x: warped.x, y: warped.y, scale: warped.scale, x2d, y2d };
}

// ---------------------------------------------------------
// DECK A RENDERER (Fluid / Melodic)
// ---------------------------------------------------------
function renderDeckA(ctx: CanvasRenderingContext2D, mode: number, cx: number, cy: number) {
    if (!dataArray) return;
    ctx.globalCompositeOperation = 'source-over';
    
    // Clear with extreme flash on beat
    if (isBeatExtracted && kickLevel > 0.8) ctx.fillStyle = `hsla(${(hueA + 180)%360}, 100%, 80%, 0.3)`;
    else if (mode === 4) ctx.fillStyle = `rgba(0, 5, 10, ${0.15 - kickLevel*0.1})`; 
    else if (mode === 5) ctx.fillStyle = `rgba(0, 0, 0, ${0.1 - kickLevel*0.05})`; 
    else if (mode === 1) ctx.fillStyle = `rgba(2, 2, 4, ${0.4 - kickLevel*0.2})`;
    else ctx.fillStyle = `rgba(3, 3, 5, ${0.15 - kickLevel*0.1})`; 
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    ctx.globalCompositeOperation = 'screen'; 

    if (mode === 1) { // GALAXY PSYTRANCE
        const cameraZ = 800 - (kickLevel * 600); // Extreme zoom on kick
        const rotationY = globalTime * 0.005 + kickLevel * 0.2;
        const rotationX = Math.sin(globalTime * 0.001) * 0.8 + highLevel * 0.1;

        for (let i = 0; i < galaxyPoints.length; i++) {
            const p = galaxyPoints[i];
            const audioVal = dataArray[p.freqBin] / 255;
            const isProm = audioVal > 0.8;
            const pulse = 1 + audioVal * (1 + kickLevel * 3);

            let x = p.originalX * pulse, y = p.originalY * pulse, z = p.originalZ * pulse;
            if (isProm && isBeatExtracted) {
                x *= 1 + kickLevel * 4;
                y += (Math.random() - 0.5) * 2000 * kickLevel;
                z *= 1 + kickLevel * 4;
            }

            const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
            let nx = x * cosY - z * sinY, nz = z * cosY + x * sinY; x = nx; z = nz;
            const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
            let ny = y * cosX - z * sinX; z = z * cosX + y * sinX; y = ny;

            const proj = project3D(x, y, z, cameraZ, cx, cy);
            if (!proj) continue;

            const alpha = Math.min(1.0, proj.scale * 1.5 + highLevel); 
            const hShift = isBeatExtracted ? 120 : 0;
            ctx.fillStyle = `hsla(${(globalTime * 2 + p.freqBin + hueA + hShift) % 360}, 100%, 65%, ${alpha})`;
            if (isProm) {
                ctx.beginPath(); ctx.arc(proj.x, proj.y, Math.max(2, 20 * proj.scale * kickLevel), 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = `hsla(${(globalTime * 3 + p.freqBin + 180 + hueA) % 360}, 100%, 70%, ${alpha})`; 
                ctx.lineWidth = 2 + kickLevel * 5; ctx.stroke();
            } else {
                const pSize = Math.max(1, 3 * proj.scale * (1 + highLevel * 2)); ctx.fillRect(proj.x, proj.y, pSize, pSize);
            }
        }
    }
    else if (mode === 2) { // HALFTONE SUNSET (Y2K / Aesthetic)
        // Draw a warm gradient background on beat
        if (isBeatExtracted) {
            const grad = ctx.createLinearGradient(0, 0, 0, mainCanvas.height);
            grad.addColorStop(0, `hsla(${(hueA + 40)%360}, 90%, 80%, 0.4)`);
            grad.addColorStop(1, `hsla(${(hueA + 10)%360}, 100%, 60%, 0.2)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0,0,mainCanvas.width, mainCanvas.height);
        }

        const spacing = 20 + highLevel * 10;
        const columns = Math.ceil(mainCanvas.width / spacing);
        const rows = Math.ceil(mainCanvas.height / spacing);

        ctx.fillStyle = `hsla(${hueA}, 80%, 60%, 0.8)`;
        
        // Offset the grid globally
        const offsetX = (globalTime * 2) % spacing;
        const offsetY = (globalTime * 1) % spacing;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                const px = x * spacing - offsetX;
                const py = y * spacing - offsetY;

                // Create a flowing noise field using sine waves
                const noise = Math.sin(x * 0.1 + globalTime * 0.05) * Math.cos(y * 0.1 - globalTime * 0.03);
                
                // Distance to center to create the "blobs" seen in the reference
                const distToCenter1 = Math.sqrt(Math.pow(px - cx*0.5, 2) + Math.pow(py - cy*0.5, 2));
                const distToCenter2 = Math.sqrt(Math.pow(px - cx*1.5, 2) + Math.pow(py - cy*1.5, 2));
                
                // Modulate scale by audio and distance
                const audioScale = dataArray[Math.floor((x+y) % 100)] / 255;
                const field = Math.sin(distToCenter1 * 0.01 - globalTime*0.1) + Math.sin(distToCenter2 * 0.01 + globalTime*0.05);
                
                const dotSize = Math.max(0.5, (field + noise + audioScale * kickLevel * 2) * (spacing * 0.4));

                if (dotSize > 1) {
                    const wp = applyWarp(px, py, 1);
                    // Color transitions based on the noise field (Greenish / Orangeish vibe)
                    const dotHue = (hueA + field * 60 + audioScale * 60) % 360;
                    ctx.fillStyle = `hsla(${dotHue}, 90%, 60%, ${0.6 + audioScale*0.4})`;
                    ctx.beginPath();
                    ctx.arc(wp.x, wp.y, dotSize * wp.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    else if (mode === 3) { // PSYCHEDELIC GEOMETRY FACE (EXTREME)
        ctx.save();
        ctx.translate(cx, cy);
        
        // Crazy jitter on beat
        if (isBeatExtracted) {
            ctx.translate((Math.random()-0.5)*50*kickLevel, (Math.random()-0.5)*50*kickLevel);
            ctx.rotate((Math.random()-0.5)*0.2*kickLevel);
        } else {
            ctx.rotate(Math.sin(globalTime * 0.02) * 0.15);
        }
        
        const faceScale = 1 + kickLevel * 0.8 + highLevel * 0.3;
        ctx.scale(faceScale, faceScale);
        
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            const strobe = (isBeatExtracted && i === 2) ? 100 : 0;
            const h = (globalTime * 2 + hueA + i * 60) % 360;
            ctx.fillStyle = `hsla(${h}, ${80 + strobe}%, ${40 + strobe/2}%, 0.6)`;
            ctx.strokeStyle = isBeatExtracted ? '#fff' : `hsla(${(h + 180)%360}, 100%, 60%, 0.9)`;
            ctx.lineWidth = 4 + kickLevel * 10;
            
            const offset = i * 40 * (1 + highLevel);
            ctx.moveTo(-100 + offset, -200 + offset);
            ctx.bezierCurveTo(100 + offset + kickLevel*200, -250, 200 + offset, -100 + kickLevel*150, 150 + offset, 0);
            ctx.bezierCurveTo(100 + offset, 100, 150 + offset + kickLevel*100, 150, 50 + offset, 250);
            ctx.bezierCurveTo(-50 + offset, 200, -150 + offset - kickLevel*100, 150, -100 + offset, -200 + offset);
            ctx.fill();
            ctx.stroke();

            // The Eye
            if (i === 1 && kickLevel > 0.3) {
                const eyeX = 50 + offset;
                const eyeY = -50 + offset;
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 30 + kickLevel * 40, 0, Math.PI * 2);
                ctx.fillStyle = isBeatExtracted ? '#fff' : '#000'; ctx.fill();
                
                // Iris
                ctx.beginPath();
                ctx.arc(eyeX + (Math.random()-0.5)*10*highLevel, eyeY + (Math.random()-0.5)*10*highLevel, 15 + kickLevel * 20, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${(hueA + globalTime*5)%360}, 100%, 60%)`; ctx.fill();
                
                // Pupil
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 5 + kickLevel * 5, 0, Math.PI * 2);
                ctx.fillStyle = '#000'; ctx.fill();
            }
        }
        
        for(let a=0; a<Math.PI*2; a+=Math.PI/(8 + Math.floor(highLevel*8))) {
           ctx.beginPath();
           const r1 = 300 + kickLevel * 100;
           const r2 = 300 + dataArray[Math.floor(a * 15)] * 2.5;
           ctx.moveTo(Math.cos(a)*r1, Math.sin(a)*r1);
           ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2);
           ctx.strokeStyle = isBeatExtracted ? `hsla(${(hueA + a*30)%360}, 100%, 70%, 1)` : `hsla(${(hueA + a*20)%360}, 100%, 50%, 0.6)`;
           ctx.lineWidth = 3 + kickLevel * 15;
           ctx.stroke();
        }

        ctx.restore();
    }
    else if (mode === 4) { // NERVES PSY
        ctx.lineWidth = 3 + kickLevel * 8 + highLevel * 5; 
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const steps = 180;
        for(let w = 0; w < 4 + Math.floor(kickLevel*2); w++) {
            ctx.beginPath();
            ctx.strokeStyle = isBeatExtracted ? '#fff' : `hsla(${(globalTime * 2 + w * 90 + hueA) % 360}, 100%, 60%, 0.8)`;
            
            for (let i = 0; i < steps; i++) {
                const norm = dataArray[Math.floor((i / steps) * 200)] / 255;
                let rx = (i / steps) * mainCanvas.width;
                const waveY = Math.sin(i * 0.1 + globalTime * 0.05 + w) * (100 + midLevel * 400);
                const audioSpike = (norm * mainCanvas.height * 0.5) * (i % 2 === 0 ? 1 : -1) * (1 + kickLevel);
                let ry = cy + waveY + audioSpike;
                const wPoint = applyWarp(rx, ry, 1);
                if (i === 0) ctx.moveTo(wPoint.x, wPoint.y); else ctx.lineTo(wPoint.x, wPoint.y);
            }
            ctx.stroke(); 
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + highLevel*0.6})`;
        dustPoints.forEach(dp => {
            dp.z -= dp.speed * (5 + kickLevel * 20);
            if (dp.z < 0) { dp.z = 2000; dp.x = Math.random() * mainCanvas.width; dp.y = Math.random() * mainCanvas.height; }
            const p = project3D(dp.x - cx, dp.y - cy, dp.z, 0, cx, cy);
            if (p) ctx.fillRect(p.x, p.y, p.scale * (4 + kickLevel*10), p.scale * (4 + kickLevel*10));
        });
    }
    else if (mode === 5) { // FULL ON KALEIDOSCOPE
        const slices = 6 + Math.floor(kickLevel * 4) * 2 + Math.floor(midLevel * 4) * 2;
        const angleStep = (Math.PI * 2) / slices;
        const radBase = 150 + kickLevel * 300; 
  
        for(let i=0; i < slices; i++) {
            const rot = globalTime * 0.01 + (i * angleStep) * (isBeatExtracted ? -1 : 1);
            ctx.beginPath();
            const cp0 = applyWarp(cx, cy, 1); ctx.moveTo(cp0.x, cp0.y);
            
            for (let d = 0; d < 80; d+=4) {
                const norm = dataArray[d] / 255;
                const dist = d * 8 * (1 + highLevel); 
                const height = norm * radBase * (1 + kickLevel); 
                let sx = dist * Math.cos(rot) - height * Math.sin(rot);
                let sy = dist * Math.sin(rot) + height * Math.cos(rot);
                const wp = applyWarp(cx + sx, cy + sy, 1);
                ctx.lineTo(wp.x, wp.y);
                
                if (norm > 0.7) {
                    ctx.fillStyle = isBeatExtracted ? '#fff' : `hsla(${(globalTime*3 + d + hueA)%360}, 100%, 65%, 0.9)`;
                    const dotSize = 4 + kickLevel * 10;
                    ctx.fillRect(wp.x, wp.y, dotSize, dotSize);
                }
            }
            ctx.strokeStyle = `hsla(${(globalTime * 2 + hueA)%360}, 100%, 60%, 0.8)`; 
            ctx.lineWidth = 3 + kickLevel * 8; ctx.stroke();
            ctx.fillStyle = `hsla(${(globalTime * 5 + 40 + hueA)%360}, 100%, 20%, 0.2)`; ctx.fill();
        }
    }
}

// ---------------------------------------------------------
// DECK B RENDERER (Punk, Harsh, Monochromatic / Hi-TECH)
// ---------------------------------------------------------
function renderDeckB(ctx: CanvasRenderingContext2D, mode: number, cx: number, cy: number) {
    if (!dataArray) return;
    ctx.globalCompositeOperation = 'source-over';
    
    // Extreme strobe clears for Darkpsy/HiTech feel
    if (isBeatExtracted && kickLevel > 0.85) {
        ctx.fillStyle = `hsla(${(hueB+180)%360}, 100%, 50%, 0.9)`;
    } else {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 - kickLevel*0.2})`;
    }
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    ctx.globalCompositeOperation = 'screen';

    const renderHue = (hueB + (isBeatExtracted ? 120 : 0)) % 360;

    if (mode === 6) { // Y2K ANIME SUN (Minimal & Clean)
        // Clean pastel background
        ctx.fillStyle = isBeatExtracted ? '#fff' : `hsla(${renderHue}, 40%, 90%, 0.8)`;
        ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        
        ctx.save();
        ctx.translate(cx, cy);
        
        if (isBeatExtracted) {
            ctx.translate((Math.random()-0.5)*20*kickLevel, (Math.random()-0.5)*20*kickLevel);
        }

        // Draw Anime Sunrays
        const rays = 12 + Math.floor(midLevel * 10);
        ctx.fillStyle = `hsla(${(renderHue + 30)%360}, 100%, 75%, 0.5)`;
        ctx.beginPath();
        for (let i = 0; i < rays; i++) {
            const angle1 = (i / rays) * Math.PI * 2 + globalTime * 0.01;
            const angle2 = ((i + 0.5) / rays) * Math.PI * 2 + globalTime * 0.01;
            const radius = 1500;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle1) * radius, Math.sin(angle1) * radius);
            ctx.lineTo(Math.cos(angle2) * radius, Math.sin(angle2) * radius);
            ctx.lineTo(0, 0);
        }
        ctx.fill();

        // Draw central Pentagon/Screen (from Anime ref)
        const frameSize = 300 + kickLevel * 150;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(angle) * frameSize;
            const py = Math.sin(angle) * frameSize;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = `hsla(${(renderHue + 180)%360}, 50%, 80%, 1)`;
        ctx.fill();
        ctx.lineWidth = 10 + kickLevel * 20;
        ctx.strokeStyle = `hsla(${renderHue}, 80%, 40%, 1)`;
        ctx.stroke();

        // Inner glowing circle (Moon/Sun motif)
        ctx.beginPath();
        ctx.arc(0, 0, frameSize * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(renderHue + 60)%360}, 100%, 85%, 0.9)`;
        ctx.fill();

        // Minimal floating Japanese text / Glitch boxes
        const boxCount = 3 + Math.floor(highLevel * 5);
        ctx.fillStyle = `hsla(${renderHue}, 100%, 50%, 0.8)`;
        for(let j=0; j<boxCount; j++) {
            const bx = (Math.random() - 0.5) * cx * 1.5;
            const by = (Math.random() - 0.5) * cy * 1.5;
            const bw = 20 + Math.random() * 80 + kickLevel * 50;
            const bh = 10 + Math.random() * 20;
            ctx.fillRect(bx, by, bw, bh);
        }

        ctx.restore();
    }
    else if (mode === 7) { // AUDIO TOPOLOGY (OSCILLOSCOPE RAVE)
        ctx.strokeStyle = `hsla(${renderHue}, 100%, 60%, 0.8)`;
        ctx.fillStyle = `hsla(${renderHue}, 100%, 80%, 1)`;

        const gridSize = 25;
        const spacing = 40 + kickLevel * 20; 
        const offsetX = -(gridSize * spacing) / 2;
        
        // Insane speed on beat
        const offsetZ = globalTime * (10 + kickLevel * 50 + highLevel * 20);
        
        const rotX = 1.0 + kickLevel * 0.2; 
        const rotY = globalTime * 0.01; 

        for (let z = 0; z < gridSize; z++) {
            ctx.beginPath();
            let hasStarted = false;

            for (let x = 0; x < gridSize; x++) {
                const index = (x + z * gridSize) % dataArray.length;
                const data = dataArray[index] / 255;
                
                // Hyper elevation
                const elevation = data * 600 * (1 + kickLevel * 3);
                
                const worldX = offsetX + x * spacing;
                const rawZ = z * spacing - offsetZ;
                const worldZ = (rawZ % 1500 + 1500) % 1500 - 500; 
                const worldY = 300 - elevation;

                const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
                let rx = worldX * cosY - worldZ * sinY;
                let rz = worldZ * cosY + worldX * sinY;

                const cosX_rot = Math.cos(rotX), sinX_rot = Math.sin(rotX);
                let ry = worldY * cosX_rot - rz * sinX_rot;
                rz = rz * cosX_rot + worldY * sinX_rot;

                const proj = project3D(rx, ry, rz, 800, cx, cy);
                
                if (proj) {
                    if (!hasStarted) {
                        ctx.moveTo(proj.x, proj.y);
                        hasStarted = true;
                    } else {
                        ctx.lineTo(proj.x, proj.y);
                    }
                    
                    if (data > 0.6) {
                        ctx.fillStyle = isBeatExtracted ? '#fff' : `hsl(${(renderHue + elevation)%360}, 100%, 50%)`;
                        ctx.fillRect(proj.x - 3, proj.y - 3, 6 * proj.scale * (1+kickLevel), 6 * proj.scale * (1+kickLevel));
                    }
                }
            }
            ctx.lineWidth = 2 + kickLevel * 6;
            if (isBeatExtracted && z % 2 === 0) ctx.strokeStyle = '#fff';
            else ctx.strokeStyle = `hsla(${renderHue}, 100%, 60%, 0.8)`;
            ctx.stroke();
        }
    }
    else if (mode === 8) { // PLEXUS SWARM (INFECTED MUSHROOM STYLE)
        ctx.strokeStyle = `hsla(${renderHue}, 100%, 50%, 0.6)`;
        ctx.fillStyle = isBeatExtracted ? '#fff' : `hsla(${renderHue}, 100%, 60%, 1)`; 
        
        const swarmPoints = dustPoints.slice(0, 100 + Math.floor(kickLevel * 50)); 

        ctx.beginPath();
        for (let i = 0; i < swarmPoints.length; i++) {
            const p1 = swarmPoints[i];
            
            // Aggressive audio-driven chaotic walk
            const data = dataArray[i * 2] / 255;
            p1.x += Math.sin(globalTime * 0.05 + i) * (5 + data * 50 * kickLevel);
            p1.y += Math.cos(globalTime * 0.07 + i) * (5 + data * 50 * kickLevel);
            
            if (p1.x < -100) p1.x = mainCanvas.width + 100;
            if (p1.x > mainCanvas.width + 100) p1.x = -100;
            if (p1.y < -100) p1.y = mainCanvas.height + 100;
            if (p1.y > mainCanvas.height + 100) p1.y = -100;

            const wp1 = applyWarp(p1.x, p1.y, 1);
            const dotSize = 3 + data * 10 * kickLevel;
            ctx.fillRect(wp1.x, wp1.y, dotSize, dotSize);

            for (let j = i + 1; j < swarmPoints.length; j++) {
                const p2 = swarmPoints[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distDistSq = dx*dx + dy*dy;
                
                const threshold = (150 + kickLevel * 300) ** 2;

                if (distDistSq < threshold) {
                    const wp2 = applyWarp(p2.x, p2.y, 1);
                    ctx.moveTo(wp1.x, wp1.y);
                    ctx.lineTo(wp2.x, wp2.y);
                }
            }
        }
        ctx.lineWidth = 1.5 + kickLevel * 8;
        if (isBeatExtracted) ctx.strokeStyle = '#fff';
        ctx.stroke();
    }
    else if (mode === 9) { // STRANGE ATTRACTOR 
        ctx.strokeStyle = `hsla(${renderHue}, 100%, 60%, 0.9)`;
        
        const count = 400;
        const timeFactor = globalTime * 0.01;

        ctx.beginPath();
        let hasStarted = false;

        for (let i = 0; i < count; i++) {
            const data = dataArray[i] / 255;
            
            const u = i * 0.1;
            const a = 2.0 + kickLevel * 5;
            const b = 1.5 + midLevel * 2;

            // Insane mutations on beat
            const mutation = isBeatExtracted ? (Math.random()-0.5)*200 : 0;
            
            const xPos = Math.sin(u * a + timeFactor) * Math.cos(u * b) * (600 + mutation);
            const yPos = Math.sin(u * b - timeFactor) * Math.cos(u * a) * (600 + mutation);
            const zPos = Math.cos(u * 2 + timeFactor) * (600 + mutation);

            const proj = project3D(xPos, yPos, zPos, 700, cx, cy);
            if (proj) {
                if (data > 0.7) {
                    ctx.fillStyle = isBeatExtracted ? '#fff' : `hsl(${(renderHue+i)%360}, 100%, 50%)`;
                    ctx.fillRect(proj.x, proj.y, proj.scale * 10, proj.scale * 10);
                }
                
                if (!hasStarted) {
                    ctx.moveTo(proj.x, proj.y);
                    hasStarted = true;
                } else {
                    ctx.lineTo(proj.x, proj.y);
                }
            }
        }
        ctx.lineWidth = 5 + kickLevel * 25;
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    else if (mode === 10) { // TARGETING CROSSHAIRS (LASER RAVE)
        const wp = applyWarp(cx, cy, 1);
        const lockRate = globalTime * 0.5;

        for (let r = 1; r <= 8; r++) {
            const data = dataArray[r * 10] / 255;
            const radius = r * 100 + (data * 400 * kickLevel);
            
            ctx.lineWidth = (r % 2 === 0 ? 5 : 20) * data * (1 + kickLevel*2);
            if (ctx.lineWidth < 1) continue;

            ctx.setLineDash([20 * r * (1+highLevel), 50 * data]);
            ctx.lineDashOffset = lockRate * r * (r % 2 === 0 ? 1 : -1);

            ctx.strokeStyle = isBeatExtracted && r % 3 === 0 ? '#fff' : `hsla(${(renderHue + r*20)%360}, 100%, 50%, 1)`;
            
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.setLineDash([]); 

        ctx.beginPath();
        for(let i=0; i<3 + kickLevel*10; i++) {
            const randX = wp.x + (Math.random() - 0.5) * 800 * kickLevel;
            const randY = wp.y + (Math.random() - 0.5) * 800 * kickLevel;
            
            ctx.moveTo(0, randY); ctx.lineTo(mainCanvas.width, randY);
            ctx.moveTo(randX, 0); ctx.lineTo(randX, mainCanvas.height);
        }
        ctx.lineWidth = 3 + kickLevel * 10;
        ctx.strokeStyle = isBeatExtracted ? '#fff' : `hsla(${renderHue}, 100%, 60%, 0.8)`;
        ctx.stroke();
    }
    else if (mode === 11) { // VIDEO OVERLAY DECK
        if (!userVideo.paused && !userVideo.ended && userVideo.readyState > 2) {
            // Draw video taking up full canvas
            ctx.drawImage(userVideo, 0, 0, mainCanvas.width, mainCanvas.height);
            
            // Optional: apply color/hue filter over video
            ctx.fillStyle = `hsla(${renderHue}, 100%, 50%, ${0.2 + kickLevel * 0.4})`;
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            // Placeholder text if no video
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '24px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK VIDEO BUTTON TO UPLOAD', cx, cy);
        }
    }
}

// ---------------------------------------------------------
// SUPERLOOP & BLENDING
// ---------------------------------------------------------
function drawSuperloop() {
    if (!isRunning || !dataArray) return;
    requestAnimationFrame(drawSuperloop);
    
    analyser!.getByteFrequencyData(dataArray as any);

    let kickSum = 0; for (let i = 0; i < 5; i++) kickSum += dataArray[i];
    let bassSum = 0; for (let i = 0; i < 20; i++) bassSum += dataArray[i];
    let midSum = 0; for(let i=20; i<150; i++) midSum += dataArray[i];
    let highSum = 0; for(let i=150; i<400; i++) highSum += dataArray[i];
    
    kickLevel = ((kickSum / 5) / 255) * bassMultiplier;
    bassLevel = ((bassSum / 20) / 255) * bassMultiplier; 
    midLevel = ((midSum / 130) / 255) * bassMultiplier;
    highLevel = (highSum / 250) / 255;

    // Advanced Beat Detection logic focused on Kick for Psytrance
    let avg = 0;
    if (dataArray) {
        for (let i = 0; i < dataArray.length; i++) {
            avg += dataArray[i];
        }
    }
    avg = dataArray ? avg / dataArray.length : 0;
    
    beatHistory.shift();
    beatHistory.push(avg);
    beatRollingAverage = beatHistory.reduce((a,b)=>a+b, 0) / beatHistory.length;
    isBeatExtracted = (kickLevel > beatRollingAverage * 1.15) && kickLevel > 0.4;

    globalTime += 1 + kickLevel * 2 + highLevel * 2; // Accel time on intense moments

    if (autoHue) {
        hueA = (hueA + 0.5) % 360;
        hueB = (hueB + 0.8) % 360;
        hueSliderA.value = hueA.toString();
        hueSliderB.value = hueB.toString();
    }

    const cx = mainCanvas.width / 2; const cy = mainCanvas.height / 2;

    if (kickLevel > 0.88 * bassMultiplier) {
        mainCanvas.style.transform = `translate(${(Math.random() - 0.5) * 10 * kickLevel}px, ${(Math.random() - 0.5) * 10 * kickLevel}px)`;
    } else {
        mainCanvas.style.transform = `none`; 
    }
    
    if (strobeMode === 1) { // Mid/Snares Synced
        const trigger = midLevel > 0.65;
        mainCanvas.style.filter = `grayscale(100%) ${trigger ? 'invert(100%) brightness(150%)' : ''}`;
    } else if (strobeMode === 2) { // Rave Chaos
        const trigger = (Math.random() > 0.8 && highLevel > 0.4) || (isBeatExtracted && Math.random() > 0.5);
        mainCanvas.style.filter = trigger ? 'invert(100%) brightness(200%)' : 'grayscale(100%)';
    } else {
        mainCanvas.style.filter = 'none';
    }

    if (crossfadeValue < 1) renderDeckA(ctxA, deckAMode, cx, cy);
    if (crossfadeValue > 0) renderDeckB(ctxB, deckBMode, cx, cy);

    mainCtx.globalCompositeOperation = 'source-over';
    
    // Instead of completely transparent black, add a dark dampen layer if trail gets too high to avoid pure white accumulation
    if (trailValue > 0.85) {
        mainCtx.fillStyle = `rgba(3, 3, 5, ${1.0 - trailValue})`; 
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        mainCtx.fillStyle = `rgba(0, 0, 0, ${0.05})`; // Extra dampener
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    } else {
        mainCtx.fillStyle = `rgba(3, 3, 5, ${1.0 - trailValue})`; 
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    }

    mainCtx.globalCompositeOperation = mixBlendMode;
    if (crossfadeValue < 1) {
        mainCtx.globalAlpha = Math.cos(crossfadeValue * Math.PI / 2); 
        mainCtx.drawImage(canvasA, 0, 0);
    }
    if (crossfadeValue > 0) {
        mainCtx.globalAlpha = Math.sin(crossfadeValue * Math.PI / 2);
        mainCtx.drawImage(canvasB, 0, 0);
    }
    
    // Process Mirrors
    if (mirrorH || mirrorV || mirrorC) {
        mirrorCtx.clearRect(0, 0, mirrorCanvas.width, mirrorCanvas.height);
        mirrorCtx.drawImage(mainCanvas, 0, 0);
        
        mainCtx.globalAlpha = 1;
        mainCtx.globalCompositeOperation = 'source-over';

        if (mirrorH) {
            mainCtx.save();
            mainCtx.translate(mainCanvas.width, 0);
            mainCtx.scale(-1, 1);
            mainCtx.drawImage(mirrorCanvas, 0, 0, mainCanvas.width/2, mainCanvas.height, 0, 0, mainCanvas.width/2, mainCanvas.height);
            mainCtx.restore();
        }
        if (mirrorV) {
            mainCtx.save();
            mainCtx.translate(0, mainCanvas.height);
            mainCtx.scale(1, -1);
            mainCtx.drawImage(mirrorCanvas, 0, 0, mainCanvas.width, mainCanvas.height/2, 0, 0, mainCanvas.width, mainCanvas.height/2);
            mainCtx.restore();
        }
        if (mirrorC) {
            mainCtx.save();
            mainCtx.translate(mainCanvas.width, mainCanvas.height);
            mainCtx.scale(-1, -1);
            mainCtx.drawImage(mirrorCanvas, 0, 0, mainCanvas.width/2, mainCanvas.height/2, 0, 0, mainCanvas.width/2, mainCanvas.height/2);
            mainCtx.restore();
        }
    }

    if (isPointerDown) {
        mainCtx.globalAlpha = 1;
        mainCtx.globalCompositeOperation = 'source-over';
        mainCtx.beginPath();
        mainCtx.arc(pointerX, pointerY, 40 + bassLevel * 30, 0, Math.PI*2);
        mainCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        mainCtx.lineWidth = 1 + bassLevel * 5;
        mainCtx.stroke();
    }

    // Blackout override
    if (isBlackout) {
        mainCtx.globalCompositeOperation = 'source-over';
        mainCtx.fillStyle = '#000';
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    }
}

// Bind Starts
document.getElementById('btn-capture')?.addEventListener('click', () => initAudio('display'));
document.getElementById('btn-mic')?.addEventListener('click', () => initAudio('mic'));
