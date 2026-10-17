# film.json 旁白 → Gemini 3.8 Flash TTS（Kore）→ 修頭尾靜音 → 48 kHz 單聲道 audio/<id>.wav
# 只重做缺檔場景；python tts_gen.py s03 s05 強制重做
import json,subprocess,os,sys
from concurrent.futures import ThreadPoolExecutor
sys.stdout.reconfigure(encoding='utf-8')
F=json.load(open('film.json',encoding='utf-8'));force=set(sys.argv[1:])
TRIM='silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse'
def one(s):
    out=f"audio/{s['id']}.wav";raw=f"audio/raw/{s['id']}.wav"
    if s['id'] in force:
        for p in (out,raw):
            if os.path.exists(p): os.remove(p)
    if os.path.exists(out) and os.path.getsize(out)>10000: return s['id'],'cached'
    for i in range(3):
        r=subprocess.run([sys.executable,'K:/antigravity/scripts/gemini_tts.py',s['narration'],'-v','Kore','-o',raw],capture_output=True,text=True,encoding='utf-8',env={**os.environ,'PYTHONIOENCODING':'utf8'})
        if os.path.exists(raw) and os.path.getsize(raw)>10000: break
    else: return s['id'],'FAIL '+r.stderr[-200:]
    subprocess.run(['ffmpeg','-y','-v','error','-i',raw,'-af',TRIM,'-ar','48000','-ac','1',out],check=True)
    return s['id'],'ok'
with ThreadPoolExecutor(3) as ex:
    for k,st in ex.map(one,F['scenes']): print(k,st)
