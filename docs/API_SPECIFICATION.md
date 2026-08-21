# 🔌 เอกสารอ้างอิง API (API Specification)
## ระบบจองและจัดการสนามกีฬา (Sport Complex Booking System)

เอกสารฉบับนี้อธิบายรายละเอียดของ RESTful API ที่พัฒนาด้วย Node.js & Express.js สำหรับเชื่อมต่อระหว่างหน้าบ้าน (Frontend) และหลังบ้าน (Backend)

---

## 🌐 1. ข้อมูลพื้นฐานของ API (General Information)

* **Base URL**: `http://localhost:5000/api`
* **Swagger UI Documentation**: `http://localhost:5000/api-docs`
* **Data Format**: `application/json` (ยกเว้นการอัปโหลดสลิปที่ใช้ `multipart/form-data`)
* **Authentication Method**: `Bearer Token` ผ่าน HTTP Header `Authorization`

```text
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 🔐 2. ระบบยืนยันตัวตน (Authentication Endpoints)

### 2.1 สมัครสมาชิก (Register)
* **HTTP Method**: `POST`
* **URL**: `/api/auth/register`
* **Access Level**: Public (ทุกคนใช้งานได้)
* **Request Body**:
  ```json
  {
    "username": "customertest",
    "email": "customertest@example.com",
    "password": "Customer1234"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "message": "สมัครสมาชิกสำเร็จแล้ว!"
  }
  ```

### 2.2 เข้าสู่ระบบ (Login)
* **HTTP Method**: `POST`
* **URL**: `/api/auth/login`
* **Access Level**: Public
* **Request Body**:
  ```json
  {
    "username": "customer",
    "password": "customer1234"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "เข้าสู่ระบบสำเร็จ!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "username": "customer",
      "email": "customer@sportcomplex.com",
      "role": "customer"
    }
  }
  ```

### 2.3 ดึงข้อมูลผู้ใช้ปัจจุบัน (Get Current User)
* **HTTP Method**: `GET`
* **URL**: `/api/auth/me`
* **Access Level**: Authenticated User (ต้องแนบ Token)
* **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": 2,
      "username": "customer",
      "email": "customer@sportcomplex.com",
      "role": "customer",
      "created_at": "2026-08-18T10:00:00.000Z"
    }
  }
  ```

---

## 🏟️ 3. ระบบประเภทกีฬาและสนาม (Sports & Courts Endpoints)

### 3.1 ดึงประเภทกีฬาทั้งหมด (Get Sports)
* **HTTP Method**: `GET`
* **URL**: `/api/sports`
* **Access Level**: Public
* **Response (200 OK)**:
  ```json
  [
    { "id": 1, "name": "ฟุตบอล", "image_url": null },
    { "id": 2, "name": "บาสเกตบอล", "image_url": null },
    { "id": 3, "name": "แบดมินตัน", "image_url": null },
    { "id": 4, "name": "วอลเลย์บอล", "image_url": null }
  ]
  ```

