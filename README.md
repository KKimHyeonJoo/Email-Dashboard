# 📧💼 AI 업무 자동화 대시보드 (AI Email & Job Dashboard)

AI가 이메일을 자동으로 요약·분류하고 핵심 채용공고를 수집하여 한눈에 관리할 수 있는 **React 기반 올인원 웹 대시보드**입니다.

**n8n 워크플로우 + Python 크롤러 + RAG(Vector DB) + MySQL**을 활용하여 방대한 데이터를 자동 수집 및 가공하며, 대시보드 내에서 AI 챗봇과 대화하며 데이터를 탐색할 수 있습니다. 프론트엔드는 **Vercel**을 통해 배포되었습니다.

👉 [https://email-dashboard-bay.vercel.app/](https://email-dashboard-bay.vercel.app/)

<img width="1861" height="869" alt="image" src="https://github.com/user-attachments/assets/bd24339d-65f8-4aed-8953-1282685c3b19" />
<img width="1539" height="550" alt="image" src="https://github.com/user-attachments/assets/20435b08-f3e8-4f40-9710-84126bb5e0d7" />




---

## ✨ 주요 기능 (Features)

### 📬 AI 이메일 요약 및 관리
* AI(LLM)가 수신된 이메일을 자동으로 요약 및 카테고리 분류
* 중요도(⭐) 기반 우선순위 파악 및 깔끔한 테이블 UI 제공
* AI를 활용한 이메일 자동 답장 초안(Draft Reply) 생성 및 발송

### 💼 맞춤형 채용공고 자동 수집 (Job Crawler)
* 파이썬(BeautifulSoup) 기반 **사람인(Saramin) 크롤러** 연동
* 'AI 개발자', '데이터 엔지니어' 등 특정 키워드 및 정규직 조건 필터링
* 수집된 핵심 공고를 n8n Webhook을 통해 대시보드 DB로 자동 적재

### 🤖 RAG 기반 AI 챗봇 어시스턴트
* 대시보드 우측 하단 챗봇 UI를 통해 내 데이터와 대화 가능
* **Vector DB**와 **GPT-4o-mini**가 결합된 RAG 워크플로우를 통해 이메일 및 공고 내용 기반 맞춤형 답변 제공 (Chat History Memory 지원)

### 🔍 탐색 및 협업 기능
* 제목 / 내용 / 카테고리 기반 실시간 검색
* 데이터(제목, 요약 내용) 직접 수정 및 불필요한 데이터 삭제 지원
* 각 데이터별 팀 협업용 메모(댓글) 시스템 지원

---

## 🛠 기술 스택 (Tech Stack)

* **Frontend:** React (Vite), Axios, CSS Modules (Dark/Light Theme)
* **Backend / Automation:** n8n, Python (Requests, BeautifulSoup4)
* **Database:** MySQL, Vector DB
* **AI / LLM:** OpenAI (GPT-4o-mini), Gemini, RAG Workflow
* **Deployment:** Vercel

---

## ⚙️ 시스템 아키텍처 및 데이터 흐름

```text
[Gmail] ──────┐                         ┌─> [Vector DB] (RAG용 인덱싱)
              │                         │
[Saramin] ────┼──> [ n8n Workflow ] ────┼─> [MySQL DB] (데이터 저장)
(Python Script)                         │
                                        │
[사용자 입력] ──> [AI Agent/GPT-4o] ────┘
  (Chatbot)                             │
                                        ↓
                              [ React Dashboard ]
````

1.  **이메일 수집:** Gmail에서 이메일 수신 시 n8n 트리거 동작 → AI 요약 후 MySQL 및 Vector DB 저장
2.  **채용공고 수집:** 파이썬 크롤러(`saramin_crawler.py`)가 정기적으로 공고 스크래핑 후 n8n Webhook 호출
3.  **프론트엔드 제어:** React 앱에서 n8n Webhook API를 호출하여 데이터 조회/수정/삭제 및 챗봇(`Chat`) API 통신

-----

## 🚀 시작하기 (Getting Started)

### 1\. 프로젝트 클론 및 설치

```bash
git clone [https://github.com/본인아이디/ai-email-board.git](https://github.com/본인아이디/ai-email-board.git)
cd ai-email-board
npm install
```

### 2\. 환경 변수 설정

최상위 경로에 `.env` 파일을 생성하고 n8n Webhook 기본 주소를 입력합니다.

```env
VITE_N8N_URL=[https://n8n-주소.com/webhook](https://n8n-주소.com/webhook)
```

### 3\. 개발 서버 실행

```bash
npm run dev
```

👉 [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) 접속

-----

## 🔗 n8n API 연동 규격

React 앱은 n8n Webhook을 API 라우터처럼 사용합니다. (`App.jsx` 기준)

| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| **GET** | `/select-email` | 저장된 이메일 목록 전체 조회 |
| **GET** | `/get-jobs` | 수집된 채용공고 목록 조회 |
| **POST** | `/chat` | RAG AI 챗봇 어시스턴트 메시지 송수신 |
| **POST** | `/send-reply` | 특정 이메일에 대한 AI 자동 답장 발송 |
| **POST** | `/job-crawler` | 채용공고 크롤링 수동 트리거 |
| **PATCH** | `/update-email` | 데이터(제목, 요약, 댓글 등) 내용 수정 |
| **DELETE**| `/delete-email` | 특정 데이터 삭제 |

-----
