/** Web: the browser's own Web Speech API (Chrome, Edge, Safari). Firefox has none, so the mic is hidden there. */
export function getSpeechRecognition(): (new () => any) | null {
  const w = globalThis as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** The browser asks for microphone access itself when listening starts. */
export async function requestSpeechPermission(): Promise<boolean> {
  return true;
}
