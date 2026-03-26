# 📧 AI 메일 요약보드 (AI Email Summary Board)

AI가 이메일을 자동으로 요약·분류하고, 이를 한눈에 관리할 수 있는 **React 기반 웹 대시보드**입니다.

**n8n 워크플로우 + MySQL 데이터베이스**를 활용하여 이메일 데이터를 자동 수집·가공·저장하며, **Vercel**을 통해 배포되었습니다.

👉 [https://email-dashboard-bay.vercel.app/](https://email-dashboard-bay.vercel.app/)

<img width="1262" height="794" alt="image" src="https://github.com/user-attachments/assets/0e496849-ae00-4ff3-8d78-3643e2097cca" />

---

## ✨ 주요 기능 (Features)

### 📬 이메일 요약 관리

* AI가 이메일을 자동으로 요약 및 카테고리 분류
* 중요도(⭐) 기반으로 빠르게 우선순위 파악 가능
* 깔끔한 테이블 UI로 전체 메일 목록 확인

### 🔍 검색 및 필터링

* 제목 / 내용 / 카테고리 기반 실시간 검색
* 필요한 이메일을 빠르게 탐색 가능

### ✏️ 데이터 수정 및 삭제

* 제목 및 요약 내용 직접 수정 가능
* 불필요한 이메일 데이터 삭제 지원

### 💬 팀 협업 (댓글 시스템)

* 각 이메일별 메모(댓글) 작성 및 삭제
* 팀원 간 정보 공유 및 커뮤니케이션 가능

---

## 🛠 기술 스택 (Tech Stack)

### Frontend : **React**, **Vite**, **Axios**

### Backend / Automation : **n8n** (Webhook 기반 API 서버 + 자동화 워크플로우)

### Database : **MySQL** (이메일 및 댓글 데이터 저장)

### Deployment : **Vercel** (Frontend 배포)

---

## 🏗 시스템 아키텍처 (Architecture)

```text
Gmail → n8n → AI 요약(Gemini/OpenAI) → MySQL 저장
                                 ↓
                            Webhook API
                                 ↓
                           React (Vercel)
```

### 데이터 흐름

1. Gmail에서 이메일 수신
2. n8n이 트리거되어 이메일 데이터 수집
3. AI(Gemini/OpenAI)를 통해 요약 및 구조화(JSON)
4. MySQL DB에 저장
5. React 프론트엔드에서 n8n Webhook API 호출로 데이터 조회/수정/삭제

---

## 🚀 시작하기 (Getting Started)

### 1. 프로젝트 클론 및 설치

```bash
git clone https://github.com/본인아이디/ai-email-board.git
cd ai-email-board
npm install
```

---

### 2. 환경 변수 설정

`.env` 파일 생성 후 n8n Webhook 주소 입력

```env
VITE_N8N_URL=https://n8n-주소.com/webhook
```

---

### 3. 개발 서버 실행

```bash
npm run dev
```

👉 [http://localhost:5173](http://localhost:5173) 접속

---

## 🔗 n8n API 연동 규격

React 앱은 n8n Webhook을 API처럼 사용합니다.

| Method | Endpoint                | 설명                |
| ------ | ----------------------- | ----------------- |
| GET    | `/select-email`         | 전체 이메일 목록 조회      |
| POST   | `/update-email`         | 이메일 수정 및 댓글 추가/삭제 |
| DELETE | `/delete-email?id={id}` | 특정 이메일 삭제         |

---

## 🗄 MySQL 데이터 구조 (예시)

```sql
CREATE TABLE emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  category VARCHAR(50),
  priority VARCHAR(10),
  sender_name VARCHAR(100),
  sender_email VARCHAR(255),
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email_id INT,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
