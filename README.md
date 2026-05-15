# K리그 순위 (앱인토스 미니앱) — v2.0

K리그1 **팀 순위 · 득점 · 도움 · 경기 일정**을 매일 자동 갱신해서 보여주는 앱인토스 미니앱.

## v2.0 변경 요약 (2026.5.15)

### 데이터 (스크래퍼)
- **2026 K리그1 12팀 화이트리스트 갱신**
  - 추가: 인천 유나이티드(K18), 부천 FC 1995(K26) — 2025 K2 우승/2위 승격
  - 제외: 대구(K17), 수원FC(K29) — 강등
- **일정(Schedule) 스크래퍼 신설** — `getKickOffEvent.do` 등 4개 엔드포인트 순차 시도 + 응답 구조 유연 파싱. 실패해도 standings/scorers/assists는 정상 갱신.
- 옛 cheerio 기반 HTML 파서 폐기 (페이지가 client-side rendering이라 빈 결과만 나옴) → 순수 fetch + JSON only

### 앱 (UI)
- **일정 탭 추가** — 다음 경기/전회 결과 (네이버 일정 카드 스타일)
- **전면광고 완전 제거** — `InterstitialAd.tsx`, `GlobalClickTracker`, `interstitialCount` 전부 삭제
- **광고 정책 정리**
  - 배너 광고: 각 페이지 하단에 1개씩만
  - 리워드 광고: `TeamReportPage` (상세 분석 리포트) 진입 시 1회만
- 시드 데이터(`fallback.ts`)도 2026.5.14 네이버 카드 기준 실데이터로 교체

## 폴더 구조

```
kleague-app/
├── app/                      # React + Vite + 앱인토스 SDK
│   ├── src/
│   │   ├── App.tsx           # 라우터 + 뒤로가기 (전면광고 제거됨)
│   │   ├── pages/
│   │   │   ├── StandingsPage.tsx   # 순위 (배너 1개 하단)
│   │   │   ├── ScorersPage.tsx     # 득점
│   │   │   ├── AssistsPage.tsx     # 도움
│   │   │   ├── SchedulePage.tsx    # 🆕 일정 (다음경기/전회결과)
│   │   │   └── TeamReportPage.tsx  # 상세 리포트 (리워드 광고)
│   │   ├── components/
│   │   │   ├── BottomNav.tsx       # 🆕 4탭 (순위/득점/도움/일정)
│   │   │   ├── PlayerListPage.tsx  # 득점/도움 공통
│   │   │   ├── BannerAd.tsx
│   │   │   ├── RewardedAd.tsx      # TeamReport 전용
│   │   │   ├── FavoriteTeamModal.tsx
│   │   │   ├── TeamLogo.tsx
│   │   │   └── TeamBadge.tsx
│   │   ├── data/teams.ts           # 🔄 인천·부천 추가
│   │   └── utils/
│   │       ├── api.ts              # 🆕 api.schedule() 추가
│   │       ├── fallback.ts         # 🔄 2026.5.14 실데이터 시드
│   │       └── storage.ts          # 🔄 interstitial 카운터 제거
│   ├── granite.config.ts
│   └── package.json
├── data/                     # 크롤러가 채우는 JSON (jsdelivr로 앱이 fetch)
│   ├── standings.json
│   ├── scorers.json
│   ├── assists.json
│   ├── schedule.json         # 🆕
│   └── meta.json
├── scraper/
│   ├── scrape.js             # 🔄 v2.0 (인천·부천 + 일정 엔드포인트 시도)
│   └── package.json          # cheerio 의존 제거
└── .github/workflows/
    └── scrape-kleague.yml    # 매일 KST 01:00 자동 실행
```

## 로컬 실행

### 앱 (UI 미리보기)
```bash
cd app
npm install
npm run dev
```

`http://localhost:5173` 접속.

### 스크래퍼 (테스트)
```bash
cd scraper
npm install
npm start
```

성공하면 `../data/*.json` 갱신됨. 일정 엔드포인트는 K리그 사이트 변경에 따라 시도 결과가 다를 수 있으니 로그 확인 권장.

## 출시 체크리스트 (앱인토스 심사)

- [x] `IS_AD_PRODUCTION = true` (BannerAd, RewardedAd)
- [x] 실제 광고 ID 적용 (배너: `ait.v2.live.340b27317f094704`)
- [x] 전면광고 완전 제거 (요청사항)
- [x] 리워드 광고는 상세 리포트에만 (요청사항)
- [x] 자체 뒤로가기 시 `navigationBar`에 `withBackButton: false` 필요한지 점검
- [x] `MemoryRouter` 적용
- [x] API 실패 시 폴백 데이터 + 친절한 에러 UI
- [x] 번들에 초기 JSON 포함 (`utils/fallback.ts`)
- [ ] `granite.config.ts`: K리그 전용 아이콘 URL 교체
- [ ] 콘솔 영문 앱명 'K League Standings'로 정정 (이전 'Kleagueranking')

## 일정 스크래퍼 동작 안 할 때

K리그 공식 사이트의 일정 API 경로가 바뀌었을 가능성이 있어요. 그때는:

1. GitHub Actions 로그에서 `→ 시도: ...` 출력 확인
2. 4개 후보 모두 실패라면 → 브라우저 DevTools(F12) → Network 탭 열고 `https://www.kleague.com/schedule.do?leagueId=1` 직접 접속해서 실제 호출되는 XHR/Fetch URL 찾기
3. 그 경로를 `scraper/scrape.js`의 `candidates` 배열에 추가

standings/scorers/assists는 영향 없이 갱신됨.
