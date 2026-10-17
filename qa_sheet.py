import sys,glob
from PIL import Image,ImageDraw
fs=sorted(glob.glob('preview/qa/f_*.png'),key=lambda f:float(f.split('f_')[1][:-4]))
cols=int(sys.argv[2]) if len(sys.argv)>2 else 3;w,h=800,450;rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*h),'#222')
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize((w,h));d=ImageDraw.Draw(im);d.rectangle((0,0,110,26),fill='black');d.text((6,6),f.split('f_')[1][:-4]+'s',fill='yellow');S.paste(im,((i%cols)*w,(i//cols)*h))
S.save(sys.argv[1],quality=85);print(len(fs))
