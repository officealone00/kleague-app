# ⚽ K리그 순위 앱

> 앱인토스용 K리그1 실시간 순위 · 득점왕 · 도움왕 · 경기 결과 앱

## 📱 앱 소개

K리그1 2026 시즌의 모든 데이터를 한 곳에서 확인할 수 있는 미니앱.

### 주요 기능

- 🏆 **실시간 순위**: K리그1 12개 팀의 승점, 득실, 최근 5경기
- ⚽ **득점왕 TOP 30**: 선수별 득점 순위
- 🎯 **도움왕 TOP 30**: 선수별 도움 순위
- 📅 **경기 일정/결과**: 오늘 & 어제 경기 한눈에
- ⭐ **응원팀 기능**: 즐겨찾기 팀 설정 + 상세 분석 리포트

### 심사 통과 포인트 (KBO 앱 경험 반영)

- ✅ MemoryRouter (뒤로가기 버튼 중복 방지)
- ✅ 최초화면 뒤로가기 = 앱 종료
- ✅ API 재시도 + 폴백 (3단계 안전망)
- ✅ 실제 광고 ID 적용
- ✅ 크롤러 인코딩 대응 (iconv-lite)
- ✅ 크롤러 실패 시 기존 데이터 보존
- ✅ `.granite/` gitignore 처리

## 🏗️ 구조

```
kleague-app/
├── .github/workflows/
│   └── scrape-kleague.yml     # 매시간 데이터 크롤링
├── scraper/
│   ├── scrape.js              # 데이터 크롤러 v2 (인코딩 대응)
│   └── package.json           # iconv-lite 의존성
├── data/                      # 크롤링된 JSON 데이터
│   ├── standings.json         # 팀 순위 (12팀)
│   ├── goals.json             # 득점왕 Top 30
│   ├── assists.json           # 도움왕 Top 30
│   ├── games.json             # 오늘/어제 경기
│   └── meta.json              # 업데이트 시각
├── docs/                      # GitHub Pages
│   ├── terms.html             # 서비스 이용약관
│   └── privacy.html           # 개인정보처리방침
└── app/                       # 앱인토스 프론트엔드
    ├── granite.config.ts      # 앱인토스 설정
    ├── package.json
    └── src/
        ├── App.tsx            # MemoryRouter + 뒤로가기 처리
        ├── pages/             # 4개 페이지
        ├── components/        # 공통 컴포넌트 (광고 등)
        ├── data/teams.ts      # K리그 12팀 정보
        └── utils/             # API, 폴백, 분석 로직
```

## 🚀 배포 가이드

### 1. GitHub Repo 만들기

```bash
# officealone00 계정에서 kleague-app repo 생성
# (Public, README 없이)

cd C:\Users\Lee\kleague-app
git init
git add .
git commit -m "Initial K리그 앱"
git branch -M main
git remote add origin https://github.com/officealone00/kleague-app.git
git push -u origin main
```

### 2. GitHub Pages 활성화

Repo → Settings → Pages
- Source: `main` branch, `/docs` folder
- `https://officealone00.github.io/kleague-app/terms.html` 접속 확인

### 3. GitHub Actions 활성화

자동으로 매시간 크롤링 실행됨. 첫 실행은 `Actions` 탭에서 수동 실행 가능.

### 4. 크롤러 테스트 (선택)

```bash
cd scraper
npm install
node scrape.js
```

### 5. 앱인토스 콘솔 등록

1. https://apps-in-toss.toss.im 접속
2. 새 앱 생성: "K리그 순위"
3. 광고 ID 3종 발급 (배너/전면/리워드)
4. 광고 ID를 코드에 반영:
   - `app/src/components/BannerAd.tsx`
   - `app/src/components/InterstitialAd.tsx`
   - `app/src/components/RewardedAd.tsx`
5. 빌드: `cd app && npm install && npm run build`
6. `deploymentId` 복사 → 콘솔 "앱 출시" → 버전 등록

## ⚠️ KBO 앱에서 배운 교훈 (이미 반영됨)

### 1. 크롤러 인코딩
- 한국 공공사이트는 EUC-KR인 경우 많음
- `iconv-lite`로 자동 감지 처리

### 2. jsdelivr CDN 캐시
- 데이터 업데이트 후 CDN이 오래된 버전 제공하기도 함
- 해결: `https://purge.jsdelivr.net/gh/{user}/{repo}@main/data/{file}.json` 열기

### 3. `.granite/` 빌드 캐시
- 앱인토스 빌드 시 생성되는 `.granite/` 폴더는 커밋하지 않음
- `.gitignore`에 미리 포함됨

### 4. api.ts CONFIG
- `githubUser`, `repo` 값이 실제 GitHub 정보와 일치해야 함
- 현재 값: `officealone00/kleague-app`

### 5. 크롤러 실패 시 동작
- 다음스포츠 API 변경에 대비
- 크롤링 실패 시 기존 `data/*.json`을 덮어쓰지 않음 (시드 데이터 보존)

## 📝 라이선스 / 데이터 출처

- 데이터: 다음스포츠 (sports.daum.net)
- 이 앱은 개인 학습/취미 목적으로 만든 비공식 서비스입니다
