#!/usr/bin/env python3
"""Designs the game's sounds in SoundCraft and writes them to src/sounds/*.mp3.

SoundCraft is driven through its localhost control server, so the sounds are
made from its built-in synths and effects and can be rebuilt or tweaked here.

    /Applications/SoundCraft.app/Contents/MacOS/SoundCraft --control 47123 &
    python3 scripts/sounds.py          # from games/be-the-borrow-checker

Needs `lame` for the MP3s (brew install lame). SOUNDCRAFT_CONTROL_PORT picks
another port. Opens a new, unsaved session in SoundCraft.
"""
import json
import os
import socket
import subprocess
import tempfile

PORT = int(os.environ.get("SOUNDCRAFT_CONTROL_PORT", "47123"))
RATE = 48000
TICK = RATE // 960  # 480 ticks per quarter note at the session's 120 bpm: one tick is 50 samples.
SLOT = 6 * RATE  # Each sound gets its own six seconds, so reverb tails never overlap.
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "sounds")


def command(id, **params):
    with socket.create_connection(("127.0.0.1", PORT), timeout=30) as s:
        f = s.makefile("rw")
        f.write(json.dumps({"id": 1, "method": "command", "params": {"id": id, "params": params}}) + "\n")
        f.flush()
        reply = json.loads(f.readline())
    if not reply.get("ok"):
        raise SystemExit(f"{id} failed: {reply.get('error')}")
    return reply["result"]


PLUGINS = {}


def resolve(plugin, params):
    """Choice parameters take the index of their choice; let the designs below use the names."""
    spec = {p["id"]: p for p in PLUGINS[plugin]["params"]}
    return {k: spec[k]["choices"].index(v) if isinstance(v, str) else v for k, v in params.items()}


def instrument(name, plugin, params, inserts=()):
    track = command("track.new", kind="instrument", format="stereo", name=name, instrument=plugin)["tracks"][0]
    command("mix.instrument", track=track, plugin=plugin, params=resolve(plugin, params))
    for slot, (fx, fx_params) in enumerate(inserts):
        command("mix.insert", track=track, slot=slot, plugin=fx, params=resolve(fx, fx_params))
    return track


def notes(track, start, events):
    """events: (pitch, start_ticks, length_ticks, velocity)"""
    clip = command("midi.new_clip", track=track, start=start, length=SLOT - RATE)["clip"]
    for pitch, at, length, velocity in events:
        command("midi.note_add", clip=clip, pitch=pitch, start_ticks=at, length_ticks=length, velocity=velocity)


# Shared sounds: a soft sine-and-triangle bell, and a detuned brass-ish saw pair.
BELL = dict(osc1_wave="Sine", osc2_wave="Triangle", osc2_semitones=12, osc2_detune=4, osc_mix=30, cutoff=9000,
            resonance=0, filter_env_amount=0, amp_attack=1, amp_decay=420, amp_sustain=0, amp_release=380, velocity=60, level=-6)
BRASS = dict(osc1_wave="Saw", osc2_wave="Saw", osc2_semitones=0, osc2_detune=9, osc_mix=50, cutoff=900, resonance=18,
             filter_env_amount=55, filter_attack=40, filter_decay=260, filter_sustain=35, filter_release=300,
             amp_attack=18, amp_decay=200, amp_sustain=80, amp_release=220, velocity=50, level=-10)
PLATE = ("plate_reverb", dict(mix=22, pre_delay=12, decay=1.3, size=55, damping=9000, diffusion=80, width=100, low_cut=200))
ROOM = ("room_reverb", dict(mix=10, pre_delay=4, decay=0.5, size=25, damping=7000, diffusion=70, width=80, low_cut=120))


def stamp(at):
    """A rubber stamp hitting paper: a dull low thump with a papery slap on top."""
    t = instrument("stamp thump", "drum_synth", dict(level=0, kick_tune=-7, kick_decay=180, snare_tune=-10, snare_snappy=18, snare_decay=110),
                   [("saturator", dict(drive=6, bias=50, tone=6000, mix=60, output=-2)), ROOM])
    notes(t, at, [(36, 0, 120, 127), (38, 0, 120, 96)])
    return 0.45


def ding(at):
    """Right answer: a bright two-note chime, a fifth apart."""
    t = instrument("ding", "subtractive_synth", BELL, [PLATE])
    notes(t, at, [(84, 0, 200, 110), (91, 70, 400, 115)])
    return 1.4


def buzz(at):
    """Wrong answer: a low, grumpy two-step buzzer."""
    t = instrument("buzz", "subtractive_synth",
                   dict(osc1_wave="Saw", osc2_wave="Square", osc2_semitones=-12, osc2_detune=14, osc_mix=45, cutoff=1100, resonance=30,
                        filter_env_amount=-20, amp_attack=3, amp_decay=300, amp_sustain=70, amp_release=60, velocity=30, level=-12),
                   [("saturator", dict(drive=10, bias=50, tone=4000, mix=70, output=-4)), ROOM])
    notes(t, at, [(46, 0, 110, 110), (45, 150, 260, 110)])
    return 0.75


