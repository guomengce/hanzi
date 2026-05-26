import fixWebmDuration from "fix-webm-duration";
import { createHiddenStage } from "./hanzi.js";

const FRAME_RATE = 30;
const COVER_DURATION = 1000;
const FINAL_FRAME_DURATION = 1000;

function download(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function pickVideoMimeType() {
  if (!window.MediaRecorder) {
    return null;
  }
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export class VideoExporter {
  getVideoLabel() {
    return pickVideoMimeType() !== null ? "输出 WebM 视频" : "此浏览器不支持视频导出";
  }

  async export(character, size, report) {
    const mimeType = pickVideoMimeType();
    if (mimeType === null || !HTMLCanvasElement.prototype.captureStream) {
      throw new Error("当前浏览器不支持视频导出。");
    }

    const { host, scene } = createHiddenStage(size);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const chunks = [];
    let stream;

    try {
      await scene.prepare(character);
      await scene.showCompletedCharacter();
      scene.composite(canvas);
      stream = canvas.captureStream(FRAME_RATE);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });
      const stopped = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));

      recorder.start(120);
      const recordingStartedAt = performance.now();
      let raf = 0;
      const render = () => {
        scene.composite(canvas);
        raf = window.requestAnimationFrame(render);
      };
      render();

      report("正在保留完整汉字封面...", 18);
      await wait(COVER_DURATION);
      report("正在录制米字格书写动画...", 30);
      await scene.animate();
      report("正在保留完成画面...", 72);
      await wait(FINAL_FRAME_DURATION);
      scene.composite(canvas);
      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      const duration = performance.now() - recordingStartedAt;
      window.cancelAnimationFrame(raf);
      recorder.stop();
      await stopped;

      report("正在整理完整视频...", 82);
      const blob = await fixWebmDuration(new Blob(chunks, { type: mimeType || "video/webm" }), duration, {
        logger: false,
      });
      download(blob, `${character}-笔顺演示.webm`);
      report("视频已下载（WebM）", 100);
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      host.remove();
    }
  }
}
