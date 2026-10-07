"""Composes the PV's comedic soundtrack in sync with src/timeline.json (numpy only).

Optional VOICEPEAK lines: put WAV/MP3 files in voice/ using the names listed in
timeline.json "voices". They are mixed in at their cue, and the music ducks under them.
Output: public/soundtrack.wav
"""
import json
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'public')
VOICE_DIR = os.path.join(HERE, 'voice')
rng = np.random.default_rng(11)

TL = json.load(open(os.path.join(HERE, 'src', 'timeline.json'), encoding='utf-8'))
FPS = TL['fps']
START, at = {}, 0
for s in TL['steps']:
    START[s['id']] = at / FPS
    nxt = s.get('next')
    at += s['dur'] - (nxt['len'] if nxt and nxt['kind'] != 'cut' else 0)
TOTAL = at / FPS


# ---------------------------------------------------------------- helpers
def hz(name):
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    semis = names[name[0]] + name.count('#') - name.count('b') + (int(name[-1]) - 4) * 12
    return 440.0 * 2 ** (semis / 12)


def tr(name, semis):
    return hz(name) * 2 ** (semis / 12)


def tt(dur):
    return np.arange(int(SR * dur)) / SR


def env(t, a=0.004, d=None, r=0.05, dur=None):
    e = np.minimum(1, t / a)
    if d:
        e = e * np.exp(-t * d)
    if dur:
        e = e * np.clip((dur - t) / r, 0, 1)
    return e


def filt(x, lo=None, hi=None):
    n = x.shape[0]
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    X = np.fft.rfft(x, axis=0)
    return np.fft.irfft(X * (g[:, None] if x.ndim == 2 else g), n=n, axis=0)


def reverb(x, seconds=1.6, mix=0.22):
    n_ir = int(SR * seconds)
    t = np.arange(n_ir) / SR
    ir = rng.standard_normal((n_ir, 2)) * np.exp(-t * 6.5 / seconds)[:, None]
    ir = filt(ir, hi=5000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    n = x.shape[0] + n_ir
    size = 1 << (n - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, size, axis=0) * np.fft.rfft(ir, size, axis=0), size, axis=0)[: x.shape[0]]
    return x * (1 - mix) + wet * mix


class Mix:
    def __init__(self, dur):
        self.buf = np.zeros((int(SR * (dur + 4)), 2))

    def add(self, t0, sig, gain=1.0, pan=0.5):
        i = int(round(t0 * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(self.buf.shape[0], i + sig.shape[0])
        if j <= i:
            return
        sig = sig[: j - i]
        if sig.ndim == 1:
            self.buf[i:j, 0] += sig * gain * np.cos(pan * np.pi / 2) * 1.414
            self.buf[i:j, 1] += sig * gain * np.sin(pan * np.pi / 2) * 1.414
        else:
            self.buf[i:j] += sig * gain


# ---------------------------------------------------------------- instruments
def pizz(f, dur=0.4):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.2 * np.sin(6 * np.pi * f * t)
    return s * env(t, 0.003, 9, 0.03, dur)


def marimba(f, dur=0.5):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.3 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t * 30)
    return s * env(t, 0.002, None, 0.03, dur)


def glock(f, dur=1.2):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.5) + 0.35 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 8)
    return s * env(t, 0.002, None, 0.05, dur)


REED = [1, 0.95, 0.7, 0.55, 0.4, 0.33, 0.22, 0.16, 0.11, 0.08, 0.05]


def reed(f, dur, vib=0.006, bend=0.0):
    """Bassoon-ish double reed; bend = semitones of downward slide over the note."""
    t = tt(dur)
    fv = f * 2 ** (-bend * t / dur / 12) * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.15))
    ph = 2 * np.pi * np.cumsum(fv) / SR
    s = sum(a * np.sin(k * ph) for k, a in enumerate(REED, 1) if f * k < 9000)
    return 0.35 * s * env(t, 0.025, None, 0.06, dur)


def brass(freqs, dur=0.6):
    t = tt(dur)
    out = np.zeros(t.size)
    for f in freqs:
        for det in (-6, 0, 6):
            fd = f * 2 ** (det / 1200)
            out += sum(np.sin(2 * np.pi * fd * k * t) / k for k in range(1, 14) if fd * k < 8000)
    bright = np.exp(-t * 3)
    return out / len(freqs) * 0.3 * env(t, 0.015, 2.2, 0.08, dur) * (0.6 + 0.4 * bright)


def woodblock(f=950, dur=0.12):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.48 * t)) * np.exp(-t * 55)


