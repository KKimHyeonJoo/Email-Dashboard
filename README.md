# 📧 AI 메일 요약보드 (AI Email Summary Board)

AI가 요약해 준 이메일들을 한눈에 확인하고, 팀원들과 메모를 남기며 관리할 수 있는 React 기반의 웹 대시보드입니다. **n8n** 워크플로우와 연동하여 자동화된 데이터베이스를 손쉽게 제어할 수 있습니다.
<img width="1262" height="794" alt="image" src="https://github.com/user-attachments/assets/0e496849-ae00-4ff3-8d78-3643e2097cca" />

## ✨ 주요 기능 (Features)

* **메일 요약 조회**: AI가 분류한 카테고리, 중요도(⭐), 제목, 요약 내용을 깔끔한 테이블 형태로 제공합니다.
* **실시간 검색 필터링**: 제목, 내용, 카테고리 기반으로 원하는 메일을 빠르게 검색할 수 있습니다.
* **내용 수정 및 삭제**: 메일의 제목과 요약 내용을 직접 수정하거나 불필요한 데이터를 삭제할 수 있습니다.
* **팀 메모 / 댓글 시스템**: 개별 메일마다 팀원들과 공유할 수 있는 메모(댓글)를 남기고 삭제할 수 있습니다.
* **다크 모드 지원**: 사용자의 눈 피로를 덜어주는 라이트/다크 모드 테마 토글을 지원합니다.
* **반응형 모달 UI**: 스크롤이 가능한 넓은 모달창을 통해 긴 요약 내용도 편안하게 읽을 수 있습니다.

## 🛠 기술 스택 (Tech Stack)

* **Frontend**: React, Vite, Axios
* **Backend / Automation**: n8n (Webhook API)
* **Deployment**: Vercel

## 🚀 시작하기 (Getting Started)

### 1. 프로젝트 클론 및 패키지 설치
\`\`\`bash
git clone https://github.com/본인아이디/ai-email-board.git
cd ai-email-board
npm install
\`\`\`

### 2. 환경 변수 설정
프로젝트 최상단 폴더에 `.env` 파일을 생성하고, 본인의 n8n 웹훅 기본 주소를 입력합니다.
\`\`\`env
# .env 파일
VITE_N8N_URL=https://n8n-주소.com/webhook
\`\`\`

### 3. 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`
브라우저에서 `http://localhost:5173`으로 접속하여 확인합니다.

## 🔗 n8n API 연동 규격
이 프론트엔드는 다음의 3가지 n8n Webhook 엔드포인트와 통신합니다. n8n 워크플로우 구성 시 아래 URL 경로를 참고해 주세요.

* `GET` **/select-email** : 전체 이메일 목록을 가져옵니다.
* `POST` **/update-email** : 이메일 내용 수정 및 댓글 추가/삭제 시 데이터를 업데이트합니다. (전체 객체 전송)
* `DELETE` **/delete-email?id={id}** : 특정 이메일을 삭제합니다.

> **⚠️ CORS 주의사항:**
> Vercel 등으로 배포한 후에는 반드시 n8n의 각 Webhook 노드 설정(Options -> CORS)에서 `Allowed Origins`에 프론트엔드 도메인(예: `https://my-board.vercel.app`)을 추가해야 정상적으로 통신이 가능합니다.

## 📦 배포 (Deployment)
이 프로젝트는 **Vercel**을 통한 배포에 최적화되어 있습니다.
1. GitHub에 코드를 푸시합니다.
2. Vercel에서 새 프로젝트를 생성하고 GitHub 리포지토리를 연결합니다.
3. Vercel의 `Environment Variables` 설정에 `VITE_N8N_URL` 값을 등록합니다.
4. Deploy 버튼을 눌러 배포를 완료합니다.
