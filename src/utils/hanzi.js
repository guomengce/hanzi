import HanziWriter from "hanzi-writer";

const DATA_BASE_URL = `${import.meta.env.BASE_URL}character-data`;
const CACHE_PREFIX = "stroke-data:";
const LESSON_TIMING = { strokeAnimationSpeed: 0.82, delayBetweenStrokes: 260 };

async function loadCharacterData(character) {
  const key = `${CACHE_PREFIX}${character}`;

  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Storage may be disabled; network loading can still proceed.
  }

  const response = await fetch(`${DATA_BASE_URL}/${encodeURIComponent(character)}.json`);
  if (!response.ok) {
    throw new Error("没有找到这个汉字的笔顺数据。");
  }

  const data = await response.json();
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Limited storage should not prevent the lesson preview.
  }
  return data;
}

function drawGrid(canvas, size) {
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(ratio, ratio);

  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#d85645";
  ctx.lineWidth = Math.max(1.4, size / 360);
  ctx.strokeRect(1, 1, size - 2, size - 2);

  ctx.save();
  ctx.strokeStyle = "rgba(204, 73, 58, 0.42)";
  ctx.lineWidth = Math.max(1, size / 620);
  ctx.setLineDash([size / 48, size / 72]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 4);
  ctx.lineTo(size / 2, size - 4);
  ctx.moveTo(4, size / 2);
  ctx.lineTo(size - 4, size / 2);
  ctx.moveTo(4, 4);
  ctx.lineTo(size - 4, size - 4);
  ctx.moveTo(size - 4, 4);
  ctx.lineTo(4, size - 4);
  ctx.stroke();
  ctx.restore();
}

function compositeScene(scene, destination) {
  const ctx = destination.getContext("2d");
  ctx.clearRect(0, 0, destination.width, destination.height);
  ctx.drawImage(scene.gridCanvas, 0, 0, destination.width, destination.height);
  const writerCanvas = scene.writerLayer.querySelector("canvas");
  if (writerCanvas) {
    ctx.drawImage(writerCanvas, 0, 0, destination.width, destination.height);
  }
}

export class HanziScene {
  constructor(container, size) {
    this.container = container;
    this.size = size;
    this.scene = null;
  }

  async prepare(character) {
    const data = await loadCharacterData(character);
    this.container.innerHTML = "";
    this.container.classList.add("has-character");

    const gridCanvas = document.createElement("canvas");
    gridCanvas.className = "grid-layer";
    drawGrid(gridCanvas, this.size);

    const writerLayer = document.createElement("div");
    writerLayer.className = "writer-layer";
    writerLayer.style.width = `${this.size}px`;
    writerLayer.style.height = `${this.size}px`;

    this.container.append(gridCanvas, writerLayer);
    const writer = HanziWriter.create(writerLayer, character, {
      width: this.size,
      height: this.size,
      padding: Math.round(this.size * 0.09),
      renderer: "canvas",
      charDataLoader: () => Promise.resolve(data),
      showOutline: true,
      showCharacter: false,
      strokeColor: "#17222b",
      outlineColor: "#d9d3c8",
      drawingFadeDuration: 0,
      ...LESSON_TIMING,
    });

    this.scene = { writer, writerLayer, gridCanvas, data, character };
    return { strokes: data.strokes.length };
  }

  animate() {
    return new Promise((resolve) => {
      this.scene.writer.hideCharacter({
        duration: 0,
        onComplete: () => this.scene.writer.animateCharacter({ onComplete: resolve }),
      });
    });
  }

  showCompletedCharacter() {
    return new Promise((resolve) => {
      this.scene.writer.showCharacter({ duration: 0, onComplete: resolve });
    });
  }

  composite(destination) {
    compositeScene(this.scene, destination);
  }

  destroy() {
    this.container.innerHTML = "";
    this.scene = null;
  }
}

export function createHiddenStage(size) {
  const host = document.createElement("div");
  host.className = "capture-stage";
  host.style.width = `${size}px`;
  host.style.height = `${size}px`;
  document.body.appendChild(host);
  return { host, scene: new HanziScene(host, size) };
}

export { compositeScene };
