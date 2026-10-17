# 配樂＋音效 → audio/music.wav（48 kHz 立體聲，長度略短於全片；旁白下已預先降低音量）
# 配樂：程式合成柔和鋼琴＋音墊（72 BPM，Am9 → Fmaj7 → Cmaj7 → G6），與前幾支導覽片同系列，無版權疑慮
# 音效：場景切換橫掃、氣泡彈出、星星／保本點的小鈴聲、硬幣叮聲。旁白時點用與 scenes.js 相同的「關鍵字→句首」方法估計
import json,re,wave,numpy as np
SR=48000
T=json.load(open('timeline.json',encoding='utf-8'));total=T['durationSeconds'];N=int((total-0.02)*SR)
def rd(f):
    w=wave.open(f);assert w.getframerate()==SR,f
    a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
    return a.reshape(-1,w.getnchannels()).mean(1)
# ---- 旁白包絡（用來 duck） ----
voice=np.zeros(N,np.float32)
for s in T['scenes']:
    if not s['voice']:continue
    a=rd(s['voice']);i=int(s['voiceStartFrame']/T['fps']*SR);e=min(N,i+len(a));voice[i:e]+=np.abs(a[:e-i])
k=int(.35*SR);cs=np.cumsum(np.pad(voice,(k//2,k//2)));env=((cs[k:]-cs[:-k])/k)[:N]
env=np.clip(np.pad(env,(0,N-len(env)))*9,0,1)
# ---- 句首估計（與 scenes.js 同法） ----
def cue(sid,key):
    s=next(x for x in T['scenes'] if x['id']==sid)
    parts=[p.strip() for p in re.split(r'(?<=[，。？：；])',s['narration']) if p.strip()]
    L=lambda p:len(re.sub(r'[，。？：；\s]','',p));tot=sum(L(p) for p in parts)
    a=(s['voiceStartFrame']-s['startFrame'])/T['fps'];V=s['voiceFrames']/T['fps'];acc=0
    for p in parts:
        t0=a+V*acc/tot;acc+=L(p)
        if key in p:return s['startFrame']/T['fps']+t0
    raise KeyError((sid,key))
# ---- 配樂 ----
t=np.arange(N)/SR;mL=np.zeros(N,np.float32);mR=np.zeros(N,np.float32)
beat=60/72;bar=4*beat;f=lambda n:440*2**((n-69)/12)
chords=[[57,60,64,67,71],[53,57,60,64,67],[48,55,60,64,67],[55,59,62,64,69]]
for bi in range(int(total/bar)+2):
    ch=chords[bi%4];t0=bi*bar;i0=int(t0*SR);L=int((bar+.8)*SR);tt=np.arange(L)/SR
    ep=np.minimum(tt/.9,1)*np.minimum((bar+.8-tt)/.9,1)
    padL=sum(np.sin(2*np.pi*f(n-12)*tt)+.4*np.sin(2*np.pi*f(n)*tt*1.002)+.15*np.sin(2*np.pi*f(n-12)*2*tt) for n in ch[:4])/6
    padR=sum(np.sin(2*np.pi*f(n-12)*tt*1.001)+.4*np.sin(2*np.pi*f(n)*tt*.998)+.15*np.sin(2*np.pi*f(n-12)*2*tt) for n in ch[:4])/6
    e=min(L,N-i0)
    if e>0:mL[i0:i0+e]+=(padL*ep*.30)[:e];mR[i0:i0+e]+=(padR*ep*.30)[:e]
    arp=[ch[0]+12,ch[2]+12,ch[3]+12,ch[4]+12,ch[3]+12,ch[2]+12,ch[1]+12,ch[2]+12]
    for j,n in enumerate(arp):
        i1=int((t0+j*beat/2)*SR);l2=int(1.4*SR);t2=np.arange(l2)/SR
        pl=(np.sin(2*np.pi*f(n)*t2)+.3*np.sin(2*np.pi*f(n)*2*t2))*np.exp(-t2*3.2)*(1-np.exp(-t2*200))*.16*(.8+.2*((j%2)==0))
        e=min(l2,N-i1)
        if e>0:
            pan=.35+.3*np.sin(j*1.3);mL[i1:i1+e]+=pl[:e]*(1-pan);mR[i1:i1+e]+=pl[:e]*pan
fade=np.minimum(t/2.5,1)*np.clip((total-t)/3.5,0,1)
mus=np.stack([mL,mR],1);mus=mus/(np.abs(mus).max()+1e-6)*.5
duck=(1-.74*env)*fade
mus*=duck[:,None]*.34
# ---- 音效 ----
rng=np.random.default_rng(11)
def add(buf,x,at,gain=1.0,pan=.5):
    i=int(at*SR);e=min(N,i+len(x))
    if i<0 or e<=i:return
    buf[i:e,0]+=x[:e-i]*gain*(1-pan);buf[i:e,1]+=x[:e-i]*gain*pan
def whoosh(L=.55):
    n=int(L*SR);x=rng.standard_normal(n);y=np.zeros(n);a=0
    for i in range(n):
        c=.02+.30*np.sin(np.pi*i/n)**2;a+=c*(x[i]-a);y[i]=a
    hp=np.zeros(n);b=0
    for i in range(n):
        b+=.04*(y[i]-b);hp[i]=y[i]-b
    return hp*np.sin(np.pi*np.arange(n)/n)**2
def pop():
    n=int(.12*SR);tt=np.arange(n)/SR;return np.sin(2*np.pi*(520+900*tt*8)*tt)*np.exp(-tt*38)*.5
def bell(freq,L=1.2):
    n=int(L*SR);tt=np.arange(n)/SR;return (np.sin(2*np.pi*freq*tt)+.4*np.sin(2*np.pi*freq*2.01*tt)+.2*np.sin(2*np.pi*freq*3.02*tt))*np.exp(-tt*3.2)*(1-np.exp(-tt*300))*.35
def coin():
    n=int(.5*SR);tt=np.arange(n)/SR;return (np.sin(2*np.pi*1318*tt)+.6*np.sin(2*np.pi*1760*tt))*np.exp(-tt*9)*(1-np.exp(-tt*500))*.3
sfx=np.zeros((N,2),np.float32)
W=whoosh();W=W/np.abs(W).max()*.20
for s in T['scenes'][1:]:add(sfx,W,s['startFrame']/T['fps']-.30,1.0)
for sid,key in [('s01','他問了兩個問題'),('s01','下個月'),('s03','我離懸崖'),('s03','對，'),('s06','營收只少一成'),('s07','報告不分給他'),('s07','這樣比較公平'),('s09','老闆又問一次'),('s09','老闆問'),('s09','我說')]:
    add(sfx,pop(),cue(sid,key),.5,.5)
add(sfx,bell(1046.5),cue('s02','利潤，'),.6,.55)         # 利潤星星到了
add(sfx,bell(784),cue('s03','約一千二百一十七'),.55,.5)   # 保本點
add(sfx,bell(880),cue('s03','這個月計畫'),.4,.5)           # 計畫旗
add(sfx,coin(),cue('s07','貢獻一百一十九')+.45,.8,.5)      # 硬幣落地
add(sfx,bell(1318.5),cue('s09','已經到了')+.1,.6,.55)       # 利潤到了
out=mus+sfx*.55
out=np.clip(out,-1,1)
with wave.open('audio/music.wav','w') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes())
print('music.wav',round(N/SR,2),'s peak',round(float(np.abs(out).max()),3))
