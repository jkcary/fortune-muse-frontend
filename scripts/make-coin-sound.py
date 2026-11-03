"""Original, deterministic copper-coin foley. Run from the frontend folder."""
from pathlib import Path
import math
import wave
import numpy as np

RATE = 44100
DURATION = 1.18
rng = np.random.default_rng(460618)
mix = np.zeros((round(RATE * DURATION), 2), dtype=np.float64)

def strike(start, gain, pitch, pan, tail):
    count = min(round(tail * RATE), len(mix) - round(start * RATE))
    t = np.arange(count) / RATE
    # Inharmonic modes, a short impact, and rapidly damped high overtones.
    modes = [(1320, 1.0, .075), (2218, .62, .048), (3477, .38, .032),
             (4923, .18, .019), (7130, .08, .011)]
    tone = np.zeros(count)
    for frequency, amplitude, decay in modes:
        tone += amplitude * np.sin(2 * math.pi * frequency * pitch * t) * np.exp(-t / decay)
    noise = rng.standard_normal(count)
    impact = (noise - np.roll(noise, 1)) * np.exp(-t / .0024) * .28
    body = np.sin(2 * math.pi * 420 * pitch * t) * np.exp(-t / .009) * .35
    voice = (tone * .23 + impact + body) * (1 - np.exp(-t / .00015)) * gain
    # A quiet, short stereo room reflection; no sustained musical tone.
    for delay, level in [(0, 1), (.013, .10), (.027, .045)]:
        offset = round((start + delay) * RATE)
        n = min(count, len(mix) - offset)
        mix[offset:offset+n, 0] += voice[:n] * level * math.sqrt((1-pan)/2)
        mix[offset:offset+n, 1] += voice[:n] * level * math.sqrt((1+pan)/2)

# A brief release rattle, then three independent landings and tiny settling bounces.
for event in [(0.005,.34,1.03,-.3,.20), (.049,.23,.96,.2,.19), (.102,.14,1.1,0,.16),
              (.710,.80,1.00,-.36,.34), (.755,.68,.93,.34,.32), (.795,.57,1.08,.04,.30),
              (.835,.25,1.02,-.18,.24), (.890,.17,.96,.25,.23), (.940,.08,1.1,0,.20)]:
    strike(*event)

mix -= mix.mean(axis=0)
mix *= .72 / max(np.max(np.abs(mix)), 1e-9)
mix[-round(RATE * .025):] *= np.linspace(1, 0, round(RATE * .025))[:, None]
target = Path("assets/audio/coin-toss.wav")
target.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(target), "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(np.round(mix * 32767).astype("<i2").tobytes())
print(f"{target}: {DURATION:.2f}s, stereo PCM, {target.stat().st_size} bytes")