def kick(dur=0.35):
    t = tt(dur)
    return np.sin(2 * np.pi * (50 * t + 100 / 30 * (1 - np.exp(-t * 30)))) * np.exp(-t * 10)


def snare(dur=0.22, body=0.5):
    t = tt(dur)
    n = filt(rng.standard_normal(t.size), lo=1200, hi=7000) * np.exp(-t * 22)
    return 0.6 * n + body * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)


def hat(dur=0.06):
    t = tt(dur)
    return filt(rng.standard_normal(t.size), lo=7000) * np.exp(-t * 80) * 0.5


def cymbal(dur=2.2):
    t = tt(dur)
    return filt(rng.standard_normal(t.size), lo=4000, hi=12000) * np.exp(-t * 2.2) * 0.6


def slide_whistle(f0, f1, dur):
    t = tt(dur)
    k = t / dur
    f = f0 * (f1 / f0) ** (k ** 0.8) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    breath = filt(rng.standard_normal(t.size), lo=1500, hi=6000) * 0.04
    return (np.sin(ph) + 0.08 * np.sin(2 * ph) + breath) * env(t, 0.03, None, 0.05, dur)


def boing(dur=0.7):
    t = tt(dur)
    f = 130 * (1 + 1.2 * t) * (1 + 0.35 * np.sin(2 * np.pi * 15 * t) * np.exp(-t * 3))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.exp(-t * 4) * env(t, 0.003)


def thud(dur=0.8):
    t = tt(dur)
    s = np.sin(2 * np.pi * (40 * t + 60 / 12 * (1 - np.exp(-t * 12)))) * np.exp(-t * 6)
    return s + filt(rng.standard_normal(t.size), hi=900) * np.exp(-t * 18) * 0.7


def choir(freqs, dur):
    """Soft 'aah' pad (formant-ish harmonics) for the heavenly onigiri moment."""
    t = tt(dur)
    out = np.zeros((t.size, 2))
    for i, f in enumerate(freqs):
        for det, pan in ((-7, 0.3), (7, 0.7)):
            fd = f * 2 ** (det / 1200) * (1 + 0.004 * np.sin(2 * np.pi * 4.8 * t + i))
            ph = 2 * np.pi * np.cumsum(fd) / SR
            amps = [1, 0.6, 0.45, 0.2, 0.25, 0.1]  # vowel-ish 'ah'
            s = sum(a * np.sin(k * ph) for k, a in enumerate(amps, 1))
            out[:, 0] += s * (1 - pan)
            out[:, 1] += s * pan
    e = np.minimum(1, t / 0.5) * np.clip((dur - t) / 1.2, 0, 1)
    return out * e[:, None] * 0.12


def sparkle():
    t = tt(2.5)
    out = np.zeros((t.size, 2))
    for i, n in enumerate(['C6', 'E6', 'G6', 'C7', 'E7', 'G7']):
        d = int(SR * i * 0.045)
        g = glock(hz(n), 2.5)[: t.size - d]
        out[d:, 0] += g * (0.3 + 0.4 * (i % 2))
        out[d:, 1] += g * (0.7 - 0.4 * (i % 2))
    return out * 0.35


def tape_stop(m, t_end, length=0.55):
    """Slow the music down to a halt (record-stop gag) ending at t_end."""
    a, b = int((t_end - length) * SR), int(t_end * SR)
    seg = m.buf[a:b].copy()
    n = seg.shape[0]
    rate = np.linspace(1, 0, n) ** 0.7
    pos = np.cumsum(rate)
    pos = np.clip(pos, 0, n - 1)
    out = np.stack([np.interp(pos, np.arange(n), seg[:, c]) for c in range(2)], axis=1)
    m.buf[a:b] = out * np.linspace(1, 0.2, n)[:, None]
    m.buf[b : b + int(0.25 * SR)] = 0


# ---------------------------------------------------------------- the comic theme
THEME = [  # (beat, note, beats) in C major, 4 bars
    (0, 'G4', .4), (1, 'E4', .4), (1.5, 'G4', .4), (2, 'C5', .8), (3, 'G4', .4),
    (4, 'F4', .4), (5, 'D4', .4), (5.5, 'F4', .4), (6, 'B4', .8), (7, 'G4', .4),
    (8, 'E4', .4), (8.5, 'G4', .4), (9, 'C5', .4), (9.5, 'E5', .4), (10, 'D5', .4), (10.5, 'C5', .4), (11, 'B4', .4),
    (12, 'A4', .4), (12.5, 'B4', .4), (13, 'C5', .9), (14.5, 'G4', .25), (15, 'C4', .4),
]
CHORDS = [  # bass, chord tones per bar
    ('C3', ['E4', 'G4', 'C5']), ('G2', ['F4', 'G4', 'B4']), ('C3', ['E4', 'G4', 'C5']), ('G2', ['F4', 'G4', 'B4']),
]


