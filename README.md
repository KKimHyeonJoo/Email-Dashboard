# 📧💼 AI 업무 자동화 대시보드 (AI Email & Job Dashboard)

AI가 이메일을 자동으로 요약·분류하고, 핵심 채용공고를 수집·평가하여 한눈에 관리할 수 있는 **React 기반 올인원 웹 대시보드**입니다.

**n8n 워크플로우**, **Python 크롤러**, **RAG(Pinecone Vector DB)**, **Aiven MySQL**을 결합하여 방대한 데이터를 자동으로 수집 및 가공합니다. 대시보드에 내장된 AI 챗봇과 대화하며 수집된 데이터를 탐색할 수도 있습니다.

👉 **Live Demo:** [https://email-dashboard-bay.vercel.app/](https://email-dashboard-bay.vercel.app/)

<img width="1861" height="869" alt="image" src="https://github.com/user-attachments/assets/bd24339d-65f8-4aed-8953-1282685c3b19" />
<img width="1539" height="550" alt="image" src="https://github.com/user-attachments/assets/20435b08-f3e8-4f40-9710-84126bb5e0d7" />

---

## ✨ 주요 기능 (Key Features)

### 📬 AI 이메일 카테고리별 맞춤 요약 및 관리
* **자동 분류:** GPT-4o-mini가 수신 이메일을 **답장필요 / 뉴스레터 / 기타** 3가지 카테고리로 자동 분류
* **카테고리별 맞춤 요약:**
  * **답장필요** — ⏰ 마감 기한 + ✅ 해야 할 액션 + 💡 답장 핵심 포인트 구조화
  * **뉴스레터** — ① ② ③ 토픽별 핵심 내용 분리 요약 (수치·기술명 포함)
  * **기타** — 1~2문장 간결 요약
* **스마트 답장:** 이메일 컨텍스트를 분석하여 AI가 답장 초안(Draft)을 자동 작성 및 발송
* **우선순위 판별:** High / Medium / Low 자동 분류, 다크/라이트 테마, 메모 시스템 지원

### 🎯 AI 기반 채용공고 수집 및 정량 평가
* **타겟팅 수집:** Python(BeautifulSoup) 크롤러가 'AI 개발자', 'AI 엔지니어', '데이터 엔지니어' 키워드 기반 정규직 공고를 사람인에서 스크래핑
* **중복 제거 및 핵심 필터링:** 수집 데이터 중 중복을 제거하고 직무 적합성이 높은 공고만 선별하여 n8n Webhook으로 일괄 전송
* **5항목 정량 채점:** GPT-4o-mini가 아래 기준표로 분석하여 TOP 3 맞춤 공고를 추천

| 항목 | 배점 | 기준 |
|------|------|------|
| 기술 스택 일치도 | 35점 | 공고 요구 키워드 vs 지원자 스택 1:1 대조 |
| 직무 역할 적합도 | 25점 | JD와 프로젝트 경험 연결도 |
| 성장 가능성 | 15점 | 커리어 방향 부합도 |
| 우대사항 보너스 | 15점 | 차별화 강점 매칭 항목 수 |
| 근무 조건 | 10점 | 정규직 여부, 경력 조건 등 |

* 추천 사유에 **매칭 키워드 + 근거 + 감점 요인**을 투명하게 명시

### 🤖 RAG 기반 AI 챗봇 어시스턴트
* **OpenAI Embedding**(text-embedding-3-small, 1536차원) + **Pinecone Vector DB** + **GPT-5-mini Agent** 구성
* 이메일 데이터를 자연어로 검색·탐색 가능 (예: "이번 주 뉴스레터 요약해줘", "면접 관련 메일 알려줘")
* Chat History Buffer 기반 대화 맥락 유지

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
* **React (Vite):** 컴포넌트 기반 UI, 다크/라이트 테마
* **Axios:** n8n Webhook API 통신
* **Vercel:** 프론트엔드 배포

### Backend & Automation
* **n8n:** API 라우팅, 데이터 파이프라인, AI Agent 워크플로우 자동화
* **Python (BeautifulSoup, Requests):** 사람인 채용공고 크롤링 및 필터링

### AI & Database
* **GPT-4o-mini:** 이메일 요약/분류, 채용공고 정량 평가
* **GPT-5-mini:** RAG 챗봇 Agent (Chat Model)
* **OpenAI Embedding (text-embedding-3-small):** 이메일 벡터 임베딩 (1536차원)
* **Pinecone Vector DB:** RAG 검색용 벡터 저장소 (AWS us-east-1, Dense, On-demand)
* **Aiven MySQL:** 이메일 및 채용공고 정형 데이터 저장

---

## ⚙️ 시스템 아키텍처 (Architecture)

```text
[Gmail] ───────> [ n8n AI Workflow ] ────┼─> [Aiven MySQL] (정형 데이터 저장)
                   GPT-4o-mini           │
[Saramin] ─────> [ Python 크롤러 ] ──────┼─> [Pinecone Vector DB] (RAG용 임베딩)
                                         │     OpenAI Embedding (1536dim)
[사용자 입력] ──> [ GPT-5-mini Agent ] ──┘
  (Chatbot)        Tool: email_vectorstore
                                         │
                                         ↓
                               [ React Dashboard (Vercel) ]
```

1. **이메일 수집:** Gmail 수신 → n8n Trigger → GPT-4o-mini 카테고리별 맞춤 요약 → Aiven MySQL 저장 + OpenAI Embedding → Pinecone 인덱싱
2. **채용공고 수집:** Python 크롤러 → n8n Webhook → GPT-4o-mini 5항목 정량 평가 → TOP 3 추천 → Aiven MySQL 저장
3. **RAG 챗봇:** 사용자 질문 → GPT-5-mini Agent가 email_vectorstore Tool 자율 호출 → Pinecone 검색 → 구조화된 답변 생성
4. **대시보드:** React 앱 → n8n Webhook API 7개 엔드포인트 호출 → 데이터 CRUD 및 챗봇 통신

---

## 🔗 n8n API 연동 규격

React 앱은 n8n Webhook을 API 라우터처럼 사용합니다. (`App.jsx` 기준)

| Method | Endpoint | 설명 |
|--------|----------|------|
| **GET** | `/select-email` | 저장된 이메일 목록 전체 조회 |
| **GET** | `/get-jobs` | AI 추천 채용공고 목록 조회 |
| **POST** | `/chat` | RAG AI 챗봇 메시지 송수신 |
| **POST** | `/send-reply` | 특정 이메일에 대한 AI 자동 답장 발송 |
| **POST** | `/job-crawler` | 채용공고 크롤링 수동 트리거 |
| **PATCH** | `/update-email` | 데이터(제목, 요약, 댓글 등) 수정 |
| **DELETE** | `/delete-email` | 특정 데이터 삭제 |

---

### n8n 워크플로우 상세

**이메일 API 서버 & 채용공고 API 서버**
<img width="1042" height="458" alt="image" src="https://github.com/user-attachments/assets/484585e6-7481-43b2-9c22-ed4735d6e8b6" />

**챗봇 (Load Email Data Flow & Retriever Flow)**
<img width="1484" height="374" alt="image" src="https://github.com/user-attachments/assets/9af005c1-7431-4109-9b69-941df0acbd82" />


---

## 🚀 시작하기 (Getting Started)

### 1. 프로젝트 클론 및 패키지 설치
```bash
git clone https://github.com/KKimHyeonJoo/Email-Dashboard.git
cd Email-Dashboard
npm install
```

### 2. 환경 변수 설정 (`.env`)
프로젝트 최상위 경로에 `.env` 파일을 생성하고 n8n Webhook Base URL을 입력합니다.
```env
VITE_N8N_URL=https://your-n8n-domain.com/webhook
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 에 접속하여 대시보드를 확인합니다.

---

## 📂 핵심 파일 설명

| 파일 | 설명 |
|------|------|
| `src/App.jsx` | 프론트엔드 메인 로직. 이메일 목록, 채용공고 탭, 챗봇 UI, 상태 관리 및 API 호출 |
| `saramin_crawler.py` | 사람인 채용공고 크롤링, 키워드 필터링, 중복 제거, n8n Webhook 일괄 전송 |
| `rag-workflow.json` | n8n 전체 워크플로우 설정 파일 (이메일 처리 + 채용공고 평가 + RAG 챗봇) |

---
