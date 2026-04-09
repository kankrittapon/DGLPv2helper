# 🎯 DGLP Quiz Helper

> Chrome/Edge Extension สำหรับดึงข้อมูลแบบทดสอบจากระบบ DGA E-Learning เพื่อนำไปใช้ทบทวนและศึกษาเพิ่มเติม

---

## 📌 จุดประสงค์

Extension นี้ **ไม่ได้ออกแบบมาเพื่อโกงข้อสอบ** แต่เป็นเครื่องมือช่วย **ดึงข้อมูลแบบทดสอบ** (Extract) ออกมาจากหน้าเว็บ เพื่อให้ผู้เรียนสามารถ:

- 📚 **ทบทวนเนื้อหา** — นำคำถามไปค้นคว้าเพิ่มเติมจากแหล่งข้อมูลต่าง ๆ
- 🤖 **ใช้ AI เป็นผู้ช่วยสอน** — วางคำถามใน ChatGPT / Gemini เพื่อให้อธิบายเหตุผลของแต่ละตัวเลือก ช่วยให้เข้าใจเนื้อหาอย่างลึกซึ้ง
- 📝 **รวบรวมข้อสอบ** — เก็บข้อมูลแบบทดสอบไว้อ่านทบทวนภายหลัง แทนที่จะจดด้วยมือ
- ⚡ **ประหยัดเวลา** — ลดเวลาในการ Copy/Paste ข้อมูลทีละข้อ

> **หมายเหตุ**: การเรียนรู้ที่แท้จริงมาจากการทำความเข้าใจ ไม่ใช่การจำคำตอบ เครื่องมือนี้ช่วยให้คุณ **เข้าถึงเนื้อหาได้เร็วขึ้น** เพื่อนำไปศึกษาต่อ

---

## ✨ ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 📋 **ดึงข้อสอบ** | ดึงคำถาม+ตัวเลือกจากหน้า Quiz ทั้งหมดในคลิกเดียว |
| 📎 **Auto-copy** | Copy ข้อสอบพร้อม Prompt ลง Clipboard อัตโนมัติ |
| 🤖 **ถาม AI ในตัว** | เชื่อมต่อ AI โดยตรง ไม่ต้องสลับหน้าจอ |
| ⚡ **ใส่คำตอบ** | Parser อัจฉริยะรับหลาย format + Auto-fill |
| 📡 **API Interceptor** | ดักจับ API response เก็บไว้วิเคราะห์ |
| ⚙️ **ตั้งค่ายืดหยุ่น** | เลือก AI Provider, ปรับ Prompt Template ได้ |

---

## 🤖 AI Provider ที่รองรับ

