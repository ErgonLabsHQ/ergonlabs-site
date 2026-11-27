"""Draft narration for a lab film.

Reads the timeline (src/lab/desk/film.json), makes one Edge TTS clip per line, measures each clip and writes
the narration track plus the line start times the capture script needs.

    python lab-film/voice.py <work_dir>

Edge TTS is a draft voice only. Replace narration.wav with a recorded or licensed voice before posting, and
keep timings.json in step with it (same format: {"starts": [...], "duration": seconds}).
"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
FILM = json.loads((ROOT / 'src/lab/desk/film.json').read_text(encoding='utf-8'))
LEAD = 0.6  # silence before the first line


def duration(path: Path) -> float:
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(out.strip())


async def main(work: Path) -> None:
    work.mkdir(parents=True, exist_ok=True)
    clips = []
    for i, line in enumerate(FILM['lines']):
        mp3 = work / f'line{i:02d}.mp3'
        await edge_tts.Communicate(line['say'], FILM['voice'], rate=FILM['rate']).save(str(mp3))
        wav = work / f'line{i:02d}.wav'
        # trim the silence Edge leaves at both ends so the gaps are ours
        subprocess.run(
            ['ffmpeg', '-y', '-v', 'error', '-i', str(mp3), '-af',
             'silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
             'silenceremove=start_periods=1:start_threshold=-45dB,areverse',
             '-ar', '48000', '-ac', '1', str(wav)],
            check=True,
        )
        clips.append(wav)

    starts, t = [], LEAD
    for wav in clips:
        starts.append(round(t, 3))
        t += duration(wav) + FILM['gap']
    total = round(t - FILM['gap'] + FILM['tail'], 3)

    inputs, parts = [], []
    for i, (wav, s) in enumerate(zip(clips, starts)):
        inputs += ['-i', str(wav)]
        parts.append(f'[{i}:a]adelay={int(s * 1000)}:all=1[a{i}]')
    mix = ''.join(f'[a{i}]' for i in range(len(clips)))
    graph = ';'.join(parts) + f';{mix}amix=inputs={len(clips)}:normalize=0,apad=whole_dur={total},loudnorm=I=-16:TP=-1.5:LRA=11[out]'
    subprocess.run(
        ['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', graph, '-map', '[out]', '-t', str(total),
         '-ar', '48000', str(work / 'narration.wav')],
        check=True,
    )
    (work / 'timings.json').write_text(json.dumps({'starts': starts, 'duration': total}, indent=1), encoding='utf-8')
    print(f'{len(clips)} lines, {total:.1f} s -> {work / "narration.wav"}')


if __name__ == '__main__':
    asyncio.run(main(Path(sys.argv[1])))
