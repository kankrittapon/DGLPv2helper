# 🎯 DGLP Quiz Helper

> Chrome/Edge Extension สำหรับดึงข้อมูลแบบทดสอบจากระบบ DGA E-Learning เพื่อนำไปใช้ทบทวนและศึกษาเพิ่มเติม

---

## 📌 จุดประสงค์

Extension นี้ **ไม่ได้ออกแบบมาเพื่อโกงข้อสอบ** แต่เป็นเครื่องมือช่วย **ดึงข้อมูลแบบทดสอบ** (Extract) ออกมาจากหน้าเว็บ เพื่อให้ผู้เรียนสามารถ:

- 📚 **ทบทวนเนื้อหา** — นำคำถามไปค้นคว้าเพิ่มเติมจากแหล่งข้อมูลต่าง ๆ
- 🤖 **ใช้ AI เป็นผู้ช่วยสอน** — วางคำถามใน ChatGPT / Gemini เพื่อให้อธิบายเหตุผลของแต่ละตัวเลือก ช่วยให้เข้าใจเนื้อหาอย่างลึกซึ้ง
- 📝 **รวบรวมข้อสอบ** — เก็บข้อมูลแบบทดสอบไว้อ่านทบทวนภายหลัง แทนที่จะจดด้วยมือ
- ⚡ **ประหยัดเวลา** — ลดเวลาในการ Copy/Paste ข้อมูลทีละข้อ

> [!NOTE]
> การเรียนรู้ที่แท้จริงมาจากการทำความเข้าใจ ไม่ใช่การจำคำตอบ
> เครื่องมือนี้ช่วยให้คุณ **เข้าถึงเนื้อหาได้เร็วขึ้น** เพื่อนำไปศึกษาต่อ

---

## ✨ ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 📋 **ดึงข้อสอบ** | ดึงคำถาม+ตัวเลือกจากหน้า Quiz ทั้งหมดในคลิกเดียว |
| 📎 **Auto-copy** | Copy ข้อสอบพร้อม Prompt ลง Clipboard อัตโนมัติ |
| 🤖 **ใส่คำตอบ** | วางเฉลยจาก AI → Parser อัจฉริยะรองรับหลาย format |
| 📡 **API Interceptor** | ดักจับ API response เก็บไว้วิเคราะห์ |
| ⚙️ **ตั้งค่ายืดหยุ่น** | ปรับ Prompt Template, Toggle ฟีเจอร์ได้ตามต้องการ |
| 🔢 **Badge** | แสดงจำนวนข้อสอบบน Icon Extension |

---

## 📦 ติดตั้ง

1. Clone หรือ Download โปรเจคนี้
   ```bash
   git clone https://github.com/<your-username>/dglp-helper.git
   ```
2. เปิด **Edge** → `edge://extensions/`  
   หรือ **Chrome** → `chrome://extensions/`
3. เปิด **Developer mode** (สวิตช์มุมขวาบน)
4. กด **Load unpacked** → เลือกโฟลเดอร์ `dglp-helper`
5. จะเห็น icon ขึ้นที่แถบ Extension ✅

---

## 🚀 วิธีใช้งาน

### ขั้นตอนที่ 1 — ดึงข้อสอบ
1. เปิดหน้าแบบทดสอบ DGA E-Learning
2. คลิก icon Extension → แท็บ **"ดึงข้อสอบ"**
3. กดปุ่ม → ข้อสอบทั้งหมดถูก copy ลง Clipboard อัตโนมัติ

### ขั้นตอนที่ 2 — ศึกษาเนื้อหา
4. เปิด AI (ChatGPT / Gemini / Claude)
5. **Ctrl+V** วางข้อสอบ → ให้ AI อธิบายเหตุผลของแต่ละตัวเลือก

### ขั้นตอนที่ 3 — กรอกคำตอบ (ทางเลือก)
6. กลับมาหน้า Quiz → แท็บ **"ใส่คำตอบ"**
7. วางเฉลย → กด **"ตรวจสอบเฉลย"** → กด **"ใส่คำตอบอัตโนมัติ"**

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
| Auto-copy | ✅ เปิด | Copy ข้อสอบลง Clipboard อัตโนมัติเมื่อดึง |
| Auto Submit | ❌ ปิด | กดส่งอัตโนมัติหลังใส่คำตอบ |
| API Interceptor | ✅ เปิด | ดักจับ API response เก็บไว้วิเคราะห์ |
| Prompt Template | แก้ได้ | ปรับข้อความที่ copy ไปถาม AI ใช้ `{questions}` แทนข้อสอบ |

---

## 📁 โครงสร้างไฟล์

```
dglp-helper/
├── manifest.json      # Manifest V3
├── popup.html         # UI (3 แท็บ: ดึงข้อสอบ / ใส่คำตอบ / ตั้งค่า)
├── popup.css          # Premium Dark Theme
├── popup.js           # Popup Logic
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

---

## ⚠️ ข้อควรทราบ

- Extension ทำงานเฉพาะบนเว็บ `e-learning.dga.or.th`
- ต้องเปิด Developer Mode เพื่อโหลด Extension แบบ Unpacked
- ผู้พัฒนาไม่รับผิดชอบต่อการนำไปใช้ในทางที่ผิดวัตถุประสงค์

---

## 📄 License

MIT License — ใช้งานได้อิสระ ดัดแปลงได้ตามต้องการ