def theme(m, t0, t1, bpm=132, key=0, drums=False, melody=True, gain=1.0):
    """Loops the oom-pah theme from t0, cutting everything that would start after t1."""
    beat = 60 / bpm
    b = 0
    while t0 + b * beat < t1 - 0.01:
        bar = int(b // 4) % 4
        pos = b % 4
        t = t0 + b * beat
        bass, chord = CHORDS[bar]
        if pos in (0, 2):
            bn = bass if pos == 0 else tr(bass, 7)
            m.add(t, pizz(tr(bass, key) if pos == 0 else bn * 2 ** (key / 12), 0.45), 0.55 * gain, 0.45)
        else:
            for n in chord:
                m.add(t, pizz(tr(n, key - 12), 0.25), 0.16 * gain, 0.6)
        if drums:
            if pos in (0, 2):
                m.add(t, kick(), 0.55 * gain)
            else:
                m.add(t, snare(), 0.32 * gain, 0.55)
            m.add(t + beat / 2, hat(), 0.25 * gain, 0.7)
        else:
            m.add(t + beat / 2, woodblock(1100 if pos % 2 else 900), 0.1 * gain, 0.3)
        b += 1
    if melody:
        loop_beats = 16
        k = 0
        while t0 + k * loop_beats * beat < t1:
            for (bt, n, ln) in THEME:
                t = t0 + (k * loop_beats + bt) * beat
                if t < t1 - 0.05:
                    d = min(ln * beat, t1 - t)
                    m.add(t, reed(tr(n, key - 12), d), 0.55 * gain, 0.5)
                    m.add(t, marimba(tr(n, key + 12), 0.3), 0.08 * gain, 0.65)
            k += 1


# ---------------------------------------------------------------- score
def score():
    S = START
    m = Mix(TOTAL)
    cut = TL['montageCut'] / FPS

    # A. Opening: twinkle, then tiptoe pizzicato
    for i, n in enumerate(['C6', 'E6', 'G6', 'C7']):
        m.add(0.25 + i * 0.09, glock(hz(n)), 0.25, 0.3 + i * 0.13)
    cap = 56 / FPS
    walk = ['C3', 'E3', 'G3', 'A3', 'Bb3', 'A3', 'G3', 'E3']
    beat = 60 / 132
    t, i = cap, 0
    while t < S['morning'] - 0.5:
        m.add(t, pizz(hz(walk[i % len(walk)]), 0.3), 0.45, 0.4)
        m.add(t + beat / 2, woodblock(1000 if i % 2 else 820), 0.12, 0.7)
        t += beat
        i += 1
    for i, n in enumerate(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6']):  # marimba run-up
        m.add(S['morning'] - 0.32 + i * 0.04, marimba(hz(n)), 0.22, 0.6)

    # B. Morning → natto: the comic theme. Magic: up a step, with drums.
    beat = 60 / 132
    magic_q = S['morning'] + round((S['magic'] - S['morning']) / beat) * beat
    theme(m, S['morning'], magic_q, key=0)
    m.add(magic_q, brass([hz('D4'), hz('F#4'), hz('A4')], 0.35), 0.35)
    m.add(magic_q, cymbal(1.2), 0.25)
    theme(m, magic_q, S['onigiri'], key=2, drums=True, gain=1.05)
    tape_stop(m, S['onigiri'], 0.6)

    # C. Onigiri: heavenly 'aah' and twinkles
    m.add(S['onigiri'], sparkle(), 1.0)
    m.add(S['onigiri'] + 0.1, choir([hz('C4'), hz('E4'), hz('G4'), hz('C5')], S['lunge'] - S['onigiri'] - 0.3), 1.0)
    pent = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7']
    t = S['onigiri'] + 0.6
    while t < S['lunge'] - 0.8:
        m.add(t, glock(hz(pent[rng.integers(len(pent))])), 0.1, rng.uniform(0.2, 0.8))
        t += 0.3

    # D. Lunge: slide whistle up, boing, marimba chase
    m.add(S['lunge'] - 0.45, slide_whistle(380, 1500, 0.45), 0.28, 0.6)
    m.add(S['lunge'], boing(), 0.35, 0.45)
    m.add(S['lunge'], snare(), 0.4)
    beat = 60 / 160
    chase = ['C5', 'G4', 'Eb5', 'G4', 'D5', 'G4', 'B4', 'G4']
    t, i = S['lunge'] + 0.15, 0
    while t < S['eating'] - 0.1:
        m.add(t, marimba(hz(chase[i % 8]), 0.25), 0.25, 0.35 + 0.3 * (i % 2))
        if i % 4 == 0:
            m.add(t, kick(), 0.4)
            m.add(t, pizz(hz('C3'), 0.3), 0.4)
        if i % 4 == 2:
            m.add(t, pizz(hz('G2'), 0.3), 0.4)
        t += beat / 2
        i += 1

    # E. First bite: music-box waltz, dreamy
    m.add(S['eating'], sparkle(), 0.6)
    beat = 60 / 100
    box = [('E5', 0), ('G5', 1), ('C6', 2), ('B5', 3), ('G5', 4), ('E5', 5),
           ('F5', 6), ('A5', 7), ('C6', 8), ('B5', 9), ('D6', 10), ('G5', 11)]
    for n, b in box:
        t = S['eating'] + 0.3 + b * beat * 0.66
        if t < S['koharu'] - 0.9:
            m.add(t, glock(hz(n)), 0.22, 0.4 + 0.2 * (b % 2))
    m.add(S['eating'] + 0.2, choir([hz('F3'), hz('A3'), hz('C4')], 2.2), 0.6)
    m.add(S['eating'] + 2.2, choir([hz('E3'), hz('G3'), hz('C4')], S['koharu'] - S['eating'] - 2.0), 0.6)

    # F. Koharu falls: whistle down, thud, sad-trombone 'wah wah wah wahhh'
    m.add(S['koharu'] - 0.75, slide_whistle(1600, 260, 0.75), 0.3, 0.55)
    m.add(S['koharu'], thud(), 0.75)
    m.add(S['koharu'] + 0.05, cymbal(1.0), 0.15)
    wah = [('G3', 0.42, 0), ('F#3', 0.42, 0), ('F3', 0.42, 0), ('E3', 1.4, 0.6)]
    t = S['koharu'] + 0.55
    for n, d, bend in wah:
        m.add(t, reed(hz(n), d * 0.95, vib=0.02 if d > 1 else 0.006, bend=bend), 0.7, 0.5)
        t += d
    beat = 60 / 132
    tip = ['C3', 'D3', 'E3', 'C3', 'G2', 'A2', 'B2', 'G2']
    i = 0
    while t < S['montage'] - 0.6:
        m.add(t, pizz(hz(tip[i % 8]), 0.25), 0.4, 0.4)
        m.add(t + beat / 2, woodblock(900 if i % 2 else 1150), 0.1, 0.65)
        t += beat
        i += 1
    m.add(S['montage'] - 0.35, snare(), 0.25)
    m.add(S['montage'] - 0.18, snare(), 0.35)

    # G. Montage: theme, fast, full band; brass hit on every cut
    theme(m, S['montage'], S['tagline'] + 0.2, bpm=150, drums=True, gain=1.1)
    for i in range(4):
        m.add(S['montage'] + i * cut, brass([hz('C4'), hz('E4'), hz('G4')], 0.3), 0.3, 0.5)

    # H. Tagline: droopy bassoon, then drum roll into the title
    m.add(S['tagline'] + 0.15, pizz(hz('A2'), 0.6), 0.5)
    sad = [('A3', 0.45), ('G3', 0.45), ('F3', 0.45), ('E3', 0.9)]
    t = S['tagline'] + 0.15
    for n, d in sad:
        m.add(t, reed(hz(n) / 2, d * 0.95, vib=0.015), 0.75, 0.5)
        t += d
    stamp = S['title'] + TL['stampAt'] / FPS
    roll_from = t + 0.2
    n_hits = int((stamp - roll_from) / 0.055)
    for k in range(max(n_hits, 0)):
        g = 0.15 + 0.45 * (k / max(n_hits, 1)) ** 1.5
        m.add(roll_from + k * 0.055, snare(0.12, body=0.0), g, 0.5)

    # I. Title: TA-DA! then the theme to close, final button
    m.add(stamp, brass([hz('C4'), hz('E4'), hz('G4'), hz('C5')], 1.4), 0.55)
    m.add(stamp, cymbal(2.5), 0.4)
    m.add(stamp, kick(), 0.6)
    beat = 60 / 132
    outro = stamp + 1.0
    end = outro + 8 * beat
    theme(m, outro, end, drums=True, gain=0.9)
    m.add(end, brass([hz('C4'), hz('E4'), hz('G4'), hz('C5')], 1.8), 0.5)
    m.add(end, glock(hz('C6'), 2.0), 0.3)
    m.add(end, cymbal(2.4), 0.3)
    m.add(end, kick(), 0.6)
    return m, end


# ---------------------------------------------------------------- voices
def load_audio(path):
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, 'v.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ac', '2', '-ar', str(SR), wav], check=True)
        with wave.open(wav) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
    return x.reshape(-1, 2)


