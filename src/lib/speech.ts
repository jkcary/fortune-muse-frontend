/**
 * iOS / Android: expo-speech-recognition, which offers the same interface as the Web Speech API.
 * It is a native module, so it needs a development build; in Expo Go it is missing and the mic is hidden.
 */
let mod: typeof import('expo-speech-recognition') | null = null;
try {
  mod = require('expo-speech-recognition');
} catch {
  mod = null;
}

export function getSpeechRecognition(): (new () => any) | null {
  try {
    return mod && mod.ExpoSpeechRecognitionModule.isRecognitionAvailable() ? (mod.ExpoWebSpeechRecognition as any) : null;
  } catch {
    return null;
  }
}

export async function requestSpeechPermission(): Promise<boolean> {
  if (!mod) return false;
  const r = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return r.granted;
}