### 3.2 ดึงรายการสนามทั้งหมด (Get Courts)
* **HTTP Method**: `GET`
* **URL**: `/api/courts`
* **Query Parameters**: `sport_id` (optional - เช่น `/api/courts?sport_id=1`)
* **Access Level**: Public
* **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "sport_id": 1,
      "name": "สนามฟุตบอล A",
      "description": "สนามหญ้าเทียมพรีเมียม",
      "price_per_hour": "600.00",
      "status": "active",
      "image_url": "https://example.com/court_a.jpg"
    }
  ]
  ```

### 3.3 เพิ่มสนามใหม่ (Create Court)
* **HTTP Method**: `POST`
* **URL**: `/api/courts`
* **Access Level**: Admin Only
* **Request Body**:
  ```json
  {
    "sport_id": 1,
    "name": "สนามฟุตบอล C",
    "description": "สนามกลางแจ้ง ขนาดมาตรฐาน",
    "price_per_hour": 550.00,
    "image_url": "https://example.com/court_c.jpg"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "message": "เพิ่มสนามใหม่สำเร็จ!",
    "courtId": 9
  }
  ```

### 3.4 แก้ไขข้อมูลสนาม (Update Court)
* **HTTP Method**: `PUT`
* **URL**: `/api/courts/:id`
* **Access Level**: Admin Only
* **Request Body**:
  ```json
  {
    "status": "maintenance"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "อัปเดตข้อมูลสนามเรียบร้อยแล้ว!"
  }
  ```

---

## 🎟️ 4. ระบบการจองสนาม (Booking Endpoints)

### 4.1 ตรวจสอบตารางความว่างรายชั่วโมง (Check Slot Availability)
* **HTTP Method**: `GET`
* **URL**: `/api/bookings/availability`
* **Query Parameters**: `court_id` (required), `date` (YYYY-MM-DD required)
* **Response (200 OK)**:
  ```json
  {
    "court_status": "active",
    "slots": [
      {
        "label": "10.00-11.00",
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "status": "available"
      },
      {
        "label": "11.00-12.00",
        "start_time": "11:00:00",
        "end_time": "12:00:00",
        "status": "unavailable"
      }
    ]
  }
  ```

### 4.2 สร้างรายการจองสนามใหม่ (Create Booking)
* **HTTP Method**: `POST`
* **URL**: `/api/bookings`
* **Access Level**: Authenticated User
* **Request Body**:
  ```json
  {
    "court_id": 1,
    "booking_date": "2026-09-01",
    "start_time": "14:00:00",
    "end_time": "16:00:00",
    "contact_phone": "0812345678"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "message": "สร้างการจองสำเร็จ! กรุณาโอนเงินเพื่อยืนยันภายใน 15 นาที",
    "bookingId": 45,
    "total_price": 1200.00
  }
  ```

### 4.3 ดึงรายการประวัติการจองของตนเอง (Get My Bookings)
* **HTTP Method**: `GET`
* **URL**: `/api/bookings/my-bookings`
* **Access Level**: Authenticated User
* **Response (200 OK)**:
  ```json
  {
    "bookings": [
      {
        "id": 45,
        "court_name": "สนามฟุตบอล A",
        "sport_name": "ฟุตบอล",
        "booking_date": "2026-09-01",
        "start_time": "14:00:00",
        "end_time": "16:00:00",
        "total_price": "1200.00",
        "status": "pending_payment",
        "created_at": "2026-08-21T10:00:00.000Z"
      }
    ],
    "server_time": "2026-08-21T10:02:00.000Z"
  }
  ```

### 4.4 ยกเลิกรายการจอง (Cancel Booking)
* **HTTP Method**: `PUT`
* **URL**: `/api/bookings/:id/cancel`
* **Access Level**: Owner (ถ้าสถานะ pending_payment) หรือ Admin
* **Response (200 OK)**:
  ```json
  {
    "message": "ยกเลิกรายการจองสำเร็จแล้ว คืนสิทธิ์สนามว่างเรียบร้อย"
  }
  ```

### 4.5 แอดมินอนุมัติรับเงินสดหน้าร้าน (Approve Cash Booking)
* **HTTP Method**: `PUT`
* **URL**: `/api/bookings/:id/approve-cash`
* **Access Level**: Admin Only
* **Response (200 OK)**:
  ```json
  {
    "message": "บันทึกรับเงินสดและอนุมัติการจองเรียบร้อยแล้ว",
    "booking": { ... }
  }
  ```

---

## 💳 5. ระบบการชำระเงินและตรวจสลิป (Payment Endpoints)

### 5.1 อัปโหลดสลิปและสแกนตรวจสลิปอัตโนมัติ (Upload & Scan Slip)
* **HTTP Method**: `POST`
* **URL**: `/api/payments/upload`
* **Access Level**: Authenticated Owner Only
* **Content-Type**: `multipart/form-data`
* **Form Data Fields**:
  * `booking_id`: `45` (integer)
  * `slip`: `[Binary Image File <= 5MB (JPG, PNG)]`
* **Response (200 OK)**:
  ```json
  {
    "message": "ชำระเงินสำเร็จเรียบร้อยแล้ว! ระบบอนุมัติการจองของท่านอัตโนมัติ"
  }
  ```
* **Error Response Example (400 Bad Request)**:
  ```json
  {
    "message": "ยอดเงินในสลิปไม่ตรงกับยอดจอง หากท่านโอนเงินแล้ว กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ"
  }
  ```

### 5.2 ดึงข้อมูลบัญชีพร้อมเพย์ (Get Payment Config)
* **HTTP Method**: `GET`
* **URL**: `/api/payments/config`
* **Access Level**: Authenticated User
* **Response (200 OK)**:
  ```json
  {
    "promptpayId": "0902214698",
    "promptpayName": "ณรงฤทธิ์ โจทจันทร์"
  }
  ```