AUDIO_EXT = ('.wav', '.mp3', '.m4a', '.ogg', '.flac')


def find_voice(name):
    """Matches 'natto' to natto.wav, and '03' to VOICEPEAK exports like '03-セリフ.wav'."""
    stem = os.path.splitext(name)[0]
    if not os.path.isdir(VOICE_DIR):
        return None
    files = sorted(f for f in os.listdir(VOICE_DIR) if f.lower().endswith(AUDIO_EXT))
    for f in files:
        if os.path.splitext(f)[0] == stem:
            return os.path.join(VOICE_DIR, f)
    for f in files:
        if f.startswith(stem + '-') or f.startswith(stem + '_'):
            return os.path.join(VOICE_DIR, f)
    return None


def trim_and_level(x, target_db=-16.0):
    """Cuts leading/trailing silence and levels the spoken part (not the padding)."""
    mono = np.abs(x).mean(axis=1)
    win = int(0.02 * SR)
    e = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode='same'))
    thr = max(e.max() * 0.08, 1e-4)
    idx = np.where(e > thr)[0]
    if idx.size == 0:
        return x
    a = max(0, idx[0] - int(0.05 * SR))
    b = min(x.shape[0], idx[-1] + int(0.15 * SR))
    x = x[a:b].copy()
    speech = e[a:b] > thr
    rms = np.sqrt((x[speech] ** 2).mean()) + 1e-9
    x *= 10 ** (target_db / 20) / rms
    peak = np.abs(x).max()
    if peak > 0.95:
        x *= 0.95 / peak
    n = int(0.01 * SR)  # tiny fades so cuts don't click
    ramp = np.linspace(0, 1, n)[:, None]
    x[:n] *= ramp
    x[-n:] *= ramp[::-1]
    return x


