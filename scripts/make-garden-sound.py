"""Reproduce the original garden-light.wav with Python's standard library."""
import math
import struct
import wave
from pathlib import Path

destination = Path(__file__).resolve().parents[1] / 'assets/audio/garden-light.wav'
sample_rate = 22050
frames = []
for index in range(int(sample_rate * 0.8)):
    time = index / sample_rate
    value = 0.0
    for note, frequency in enumerate([523.25, 659.25, 783.99]):
        age = time - note * 0.09
        if age >= 0:
            value += 0.17 * math.sin(2 * math.pi * frequency * age) * math.exp(-7 * age) * min(1, age * 100)
    frames.append(struct.pack('<h', int(max(-1, min(1, value)) * 32767)))
with wave.open(str(destination), 'wb') as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(sample_rate)
    audio.writeframes(b''.join(frames))
