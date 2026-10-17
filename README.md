# 《賣多少，才不虧？》Power BI 量本利分析報告動畫

3 分 30 秒、1920×1080、30 fps 的橫屏動畫（扁平插畫＋MG 動效）：月會上，老闆問「賣多少才不虧」，財務小琪用水桶、保本線和旗艦君回答，順帶帶老闆逛一圈 Power BI 報告。旁白 Gemini 3.8 Flash TTS Kore（溫和女聲）。

> 資料為**示範（模擬）資料**；人物與劇情為**虛構**，非原作者製作。畫面中的報表截圖取自公開發佈的 Power BI 報告（封面署名 @Ken.Liu）。

## 看成品

| 版本 | 網址 | 備註 |
|---|---|---|
| Vercel | https://powerbi-cvp-animation.vercel.app | 單頁：動畫＋章節跳轉＋事實與注意事項 |
| GitHub Pages | https://jamic710808.github.io/powerbi-cvp-animation/ | 來源是 `gh-pages` 分支 |
| 互動圖解導覽（動畫也嵌在裡面） | https://powerbi-cvp-explainer.vercel.app | 另一個專案：[powerbi-cvp-guide](https://github.com/jamic710808/powerbi-cvp-guide) |

## 內容與事實

| 場景 | 內容 |
|---|---|
| s01 月會 | 老闆盯著折線圖：銷售額漲了、利潤原地踏步 |
| s02 量價本利 | 水桶比喻：每賣 100 元，先付變動成本，剩下的邊際貢獻去填固定費用，才輪到利潤 |
| s03 保本線 | 374 ÷ 30.7% ≈ 1,217 萬；計畫 1,418 萬；安全邊際 14.2% |
| s04 報告登場 | 六張頁面、公司層與單品層 |
| s05 經營概覽 | 32 個月；每年二月利潤為負（原因報表沒說，不下結論） |
| s06 公司層 | 滑桿：營收 −10% → 利潤 62 → 18 萬；槓桿 7 倍；原生頁「透明」vs HTML 頁「絲滑」 |
| s07 旗艦君 | 單價 386.71、貢獻 119.02、可追溯貢獻 29 萬、保本 486 臺；共同固定費用不分攤 |
| s08 口徑與模型 | 3 張事實表、4 張維度表、7 條關聯、68 個度量值 |
| s09 回到會議室 | 保本 1,217 萬是底線，計畫 1,418 萬是睡得著的距離 |

數字來源與驗算見 [`script.md`](script.md)、[`brief.md`](brief.md)；「每 100 元」拆解為推算值、374 ÷ 30.7% 手算約 1,218 而報表為 1,217（貢獻率四捨五入）、固定費用構成圖分塊數字待確認而不引用——這些限定都落實在畫面上。

## 驗收

- 技術檢查通過：H.264/AAC、6,309 幀／210.300 秒、完整解碼無錯、整合響度 −15.9 LUFS、取樣峰值 −3.5 dBFS、5 個樣本幀亂序重畫一致。
- 視覺：看過預覽與成片抽樣畫面，並修正了版面問題；詳見 [`review.md`](review.md)。
- **沒有逐幀播放整片、沒有人實際聽過成片、沒有第二位評審**；使用者驗收待確認。

## 目錄

```
film.json                內容與鏡頭預算（單一來源）；timeline.json 由工具編譯，勿手改
script.md  brief.md  storyboard.md  style-options.md  style-choice.md  review.md
props.js                 共用繪圖：人物（小琪、老周）、旗艦君、利潤星、水桶、旗子…
scenes.js                九個場景；每一幀是時間的純函式
runtime.js  index.html   預覽與匯出舞台
tts_gen.py               Gemini TTS（Kore）→ audio/<id>.wav
mkaudio_cvp.py           程式合成配樂與音效 → audio/music.wav
tools/                   pipeline.py（timeline／mix／finish／validate）、render.cjs
assets/page0-5.jpg       報表六頁截圖（來自 bep 專案）
site/                    單頁網站：index.html、poster.jpg（animation.mp4 見下）
```

## 分支說明

- `main`：原始碼、劇本、分鏡、驗收紀錄與旁白音檔。**不含影片**（`final.mp4` 約 30 MB、`site/animation.mp4` 約 13 MB）與配樂／混音母檔，避免進歷史。
- `gh-pages`：網站檔案（`index.html`、`animation.mp4`、`poster.jpg`）＋ `.nojekyll`。

## 重新製作

需要 Node 22、Python（numpy）、ffmpeg、Playwright（含 Chrome），以及 Gemini TTS 腳本。腳本裡有**寫死的本機路徑**（`K:/antigravity/scripts/gemini_tts.py`），換電腦要先改。

```bash
export PLAYWRIGHT_MODULE=<playwright 模組路徑> CHROME_PATH=<chrome.exe> PYTHON=python
python tts_gen.py                           # 旁白（只重做缺檔場景）
python tools/pipeline.py timeline . --lock  # 鎖定時間軸
python mkaudio_cvp.py                       # 配樂與音效 → audio/music.wav
python tools/pipeline.py timeline . --lock && python tools/pipeline.py mix .
node tools/render.cjs . --preview           # 邊界與代表幀
node tools/render.cjs . --render            # 約 13 分鐘
python tools/pipeline.py finish .           # 合成 final.mp4 並技術檢查
```

## 已知限制

- 動作對旁白的時點由「旁白句子按字數比例估計」得出，字幕為近似分配，不是逐字對齊。
- 配樂為程式合成，未另外找現成曲目。
- 報表截圖來自線上公開發佈版（2026-10-11 擷取）。
