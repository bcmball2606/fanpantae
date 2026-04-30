# แฟนพันธุ์แท้ GeoGuessr — Online

เว็บไซต์การแข่งขัน "แฟนพันธุ์แท้ออนไลน์" หัวข้อ GeoGuessr (หรือหัวข้ออื่นที่ admin กำหนด) ที่มี 4 โหมด รวม 100 คะแนน พร้อม leaderboard ประจำชุดคำถาม

ธีมเลียนแบบรายการแฟนพันธุ์แท้ ปี 2005 (น้ำเงิน + ส้ม + เขียวมะนาว, ตัวเลขสไตล์ retro digital)

## โหมดเกม

| # | โหมด | คะแนนเต็ม | กติกาย่อ |
|---|------|-----------|---------|
| 1 | 3 วินาที | 25 (ข้อละ 1) | 25 ข้อย่อย, 6 ช่อยส์ + ข้าม, นับถอยหลัง 3 วิ/ข้อ — ผิด/หมดเวลา = จบโหมด, ข้าม = 0 คะแนนข้อนั้น |
| 2 | คำถาม-คำตอบ | 25/20/15/10/5 | พิมพ์ตอบ 5 นาที — เปิดช่อยส์ลด 25→20, ตัดทีละช่อยส์ -5 (ขั้นต่ำ 5) |
| 3 | จิ๊กซอว์ 5×5 | 25 → 0 | ต้องเปิดอย่างน้อย 1 ช่อง, เปิดเพิ่มแต่ละช่อง -5 |
| 4 | คุณสมบัติ 5 ข้อ | 25/20/15/10/5 | เปิดเลือกได้, เปิด 1 = 25, ครบ 5 = 5 |

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TailwindCSS 4**
- **Supabase** (Postgres + Storage)
- TypeScript

## Setup

### 1. Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. ไปที่ SQL Editor → รันสคริปต์ใน `supabase/schema.sql` ทั้งหมด
3. ตรวจดูว่ามี bucket ชื่อ `fanpantae` (public) ใน Storage แล้ว
4. เก็บค่าจาก Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (เก็บเป็นความลับ — เซิร์ฟเวอร์เท่านั้น)

### 2. Local development

```powershell
# ติดตั้ง dependency
npm install

# คัดลอก env แล้วใส่ค่าจริง
Copy-Item env.example .env.local
notepad .env.local

# รัน dev server
npm run dev
```

ตัวแปรใน `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=ตั้งรหัสยาก ๆ
```

เปิด <http://localhost:3000>

### 3. การใช้งาน

- **/admin** — ใส่ `ADMIN_PASSWORD` แล้วจะเข้าหน้าจัดการชุดคำถาม
  - สร้างชุดใหม่ → กรอกคำถาม/คำตอบของทั้ง 4 โหมด → กด **บันทึก** → toggle **เปิดรับ**
  - คัดลอก PIN ส่งให้ผู้เล่น
  - **Export JSON** เพื่อ backup, **Import JSON** เพื่อย้ายชุดข้ามโปรเจกต์
- **หน้าแรก /** — ผู้เล่นกรอกชื่อ + PIN เพื่อเริ่มเล่น
- **/leaderboard/[setId]** — ดูอันดับสาธารณะของชุดนั้น

## โครงสร้างโปรเจกต์

```
app/
  page.tsx                      หน้าแรก (กรอกชื่อ+PIN)
  play/[attemptId]/             หน้าเล่น (orchestrator → Mode1-4)
  summary/[attemptId]/          สรุปคะแนน + leaderboard ในตัว
  leaderboard/[setId]/          leaderboard สาธารณะ
  admin/                        login + dashboard + editor
  api/
    play/{start,state,mode1..4} เซิร์ฟเวอร์ตรวจคำตอบ + เก็บสถานะ
    admin/{login,sets,upload}   จัดการชุดคำถาม
    leaderboard
components/
  GameShell.tsx                 layout + ScoreBox + Lights + QuestionBar
  Mode1..4.tsx                  4 โหมด
lib/
  types.ts                      shared types + initialProgress()
  scoring.ts                    การคิดคะแนน
  supabase.ts                   service-role client
  publicSet.ts                  sanitize set ก่อนส่งให้ client
  playHelper.ts                 loadAttempt + saveProgress
  adminAuth.ts                  cookie-based admin gate
  sfx.ts                        WebAudio sound effects
supabase/
  schema.sql                    DDL สำหรับสร้างตาราง
```

## ความปลอดภัย

- Service role key อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น — ไม่มีการ expose ไปฝั่ง client
- การเฉลย/คะแนนทุกโหมดถูกตรวจที่ฝั่งเซิร์ฟเวอร์ — client บอกว่าตอบอะไร เซิร์ฟเวอร์เป็นคนตัดสิน
- 1 ชื่อ + PIN ของชุด = เล่นได้ครั้งเดียว (unique key ใน DB)
- ผู้เล่นที่เริ่มเล่นไปแล้วและยังไม่จบจะ resume ไปต่อจากตรงที่ค้างได้

## Deploy บน Vercel

1. push โค้ดขึ้น GitHub
2. ที่ Vercel → New Project → import repo
3. ใส่ environment variables 3 ตัว (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`)
4. Deploy
