# ECO-DRIVE INSIGHT MVP

AI 기반 구간별 연비 최적화 진단 서비스의 과제 명세 대응 MVP 구현입니다.

## 구성
- `frontend/` : Next.js 대시보드 (로그인/주행목록/연비 차트)
- `backend/` : Node.js(Express) 메인 API (Auth, Drive CRUD, Admin)
- `ai_service/` : FastAPI AI 추론 서비스 (구간별 기여도 + 코칭)
- `backend/sql/init.sql` : PostgreSQL 스키마
- `docker-compose.yml` : 전체 서비스 실행

## 요구사항 대응 맵
- F-101 OAuth URL 제공: `GET /auth/hyundai/oauth/url`
- F-102/F-103 계정 생성 + bcrypt 해싱: `POST /auth/register`
- F-201 주행기록 수집: `POST /drives/ingest`
- F-202 주행목록 조회: `GET /drives`
- F-203 메모 수정: `PATCH /drives/:id/memo`
- F-204 기록 삭제: `DELETE /drives/:id`
- F-301/F-302/F-303 AI 분석: `POST /drives/:id/analyze` -> FastAPI `/infer`
- F-401 관리자 사용자/데이터 현황: `GET /admin/overview`
- F-402 모델 성능 대시보드 데이터: `GET /admin/model-performance`

## 실행 방법
```bash
docker compose up --build
```

접속:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000/health
- AI: http://localhost:8000/health

## 비고
- Hyundai OAuth 실제 토큰 교환/실차 API 연동은 샌드박스/실키 발급 후 확장 가능하도록 URL 발급 엔드포인트로 우선 구현했습니다.
- AI 서비스는 SHAP 설명 개념을 반영한 기여도(퍼센트) 구조를 반환하도록 설계했으며, MVP에서는 경량 회귀모델(GradientBoostingRegressor)로 동작합니다.