def voices(total_samples):
    track = np.zeros((total_samples, 2))
    duck = np.zeros(total_samples)
    ends = {}  # voice file -> end time, so a line can follow the previous one
    for v in TL['voices']:
        path = find_voice(v['file'])
        label = f"{v['who']}{v.get('n', '')}番目「{v['text']}」"
        if not path:
            print(f"  - voice/{v['file']}: なし（{label}）")
            continue
        x = trim_and_level(load_audio(path))
        if 'after' in v:
            if v['after'] not in ends:
                print(f"  - voice/{v['file']}: {v['after']} がないので省略（{label}）")
                continue
            t0 = ends[v['after']] + v.get('gap', 6) / FPS
        else:
            t0 = START[v['step']] + v['at'] / FPS
        i = int(t0 * SR)
        ends[v['file']] = t0 + x.shape[0] / SR
        j = min(total_samples, i + x.shape[0])
        track[i:j] += x[: j - i]
        duck[max(0, i - int(0.08 * SR)) : j + int(0.25 * SR)] = 1
        print(f"  + voice/{os.path.basename(path)}: {x.shape[0] / SR:.1f}s @ {i / SR:.2f}s")
    k = int(0.12 * SR)  # smooth the ducking envelope
    duck = np.convolve(duck, np.ones(k) / k, mode='same')
    return track, duck


def save(name, x):
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'{name}: {x.shape[0] / SR:.2f}s')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    m, _ = score()
    n = int(TOTAL * SR)
    music = reverb(m.buf[:n], 1.4, 0.18)
    music = filt(music, lo=35, hi=12000)
    music *= 0.5 / (np.abs(music).max() + 1e-9)
    fade = np.clip((TOTAL - np.arange(n) / SR) / 1.2, 0, 1)
    music *= fade[:, None]
    print('voices:')
    vo, duck = voices(n)
    mix = music * (1 - 0.6 * duck)[:, None] + vo
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # gentle soft clip
    mix *= 0.84 / (np.abs(mix).max() + 1e-9)
    save('soundtrack.wav', mix)
    for old in ('bgm_pad.wav', 'bgm_pulse.wav', 'sfx_impact.wav', 'sfx_shimmer.wav', 'sfx_whoosh.wav', 'sfx_hit.wav'):
        p = os.path.join(OUT, old)
        if os.path.exists(p):
            os.remove(p)