| Provider | ประเภท | ค่าใช้จ่าย | หมายเหตุ |
|---|---|---|---|
| 💎 **Gemini** | Cloud API | ✅ **ฟรี** | แนะนำ — รับ API Key ฟรีที่ [aistudio.google.com](https://aistudio.google.com/apikey) |
| 🟠 **Claude** | Cloud API | 💳 ต้องมี API Key | จาก [console.anthropic.com](https://console.anthropic.com/) |
| ⚡ **Grok** | Cloud API | 💳 $25 เครดิตฟรี/เดือน | จาก [console.x.ai](https://console.x.ai/) |
| 🖥️ **Local LLM** | Self-hosted | ✅ ฟรี (ใช้เครื่องตัวเอง) | รองรับ Ollama, LM Studio, vLLM หรือ OpenAI-compatible |

---

## 📦 ติดตั้ง

1. Clone หรือ Download โปรเจคนี้
   ```bash
   git clone https://github.com/kankrittapon/DGLPv2helper.git
   ```
2. เปิด **Edge** → `edge://extensions/`  
   หรือ **Chrome** → `chrome://extensions/`
3. เปิด **Developer mode** (สวิตช์มุมขวาบน)
4. กด **Load unpacked** → เลือกโฟลเดอร์ `dglp-helper`
5. จะเห็น icon ขึ้นที่แถบ Extension ✅

---

## 🚀 วิธีใช้งาน

### วิธีที่ 1 — ถาม AI ในตัว (แนะนำ)
1. เปิดหน้าแบบทดสอบ DGA → คลิก icon Extension
2. กด **"ดึงข้อสอบ"**
3. กด **"🤖 ถาม AI เลย"** → รอ AI ตอบ
4. กด **"⚡ ใช้เฉลยนี้เลย"** → เติมคำตอบอัตโนมัติ

### วิธีที่ 2 — Copy ไปถาม AI เอง
1. กด **"ดึงข้อสอบ"** → ข้อสอบถูก copy ลง Clipboard
2. วางใน ChatGPT / Gemini / Claude
3. กลับมาแท็บ **"ใส่คำตอบ"** → วางเฉลย → กด **"ใส่คำตอบอัตโนมัติ"**

### วิธีที่ 3 — ทำเอง (Manual)
1. กด **"ดึงข้อสอบ"** เพื่อดูคำถาม
2. เลือกคำตอบเองบนหน้าเว็บ

---

## 📝 Format เฉลยที่รองรับ

Parser รองรับหลาย format — วางตรงจาก AI ได้เลย:

```
1. ข              ข้อ 1: ข            1:ข            Q1: B
2. ค              ข้อ 2: ค            2:ค            Q2: C
3. ง              ข้อ 3: ง            3:ง            Q3: D
```

---

## ⚙️ ตั้งค่า

| ตัวเลือก | Default | คำอธิบาย |
|---|---|---|
| AI Provider | Gemini | เลือกจาก Gemini / Claude / Grok / Local LLM |
| API Key | — | ใส่ API Key ของ Provider ที่เลือก |
| Auto-copy | ✅ เปิด | Copy ข้อสอบลง Clipboard อัตโนมัติเมื่อดึง |
| Auto Submit | ❌ ปิด | กดส่งอัตโนมัติหลังใส่คำตอบ |
| API Interceptor | ✅ เปิด | ดักจับ API response เก็บไว้วิเคราะห์ |
| Prompt Template | แก้ได้ | ปรับข้อความที่ส่งให้ AI ใช้ `{questions}` แทนข้อสอบ |

### ตั้งค่า Local LLM
สำหรับผู้ใช้ที่รัน LLM บนเครื่องตัวเอง:
- **Endpoint URL**: เช่น `http://localhost:11434/v1/chat/completions` (Ollama)
- **Model Name**: เช่น `llama3`, `qwen2.5`, `gemma2`

---

## 📁 โครงสร้างไฟล์

```
dglp-helper/
├── manifest.json      # Manifest V3
├── popup.html         # UI (3 แท็บ: ดึงข้อสอบ / ใส่คำตอบ / ตั้งค่า)
├── popup.css          # Premium Dark Theme
├── popup.js           # Popup Logic + AI Integration
├── content.js         # Content Script (API Interceptor)
├── background.js      # Service Worker + Badge
├── README.md
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 Tech Stack

- **Manifest V3** — มาตรฐานล่าสุดของ Chrome/Edge Extension
- **Vanilla JS** — ไม่พึ่ง Framework ภายนอก
- **Chrome APIs** — `scripting`, `storage`, `clipboardWrite`
- **AI APIs** — Gemini, Claude, Grok, OpenAI-compatible

---

## ⚠️ ข้อควรทราบ

- Extension ทำงานเฉพาะบนเว็บ `e-learning.dga.or.th`
- ต้องเปิด Developer Mode เพื่อโหลด Extension แบบ Unpacked
- API Key เก็บใน `chrome.storage.local` บนเครื่องของคุณเท่านั้น
- ผู้พัฒนาไม่รับผิดชอบต่อการนำไปใช้ในทางที่ผิดวัตถุประสงค์

---

## 📄 License

MIT License — ใช้งานได้อิสระ ดัดแปลงได้ตามต้องการ
