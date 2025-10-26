# Dfind — Team Finding Web Service
_teammates for sports • competitions • projects_

> 교내 팀원 모집/지원/수락을 한 곳에서 끝내는 경량 웹앱

---

## Features
- 🔎 검색/필터: 역할, 기술, 마감일
- ✅ 지원/수락: 원클릭 플로우
- 🔔 메일 인증/알림: 가입·지원·수락
- 🧭 간결 UI: 카드 리스트 + 상세

---

## Tech Stack
**Backend**: Flask, Flask-Login, Flask-Mail, Flask-SQLAlchemy  
**Utils**: email-validator, itsdangerous, python-dotenv  
**Frontend**: Jinja2, Tailwind CSS(CDN), Lucide Icons  
**DB**: SQLite(dev) → PostgreSQL(prod)

---

## struct

## 📁 Project Structure

```plaintext
D.Find/
├── static/
│   ├── css/
│   │   ├── style.css
│   │   └── message.css
│   │
│   ├── js/
│   │   └── main.js
│   │
│   ├── profiles/          # your profile image will be saved at here!
│   ├── uploads/           # uploaded images will be saved at here!
│   ├── default-avatar.png
│   └── logo.svg
│
├── templates/
│       ├── index.html
│       └── message.html
│
├── app.py
├── .env
├── seed_database.py
└── requirements.txt