def click(at):
    """Buttons: a tiny woody tick."""
    t = instrument("click", "subtractive_synth",
                   dict(osc1_wave="Sine", osc2_wave="Triangle", osc2_semitones=7, osc_mix=35, cutoff=8000, resonance=0,
                        amp_attack=0.5, amp_decay=28, amp_sustain=0, amp_release=20, velocity=0, level=-8))
    notes(t, at, [(93, 0, 30, 100)])
    h = instrument("click hat", "drum_synth", dict(level=-14, hat_decay=25))
    notes(h, at, [(42, 0, 30, 80)])
    return 0.12


def combo(at):
    """Every third right answer in a row: a power-up sweep as the multiplier climbs."""
    t = instrument("combo", "subtractive_synth",
                   dict(osc1_wave="Saw", osc2_wave="Square", osc2_semitones=12, osc2_detune=6, osc_mix=40, cutoff=700, resonance=45,
                        filter_env_amount=70, filter_attack=5, filter_decay=180, filter_sustain=20, filter_release=200,
                        amp_attack=2, amp_decay=150, amp_sustain=50, amp_release=160, glide=35, velocity=40, level=-14),
                   [("chorus", dict(rate=0.8, depth=40, delay=12, feedback=10, mix=35, spread=90)), PLATE])
    notes(t, at, [(67, 0, 55, 100), (72, 55, 55, 105), (76, 110, 55, 110), (79, 165, 55, 115), (84, 220, 260, 120)])
    return 1.3


def fanfare(at):
    """Build succeeded: da-da-da-daaa, with a little drum roll under it."""
    t = instrument("fanfare", "subtractive_synth", BRASS,
                   [("chorus", dict(rate=0.5, depth=25, delay=14, feedback=5, mix=25, spread=100)), ("plate_reverb", dict(PLATE[1], mix=26, decay=1.8))])
    triplet = 80
    notes(t, at, [(67, 0, 70, 100), (67, triplet, 70, 100), (67, 2 * triplet, 70, 105)]
          + [(p, 3 * triplet, 720, 118) for p in (72, 76, 79, 84)])
    d = instrument("fanfare drums", "drum_synth", dict(level=-10, snare_tune=2, snare_snappy=60, snare_decay=160, tom_tune=-2, tom_decay=300),
                   [("room_reverb", dict(ROOM[1], mix=20))])
    notes(d, at, [(38, 0, 40, 70), (38, triplet, 40, 80), (38, 2 * triplet, 40, 95), (36, 3 * triplet, 100, 120), (41, 3 * triplet, 100, 90)])
    return 2.6


def sad_trombone(at):
    """Build failed: wah, wah, wah, waaah."""
    t = instrument("sad trombone", "subtractive_synth",
                   dict(BRASS, cutoff=650, resonance=25, filter_env_amount=45, filter_attack=90, filter_decay=300, amp_attack=45,
                        amp_release=260, glide=70, level=-9),
                   [("phaser", dict(rate=0.35, depth=40, stages="4", feedback=20, center=700, mix=30)),
                    ("room_reverb", dict(ROOM[1], mix=18, decay=0.9))])
    notes(t, at, [(58, 0, 300, 105), (57, 360, 300, 100), (56, 720, 300, 95), (55, 1080, 900, 100)])
    return 2.9


SOUNDS = [stamp, ding, buzz, click, combo, fanfare, sad_trombone]


def main():
    with socket.create_connection(("127.0.0.1", PORT), timeout=30) as s:
        f = s.makefile("rw")
        f.write(json.dumps({"id": 1, "method": "command", "params": {"id": "engine.plugins"}}) + "\n")
        f.flush()
        PLUGINS.update({p["id"]: p for p in json.loads(f.readline())["result"]})
    command("session.new", name="Be the Borrow Checker sounds", template="blank")
    lengths = [make(i * SLOT) for i, make in enumerate(SOUNDS)]
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for i, (make, seconds) in enumerate(zip(SOUNDS, lengths)):
            name = make.__name__.replace("_", "-")
            wav = os.path.join(tmp, name + ".wav")
            r = command("file.bounce_mix", path=wav, format="wav", bit_depth=16, start=i * SLOT, end=i * SLOT + int(seconds * RATE),
                        normalize=True, dither=True)
            mp3 = os.path.join(OUT, name + ".mp3")
            subprocess.run(["lame", "--quiet", "--noreplaygain", "-m", "j", "-V", "5", wav, mp3], check=True)
            print(f"{name:13} {seconds:4.2f}s  {r['lufs']:6.1f} LUFS before normalizing  {os.path.getsize(mp3) // 1024:3} KB")


if __name__ == "__main__":
    main()
