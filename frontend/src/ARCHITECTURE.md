# 쿠킹 어시스턴트 프로젝트 아키텍처

## 개요
쿠킹 어시스턴트는 AI 기반 요리 보조 웹 애플리케이션으로, 1인 가구와 요리 초보자를 위한 맞춤형 레시피 추천 및 실시간 음성 가이드를 제공합니다.

## 기술 스택

### Frontend
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS v4.0
- **UI Components**: shadcn/ui
- **Icons**: lucide-react
- **State Management**: React Hooks (useState, useEffect)
- **Auth**: Supabase Auth

### Backend
- **Runtime**: Deno
- **Framework**: Hono
- **Database**: Supabase (Key-Value Store)
- **Auth**: Supabase Auth
- **Deployment**: Supabase Edge Functions

## 프로젝트 구조

```
/
├── components/          # React 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   ├── Auth.tsx        # 인증 컴포넌트
│   ├── HomePage.tsx    # 홈 페이지
│   ├── MyPage.tsx      # 마이페이지
│   ├── ProfileSetup.tsx           # 요리 프로필 설정
│   ├── AccountSettings.tsx        # 개인정보 설정
│   ├── IngredientsManagement.tsx  # 식재료 관리
│   ├── RecipeListPage.tsx         # 레시피 목록
│   ├── SavedPage.tsx              # 저장된 레시피
│   ├── VoiceAssistant.tsx         # AI 음성 보조
│   ├── TopNavBar.tsx              # 상단 네비게이션
│   └── BottomNavBar.tsx           # 하단 네비게이션
│
├── utils/              # 유틸리티 함수
│   ├── api.ts          # API 클라이언트 (공통 인스턴스)
│   └── supabase/       # Supabase 설정
│       ├── client.ts   # 클라이언트 초기화
│       └── info.tsx    # 프로젝트 정보
│
├── supabase/           # 백엔드 코드
│   └── functions/
│       └── server/
│           ├── index.tsx      # 메인 서버 (라우터 등록)
│           ├── routes.tsx     # 라우트 모듈 (분리된 라우터)
│           └── kv_store.tsx   # KV Store 유틸리티 (보호됨)
│
├── styles/             # 글로벌 스타일
│   └── globals.css     # Tailwind 설정 및 커스텀 토큰
│
├── App.tsx             # 메인 앱 컴포넌트 (라우팅 로직)
└── ARCHITECTURE.md     # 본 문서
```

## 아키텍처 개선 사항

### 1. 프론트엔드 API 분리

**문제점**:
- 각 페이지에서 개별적으로 API 호출
- 토큰 관리 및 에러 처리의 일관성 부족

**해결책**:
```typescript
// utils/api.ts
- 공통 API 인스턴스 생성
- Authorization 헤더 자동 추가
- 에러 처리 통합
- 인증 토큰 관리 중앙화

// 모든 컴포넌트에서 import
import { getIngredients, addIngredient } from './utils/api';
```

### 2. 네비게이션 구조 개선

**변경 전**:
```
하단 네비게이션: 홈 | 레시피 | AI | 저장 | 마이페이지
```

**변경 후**:
```
하단 네비게이션: 홈 | 레시피 | AI | 식재료 | 마이페이지
```

**주요 변경**:
- "저장" 탭 → "식재료" 탭으로 변경
- 식재료 관리를 메인 네비게이션에 배치
- 저장된 레시피는 마이페이지 메뉴로 이동

**라우팅 로직**:
```typescript
// App.tsx에서 조건부 렌더링 사용
const getActiveBottomTab = () => {
  switch (currentStep) {
    case "home": return "home";
    case "recipe-list": return "recipe";
    case "voice-assistant": return "ai";
    case "ingredients-management": return "ingredients";
    case "mypage": return "mypage";
    // ...
  }
};
```

**장점**:
- /login, /register 등에서 네비게이션 자동 숨김
- 인증 상태에 따른 조건부 렌더링
- 단순하고 명확한 상태 관리

### 3. 백엔드 라우터 모듈화

**변경 전**:
```typescript
// index.tsx에 모든 라우트 정의
app.post('/make-server-50b891bd/signup', ...)
app.get('/make-server-50b891bd/profile', ...)
app.post('/make-server-50b891bd/ingredients', ...)
// ... 300+ 줄
```

**변경 후**:
```typescript
// index.tsx (메인 라우터)
app.route('/make-server-50b891bd', authRoutes());
app.route('/make-server-50b891bd/profile', profileRoutes());
app.route('/make-server-50b891bd/ingredients', ingredientsRoutes());
app.route('/make-server-50b891bd/saved-recipes', savedRecipesRoutes());

// routes.tsx (모듈화된 라우터)
export function authRoutes() { ... }
export function profileRoutes() { ... }
export function ingredientsRoutes() { ... }
export function savedRecipesRoutes() { ... }
```

**장점**:
- 코드 가독성 향상
- 유지보수 용이
- 각 모듈의 책임 명확화
- 테스트 및 디버깅 용이

