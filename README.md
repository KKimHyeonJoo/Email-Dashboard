# 📧💼 AI 업무 자동화 대시보드 (AI Email & Job Dashboard)

AI가 이메일을 자동으로 요약·분류하고 핵심 채용공고를 수집·평가하여 한눈에 관리할 수 있는 **React 기반 올인원 웹 대시보드**입니다.

**n8n 워크플로우 + Python 크롤러 + RAG(Pinecone Vector DB) + MySQL**을 활용하여 방대한 데이터를 자동 수집 및 가공하며, 대시보드 내에서 AI 챗봇과 대화하며 데이터를 탐색할 수 있습니다. 프론트엔드는 **Vercel**을 통해 배포되었습니다.

👉 [https://email-dashboard-bay.vercel.app/](https://email-dashboard-bay.vercel.app/)

<img width="1861" height="869" alt="image" src="https://github.com/user-attachments/assets/bd24339d-65f8-4aed-8953-1282685c3b19" />
<img width="1539" height="550" alt="image" src="https://github.com/user-attachments/assets/20435b08-f3e8-4f40-9710-84126bb5e0d7" />

---

## ✨ 주요 기능 (Features)

### 📬 AI 이메일 카테고리별 맞춤 요약 및 관리
* AI(GPT-4o-mini)가 수신된 이메일을 자동으로 **3가지 카테고리**(답장필요 / 뉴스레터 / 기타)로 분류
* 카테고리별 맞춤 요약 형식 적용:
  * **답장필요**: ⏰ 마감 기한 + ✅ 해야 할 액션 + 💡 답장 핵심 포인트 구조화
  * **뉴스레터**: ① ② ③ 토픽별 핵심 내용 분리 요약 (수치·기술명 포함)
  * **기타**: 1~2문장 간결 요약
* 우선순위(High/Medium/Low) 자동 판별 및 AI 답장 초안(Draft Reply) 생성·발송

### 💼 AI 기반 채용공고 자동 수집 및 정량 평가
* Python(BeautifulSoup) 기반 **사람인(Saramin) 크롤러**로 AI/데이터 직군 공고 자동 수집
* LLM이 **5개 항목별 채점 기준표**로 정량 분석하여 TOP 3 맞춤 공고 추천:

| 항목 | 배점 | 기준 |
|------|------|------|
| 기술 스택 일치도 | 35점 | 공고 요구 키워드 vs 지원자 스택 1:1 대조 |
| 직무 역할 적합도 | 25점 | JD와 프로젝트 경험 연결도 |
| 성장 가능성 | 15점 | 커리어 방향 부합도 |
| 우대사항 보너스 | 15점 | 차별화 강점 매칭 항목 수 |
| 근무 조건 | 10점 | 정규직 여부, 경력 조건 등 |

* 추천 사유에 **매칭 키워드 + 근거 + 감점 요인**을 투명하게 명시

### 🤖 RAG 기반 AI 챗봇 어시스턴트
* **Gemini Embedding**(gemini-embedding-001, 3072차원) + **Pinecone Vector DB** + **GPT-4o-mini Agent** 구성
* 이메일 데이터를 자연어로 검색·탐색: "이번 주 뉴스레터 요약해줘", "면접 관련 메일 알려줘" 등
* Chat History Buffer 기반 대화 맥락 유지

### 🔍 탐색 및 협업 기능
* 제목 / 내용 / 카테고리 기반 실시간 검색
* 데이터(제목, 요약 내용) 직접 수정 및 불필요한 데이터 삭제 지원
* 각 데이터별 팀 협업용 메모(댓글) 시스템 지원
* 다크/라이트 테마 지원

---

## 🛠 기술 스택 (Tech Stack)

| 영역 | 기술 |
|------|------|
| **Frontend** | React (Vite), Axios, Vercel 배포 |
| **Backend / Automation** | n8n Workflow, Python (Requests, BeautifulSoup4) |
| **Database** | MySQL, Pinecone Vector DB |
| **AI / LLM** | OpenAI GPT-4o-mini, Google Gemini Embedding, RAG Pipeline |
| **Deployment** | Vercel (Frontend), n8n Cloud (Workflow) |

---

## ⚙️ 시스템 아키텍처 및 데이터 흐름

```text
[Gmail] ──────┐                         ┌─> [Pinecone Vector DB] (RAG용 인덱싱)
              │                         │     Gemini Embedding (3072dim)
[Saramin] ────┼──> [ n8n Workflow ] ────┼─> [MySQL DB] (데이터 저장)
(Python)      │     GPT-4o-mini         │
              │                         │
[사용자 입력] ──> [GPT-4o-mini Agent] ──┘
  (Chatbot)        Tool: email_vectorstore
                                        │
                                        ↓
                              [ React Dashboard (Vercel) ]
```

### 데이터 흐름

1. **이메일 수집**: Gmail 수신 → n8n Trigger → GPT-4o-mini 카테고리별 맞춤 요약 → MySQL 저장 + Pinecone 벡터 인덱싱
2. **채용공고 수집**: Python 크롤러(`saramin_crawler.py`) → n8n Webhook → GPT-4o-mini 5항목 정량 평가 → TOP 3 추천 → MySQL 저장
3. **RAG 챗봇**: 사용자 질문 → GPT-4o-mini Agent → email_vectorstore Tool 자율 호출 → Pinecone 검색 → 구조화된 답변 생성
4. **프론트엔드**: React 앱 → n8n Webhook API 7개 엔드포인트 호출 → 데이터 CRUD 및 챗봇 통신

---

## 🚀 시작하기 (Getting Started)

### 1. 프로젝트 클론 및 설치

```bash
git clone https://github.com/KKimHyeonJoo/Email-Dashboard.git
cd Email-Dashboard
npm install
```

### 2. 환경 변수 설정

최상위 경로에 `.env` 파일을 생성하고 n8n Webhook 기본 주소를 입력합니다.

```env
VITE_N8N_URL=https://your-n8n-url.com/webhook
```

### 3. 개발 서버 실행

```bash
npm run dev
```

👉 http://localhost:5173 접속

---

## 🔗 n8n API 연동 규격

React 앱은 n8n Webhook을 API 라우터처럼 사용합니다. (`App.jsx` 기준)

| Method | Endpoint | 설명 |
|--------|----------|------|
| **GET** | `/select-email` | 저장된 이메일 목록 전체 조회 |
| **GET** | `/get-jobs` | AI 추천 채용공고 목록 조회 |
| **POST** | `/chat` | RAG AI 챗봇 어시스턴트 메시지 송수신 |
| **POST** | `/send-reply` | 특정 이메일에 대한 AI 자동 답장 발송 |
| **POST** | `/job-crawler` | 채용공고 크롤링 수동 트리거 |
| **PATCH** | `/update-email` | 데이터(제목, 요약, 댓글 등) 내용 수정 |
| **DELETE** | `/delete-email` | 특정 데이터 삭제 |

---

## 🔧 트러블슈팅 (Trouble Shooting)

### 1. Vector DB에 데이터가 정상 저장되지 않는 문제

**문제**: MySQL INSERT 노드의 출력에 원본 데이터가 포함되지 않아, 다음 단계에서 빈 문자열로 임베딩됨. 또한 Pinecone 인덱스의 Integrated Embedding 모델과 n8n의 Gemini 임베딩 벡터가 충돌. Document Loader가 JSON을 줄 단위로 분할하여 단어 하나가 개별 벡터로 저장됨.

**해결**: Set 노드가 JS Clean JSON Output 노드를 직접 참조하도록 수정. Pinecone 인덱스를 Custom settings(Dimension: 3072, Metric: cosine)으로 재생성. Document Loader의 JSON Pointer를 `/pageContent`로 설정.

### 2. RAG 챗봇이 검색 결과를 활용하지 못하는 문제

**문제**: Agent의 Chat Model로 연결된 Gemini 모델이 Tool-calling을 불안정하게 처리하여, 검색 결과가 반환되어도 "찾을 수 없습니다"로 응답.

**해결**: Agent의 Chat Model을 GPT-4o-mini로 교체. 시스템 프롬프트에 pageContent 구조 해석 가이드와 응답 형식을 명시.

---
