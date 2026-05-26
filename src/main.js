import "./styles/main.css";
import { filterSingleCharacter, validateCharacter } from "./utils/validation.js";
import { HanziScene } from "./utils/hanzi.js";
import { VideoExporter } from "./utils/export.js";

const elements = {
  input: document.querySelector("#characterInput"),
  generate: document.querySelector("#generateButton"),
  stage: document.querySelector("#previewStage"),
  heading: document.querySelector("#previewHeading"),
  status: document.querySelector("#statusPill"),
  summary: document.querySelector("#strokeSummary"),
  replay: document.querySelector("#replayButton"),
  video: document.querySelector("#videoButton"),
  size: document.querySelector("#sizeSelect"),
  videoFormat: document.querySelector("#videoFormat"),
  exportProgress: document.querySelector("#exportProgress"),
  progressBar: document.querySelector("#progressBar"),
  progressText: document.querySelector("#progressText"),
  toast: document.querySelector("#toast"),
};

const state = {
  character: "",
  strokeCount: 0,
  loading: false,
  exporting: false,
  generation: 0,
  composing: false,
};

const preview = new HanziScene(elements.stage, 500);
const exporter = new VideoExporter();
elements.videoFormat.textContent = exporter.getVideoLabel();

function setStatus(text, mode = "idle") {
  elements.status.textContent = text;
  elements.status.dataset.state = mode;
}

function setButtonsEnabled(enabled) {
  elements.replay.disabled = !enabled || state.loading || state.exporting;
  elements.video.disabled = !enabled || state.loading || state.exporting;
}

function notify(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3400);
}

async function playPreview() {
  setButtonsEnabled(false);
  setStatus("正在书写", "writing");
  elements.summary.textContent = `共 ${state.strokeCount} 笔 · 正在按规范顺序演示`;
  await preview.animate();
  elements.summary.textContent = `共 ${state.strokeCount} 笔 · 演示完成，可重新播放或下载视频`;
  setStatus("演示完成", "ready");
  setButtonsEnabled(true);
}

async function generate(character = elements.input.value) {
  const result = validateCharacter(character);
  if (!result.valid) {
    notify(result.message);
    elements.input.focus();
    return;
  }

  const token = state.generation + 1;
  state.generation = token;
  state.loading = true;
  state.character = result.character;
  elements.input.value = result.character;
  elements.generate.disabled = true;
  setButtonsEnabled(false);
  setStatus("载入笔顺", "writing");
  elements.heading.textContent = `“${result.character}”的笔顺演示`;
  elements.summary.textContent = "正在读取笔顺数据...";

  try {
    const details = await preview.prepare(result.character);
    if (token !== state.generation) {
      return;
    }
    state.strokeCount = details.strokes;
    state.loading = false;
    await playPreview();
  } catch (error) {
    if (token !== state.generation) {
      return;
    }
    state.loading = false;
    setStatus("生成失败", "error");
    elements.summary.textContent = "未能生成动画，请重新输入后再试。";
    notify(error.message || "笔顺数据载入失败，请重新打开工具后再试。");
  } finally {
    if (token === state.generation) {
      elements.generate.disabled = false;
      setButtonsEnabled(Boolean(state.strokeCount) && !state.loading);
    }
  }
}

async function exportVideo() {
  if (!state.character || state.exporting) {
    return;
  }

  state.exporting = true;
  setButtonsEnabled(false);
  elements.generate.disabled = true;
  elements.exportProgress.hidden = false;

  const report = (text, percent) => {
    elements.progressText.textContent = text;
    elements.progressBar.style.width = `${percent}%`;
  };

  try {
    await exporter.export(state.character, Number(elements.size.value), report);
    notify(`${state.character} 的视频已开始下载。`);
  } catch (error) {
    report("导出失败，请重新尝试", 0);
    notify(error.message || "课堂视频导出失败，请重试。");
  } finally {
    state.exporting = false;
    elements.generate.disabled = false;
    setButtonsEnabled(true);
    window.setTimeout(() => {
      if (!state.exporting) {
        elements.exportProgress.hidden = true;
        elements.progressBar.style.width = "0%";
      }
    }, 1800);
  }
}

elements.generate.addEventListener("click", () => generate());
function normalizeCharacterInput() {
  const value = elements.input.value;
  const character = filterSingleCharacter(value);

  if (value === character) {
    return;
  }

  elements.input.value = character;
  if (Array.from(value).filter((item) => item.trim()).length > 1) {
    notify("一次只能输入一个汉字，已为您保留第一个字。");
  }
}

elements.input.addEventListener("compositionstart", () => {
  state.composing = true;
});
elements.input.addEventListener("compositionend", () => {
  state.composing = false;
  normalizeCharacterInput();
});
elements.input.addEventListener("input", () => {
  if (!state.composing) {
    normalizeCharacterInput();
  }
});
elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.isComposing && !state.composing) {
    generate();
  }
});
elements.replay.addEventListener("click", () => playPreview());
elements.video.addEventListener("click", () => exportVideo());
