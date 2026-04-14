#!/usr/bin/env python3
import sys
from faster_whisper import WhisperModel


def main():
    if len(sys.argv) < 2:
        print("Usage: transcribe_voice_local.py <audio_path> [model]", file=sys.stderr)
        sys.exit(2)

    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "small"

    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_path, beam_size=5)
    text = " ".join(seg.text.strip() for seg in segments).strip()
    print(text)


if __name__ == "__main__":
    main()