### 4. 마이페이지 데이터 분리

**구조**:
```typescript
// MyPage.tsx
- 사용자 프로필 표시
- 활동 통계 (완료한 요리, 좋아요, 저장, 레벨)
- 설정 메뉴:
  1. 개인정보 설정 (AccountSettings.tsx)
     - 이름 수정
     - 비밀번호 변경
     - 계정 삭제
  
  2. 요리 프로필 설정 (ProfileSetup.tsx)
     - 요리 수준
     - 음식 선호도
     - 알러지 정보
     - 싫어하는 재료
     - 조리 도구
     - 식단 제한
     - 건강 상태
     - 식단 목표
  
  3. 저장된 레시피 (SavedPage.tsx)
     - 저장한 레시피 목록
```

**역할 분리**:
- **MyPage**: 통계 및 네비게이션 중심
- **AccountSettings**: 계정 정보 전담
- **ProfileSetup**: 요리 프로필 전담

## API 엔드포인트

### 인증
- `POST /signup` - 회원가입

### 프로필
- `GET /profile` - 프로필 조회
- `PUT /profile` - 프로필 업데이트

### 식재료
- `GET /ingredients` - 식재료 목록 조회
- `POST /ingredients` - 식재료 추가
- `PUT /ingredients/:id` - 식재료 수정
- `DELETE /ingredients/:id` - 식재료 삭제

### 저장된 레시피
- `GET /saved-recipes` - 저장된 레시피 조회
- `POST /saved-recipes` - 레시피 저장
- `DELETE /saved-recipes/:id` - 저장된 레시피 삭제

### 헬스체크
- `GET /health` - 서버 상태 확인

## 인증 플로우

```
1. 사용자 회원가입/로그인
   ↓
2. Supabase Auth에서 access_token 발급
   ↓
3. Frontend: sessionStorage에 토큰 저장
   ↓
4. API 요청 시 Authorization 헤더에 토큰 자동 포함
   ↓
5. Backend: verifyUser()로 토큰 검증
   ↓
6. 검증 성공 시 요청 처리
```

## 데이터베이스 구조 (Key-Value Store)

```
users:{userId}:profile
- id
- email
- name
- createdAt
- updatedAt

users:{userId}:ingredients
- Array of ingredients
  - id
  - name
  - category
  - quantity
  - unit
  - expiryDate
  - createdAt
  - updatedAt

users:{userId}:saved_recipes
- Array of recipes
  - id
  - title
  - description
  - ingredients
  - steps
  - savedAt
```

## 상태 관리

### App Level State
```typescript
- currentStep: AppStep          // 현재 페이지 상태
- isAuthenticated: boolean      // 인증 상태
- currentUser: User | null      // 현재 사용자
- userProfile: UserProfile | null
- cookingContext: CookingContext | null
- selectedRecipe: Recipe | null
- isDarkMode: boolean
```

### Session Storage
- `cooking_assistant_auth_token` - 인증 토큰
- `cooking_assistant_current_user` - 사용자 정보

### Local Storage
- `cooking_assistant_dark_mode` - 다크모드 설정

## 디자인 시스템

### 색상 팔레트
- **메인 컬러 1**: 세이지그린 (#A5B68D)
- **메인 컬러 2**: 테라코타 (#E07A5F)
- **보조 컬러 1**: 베이지 (#F2CC8F)
- **보조 컬러 2**: 아이보리 (#F4F1DE)
- **텍스트 컬러**: 다크 그레이 (#3A3A3A)

### 타이포그래피
- 글로벌 타이포그래피는 `styles/globals.css`에 정의
- 컴포넌트에서는 Tailwind 폰트 클래스 사용 자제
- 시스템 기본 스타일 우선 사용

## 보안 고려사항

1. **환경 변수 관리**
   - `SUPABASE_SERVICE_ROLE_KEY`는 백엔드에서만 사용
   - 프론트엔드에서는 절대 노출하지 않음

2. **인증 토큰**
   - Session Storage에 저장 (XSS 공격 대비)
   - 모든 보호된 API 요청에 필수

3. **사용자 검증**
   - 백엔드에서 모든 요청 검증
   - `verifyUser()` 함수로 통합 관리

## 향후 개선 방향

1. **AI 기능 강화**
   - Vision API 연동 (영수증 OCR)
   - Text API 연동 (레시피 추천)
   - 음성 인식 및 TTS

2. **성능 최적화**
   - React.memo 적용
   - 이미지 레이지 로딩
   - API 응답 캐싱

3. **테스트 추가**
   - 단위 테스트 (Jest)
   - 통합 테스트 (React Testing Library)
   - E2E 테스트 (Playwright)

4. **접근성 개선**
   - ARIA 레이블 추가
   - 키보드 네비게이션 개선
   - 스크린 리더 지원

5. **국제화**
   - i18n 설정
   - 다국어 지원

## 참고 자료

- [React Documentation](https://react.dev/)
- [Tailwind CSS v4.0](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Hono Framework](https://hono.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
