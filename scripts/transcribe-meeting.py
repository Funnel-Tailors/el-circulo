"""Transcribe una reunión grabada con Whisper (para la sección "Reuniones" del portal).

Uso:
    python scripts/transcribe-meeting.py <video_o_audio> [--out DIR] [--model large-v3] [--lang es] [--limit SEG]

Salida (en --out, por defecto junto al vídeo):
    <nombre>.wav            audio 16 kHz mono extraído con ffmpeg
    <nombre>.txt            transcripción "[mm:ss] texto" (se escribe en vivo; tail -f para ver el avance)
    <nombre>.redacted.txt   igual, sin bucles de alucinación y con credenciales tachadas -> la que se guarda en el portal

Requisitos:
    - ffmpeg en el PATH
    - faster-whisper (recomendado, ~4x más rápido):  pip install faster-whisper
        GPU en Windows además:  pip install nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"
    - o, si no está, openai-whisper:                  pip install openai-whisper  (GPU si torch tiene CUDA)
"""
import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


def add_cuda_dlls() -> None:
    """faster-whisper (ctranslate2) necesita cuBLAS/cuDNN; en Windows vienen en los wheels de nvidia-*."""
    if os.name != "nt":
        return
    try:
        import nvidia  # type: ignore
    except ImportError:
        return
    for base in nvidia.__path__:
        for sub in ("cublas", "cudnn"):
            d = Path(base) / sub / "bin"
            if d.is_dir():
                os.add_dll_directory(str(d))
                os.environ["PATH"] = str(d) + os.pathsep + os.environ["PATH"]


def fmt(t: float) -> str:
    m, s = divmod(int(t), 60)
    return f"[{m:02d}:{s:02d}]"


def extract_audio(src: Path, wav: Path, limit: int | None) -> None:
    if wav.exists() and not limit:
        return
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000"]
    if limit:
        cmd += ["-t", str(limit)]
    subprocess.run(cmd + [str(wav)], check=True)


def segments_faster_whisper(wav: Path, model_name: str, lang: str):
    from faster_whisper import WhisperModel  # type: ignore
    add_cuda_dlls()
    try:
        model = WhisperModel(model_name, device="cuda", compute_type="float16")
        segs, _ = model.transcribe(str(wav), language=lang, vad_filter=True, beam_size=5)
        first = next(segs, None)  # el fallo de CUDA (DLL que falta) salta al iterar, no al cargar
        print(f"faster-whisper · GPU · {model_name}", flush=True)
        if first is not None:
            yield first
        yield from segs
    except Exception as e:  # noqa: BLE001
        print(f"AVISO: GPU no disponible ({e}). Sigo en CPU con 'medium' (bastante más lento).", flush=True)
        model = WhisperModel("medium", device="cpu", compute_type="int8")
        segs, _ = model.transcribe(str(wav), language=lang, vad_filter=True)
        yield from segs


def segments_openai_whisper(wav: Path, model_name: str, lang: str):
    import whisper  # type: ignore
    try:
        import torch  # type: ignore
        device = "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        device = "cpu"
    if device == "cpu" and model_name == "large-v3":
        model_name = "medium"
    print(f"openai-whisper · {device.upper()} · {model_name}", flush=True)
    model = whisper.load_model(model_name, device=device)
    result = model.transcribe(str(wav), language=lang, verbose=False)
    for s in result["segments"]:
        yield type("Seg", (), {"start": s["start"], "text": s["text"]})


def transcribe(wav: Path, model_name: str, lang: str):
    try:
        import faster_whisper  # noqa: F401  # type: ignore
        return segments_faster_whisper(wav, model_name, lang)
    except ImportError:
        pass
    try:
        import whisper  # noqa: F401  # type: ignore
        return segments_openai_whisper(wav, model_name, lang)
    except ImportError:
        sys.exit("No hay motor de transcripción. Instala uno:  pip install faster-whisper")


# Segmentos basura típicos de whisper en silencios ("y", "y,", ",", repetidos decenas de veces).
JUNK = re.compile(r"^\W{0,2}\w?\W{0,2}$")
# Pistas de credenciales dictadas en voz alta.
SECRET = re.compile(r"contraseñ|password|api ?key|clave (de|del|es)|pin|exclamaci|almohadilla|asterisco|guion bajo", re.IGNORECASE)
# Tras mencionar una contraseña se tacha todo lo de los siguientes segundos: suele ser la contraseña
# dictada, a veces en trozos sueltos ("dubai con d mayúscula", "2026"…). Mejor tachar de más que de menos.
WINDOW_S = 45


def secs(stamp: str) -> int:
    m, s = stamp.strip("[]").split(":")
    return int(m) * 60 + int(s)


def clean(lines: list[str]) -> tuple[list[str], list[str]]:
    out, flagged, until = [], [], -1
    for line in lines:
        stamp, _, text = line.partition("] ")
        stamp += "]"
        text = text.strip()
        if JUNK.match(text):
            continue
        t = secs(stamp)
        hit = bool(SECRET.search(text))
        if hit:
            until = t + WINDOW_S
        if hit or t <= until:
            flagged.append(stamp)
            line = f"{stamp} [credencial omitida]"
        out.append(line)
    return out, flagged


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path, help="vídeo o audio de la reunión")
    ap.add_argument("--out", type=Path, help="carpeta de salida (por defecto, la del vídeo)")
    ap.add_argument("--model", default="large-v3")
    ap.add_argument("--lang", default="es")
    ap.add_argument("--limit", type=int, help="solo los primeros N segundos (para probar)")
    args = ap.parse_args()

    out_dir = args.out or args.src.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = args.src.stem + (f".first{args.limit}s" if args.limit else "")
    wav, txt, red = (out_dir / f"{stem}{ext}" for ext in (".wav", ".txt", ".redacted.txt"))

    extract_audio(args.src, wav, args.limit)
    lines = []
    with open(txt, "w", encoding="utf-8") as f:
        for s in transcribe(wav, args.model, args.lang):
            line = f"{fmt(s.start)} {s.text.strip()}"
            lines.append(line)
            f.write(line + "\n")
            f.flush()

    cleaned, flagged = clean(lines)
    red.write_text("\n".join(cleaned) + "\n", encoding="utf-8")
    print(f"OK · {len(lines)} segmentos · {txt.name} · {red.name}")
    if flagged:
        print("AVISO: posibles credenciales dichas en voz alta (tachadas en .redacted.txt, pero se oyen en el vídeo):")
        ranges, start, prev = [], None, None
        for st in flagged:
            t = secs(st)
            if start is None or t - prev > WINDOW_S:
                if start is not None:
                    ranges.append((start, prev))
                start = t
            prev = t
        ranges.append((start, prev))
        print("  " + ", ".join(f"{a // 60:02d}:{a % 60:02d}-{b // 60:02d}:{b % 60:02d}" for a, b in ranges))


if __name__ == "__main__":
    main()
