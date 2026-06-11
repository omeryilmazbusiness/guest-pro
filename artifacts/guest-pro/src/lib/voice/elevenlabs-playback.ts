import type { SynthesisOptions } from "./speech-synthesis";

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;

function cleanupPlayback(): void {
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

export function cancelElevenLabsPlayback(): void {
  cleanupPlayback();
}

export function playElevenLabsAudio(blob: Blob, options: SynthesisOptions = {}): Promise<void> {
  cancelElevenLabsPlayback();

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    activeObjectUrl = url;
    const audio = new Audio(url);
    activeAudio = audio;

    const finish = (error = false) => {
      cleanupPlayback();
      if (error) options.onError?.();
      else options.onEnd?.();
      resolve();
    };

    audio.onended = () => finish(false);
    audio.onerror = () => finish(true);

    void audio.play().catch(() => finish(true));
  });
}
