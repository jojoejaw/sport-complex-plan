# 🛠️ คู่มือการติดตั้งระบบ (Installation Guide)
## ระบบจองและจัดการสนามกีฬา (Sport Complex Booking System)

คู่มือฉบับนี้อธิบายขั้นตอนการติดตั้ง การตั้งค่าสภาพแวดล้อม (Environment) การตั้งค่าฐานข้อมูล และการเริ่มรันระบบทั้งในส่วน **Backend** และ **Frontend**

---

## 📋 1. ข้อกำหนดขั้นต่ำของระบบ (System Requirements)

ก่อนเริ่มการติดตั้ง กรุณาตรวจสอบให้แน่ใจว่าเครื่องคอมพิวเตอร์ของคุณมีโปรแกรมดังต่อไปนี้ติดตั้งเรียบร้อยแล้ว:

* **Node.js**: เวอร์ชัน `v18.0.0` ขึ้นไป (แนะนำ `v20.x LTS`)
* **npm**: เวอร์ชัน `v9.0.0` ขึ้นไป
* **Database**: MySQL Server `v8.0+` หรือ MariaDB `v10.4+` (สามารถใช้ XAMPP / WampServer / MySQL Workbench ได้)
* **Git**: สำหรับใช้ดึงโค้ดโปรเจกต์
* **Web Browser**: Google Chrome, Microsoft Edge, Safari หรือ Firefox เวอร์ชันล่าสุด

---

## 🗄️ 2. การตั้งค่าฐานข้อมูล (Database Setup)

1. เปิดใช้งาน **MySQL Server** ผ่าน XAMPP Control Panel หรือบริการ MySQL บนเครื่องของคุณ
2. เข้าใช้งานระบบจัดการฐานข้อมูล (เช่น **phpMyAdmin** ที่ `http://localhost/phpmyadmin` หรือ **MySQL Workbench**)
3. สร้างฐานข้อมูลใหม่ชื่อ `sport_complex_db` กำหนด Collation เป็น `utf8mb4_unicode_ci`

```sql
CREATE DATABASE IF NOT EXISTS `sport_complex_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

4. นำเข้าไฟล์สคริปต์ฐานข้อมูล (Import SQL):
   * นำเข้าไฟล์ `sport_complex_db_complete.sql` ที่อยู่ที่โฟลเดอร์หลักของโปรเจกต์
   * สคริปต์นี้จะสร้างตาราง 5 ตารางหลัก (`users`, `sports`, `courts`, `bookings`, `payments`) พร้อมข้อมูลเริ่มต้นสำหรับการทดสอบ

---

## ⚙️ 3. การตั้งค่าและการรัน Backend (Express.js API)

1. เปิด Terminal / Command Prompt แล้วเข้าไปที่โฟลเดอร์ `backend`:

```bash
cd backend
```

2. ติดตั้งไลบรารีของ Node.js (Dependencies):

```bash
npm install
```

3. ตรวจสอบไฟล์การตั้งค่าสภาพแวดล้อม `.env` ที่อยู่ในโฟลเดอร์ `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=sport_complex_db
JWT_SECRET=sport_complex_secret_key_123456
THUNDER_API_KEY=1e142494-b9b9-4b65-b69d-66b06d5bb5bb
PROMPTPAY_ID=0902214698
PROMPTPAY_NAME=ณรงฤทธิ์ โจทจันทร์
```

> 📌 **คำอธิบายพารามิเตอร์ `.env`:**
> * `PORT`: พอร์ตการทำงานของเซิร์ฟเวอร์ Backend (ค่าเริ่มต้น `5000`)
> * `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: การเชื่อมต่อฐานข้อมูล MySQL
> * `JWT_SECRET`: คีย์ลับสำหรับเข้ารหัสความปลอดภัย JWT Token
> * `THUNDER_API_KEY`: API Key สำหรับบริการสแกนตรวจสอบสลิปโอนเงิน Thunder API
> * `PROMPTPAY_ID`, `PROMPTPAY_NAME`: หมายเลขและชื่อบัญชีพร้อมเพย์สำหรับแสดงฝั่งหน้าบ้าน

4. สั่งรัน Backend Server:

* **โหมดพัฒนา (Development Mode - Auto Reload):**
  ```bash
  npm run dev
  ```
* **โหมดปกติติดตั้งใช้งาน (Production Mode):**
  ```bash
  npm start
  ```

5. เมื่อเซิร์ฟเวอร์ทำงานสำเร็จ จะปรากฏข้อความบน Terminal:
   ```text
   🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต http://localhost:5000
   ✅ เชื่อมต่อ MySQL Database สำเร็จ!
   ```
6. สามารถเข้าดูเอกสาร API Specification สดได้ที่: `http://localhost:5000/api-docs`

---

## 💻 4. การตั้งค่าและการรัน Frontend (React + Vite)

1. เปิด Terminal อีกหน้าต่าง แล้วเข้าไปที่โฟลเดอร์ `frontend`:

```bash
cd frontend
```

2. ติดตั้งไลบรารีของ Frontend (Dependencies):

```bash
npm install
```

3. สั่งรัน Frontend Development Server:

```bash
npm run dev
```

4. เมื่อรันสำเร็จ Vite จะแสดง URL สำหรับเข้าใช้งานเว็บแอปพลิเคชัน (โดยปกติคือ `http://localhost:5173` หรือ `http://localhost:3000`):

```text
  VITE v8.x.x  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

5. เปิดเว็บเบราว์เซอร์แล้วเข้าไปที่ `http://localhost:5173` เพื่อเริ่มใช้งานระบบ

---

## 🔑 5. บัญชีผู้ใช้ทดสอบเริ่มต้น (Starter Credentials)

ระบบมีบัญชีทดสอบที่ถูกสร้างไว้ในสคริปต์ฐานข้อมูลดังนี้:

| บทบาท (Role) | ชื่อผู้ใช้ (Username) | รหัสผ่าน (Password) | อีเมล (Email) |
| :--- | :--- | :--- | :--- |
| **ผู้ดูแลระบบ (Admin)** | `admin` | `admin1234` | admin@sportcomplex.com |
| **ลูกค้า (Customer)** | `customer` | `customer1234` | customer@sportcomplex.com |

---

## 🛠️ 6. การทดสอบการสร้างไฟล์ Build สำหรับ Production

เมื่อต้องการนำเว็บฝั่งหน้าบ้านขึ้นใช้งานจริงบน Production Web Server:

```bash
cd frontend
npm run build
```

ไฟล์ HTML, JS และ CSS ที่ผ่านการบีบอัดจะถูกสร้างขึ้นในโฟลเดอร์ `frontend/dist` พร้อมสำหรับนำไป Deploy บน Web Hosting หรือ Nginx/Apache Server
