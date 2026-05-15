// scraper/scrape.js
// K리그 공식 사이트에서 데이터를 받아 data/*.json에 저장
//
// 데이터 소스: https://www.kleague.com
//   - POST /record/teamRank.do   (팀 순위)
//   - POST /record/rankSort.do   (선수 기록 - 득점/도움)
//   - POST /getKickOffEvent.do  (일정 - 여러 엔드포인트 시도)
//
// 실행:
//   cd scraper && npm install && npm start
//
// 결과: ../data/standings.json, scorers.json, assists.json, schedule.json, meta.json
//
// 2026 시즌 K리그1 12팀 화이트리스트:
//   서울 K09, 울산 K01, 전북 K05, 포항 K03, 강원 K21, 인천 K18,
//   제주 K04, 안양 K27, 대전 K10, 김천 K35, 부천 K26, 광주 K22
//   (대구 K17, 수원FC K29는 K2 강등)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const BASE = 'https://www.kleague.com';
const SEASON = new Date().getFullYear(); // 자동 (2026)
const LEAGUE_ID = 1; // K리그1

// ── 2026 K리그1 12팀 화이트리스트 ──
const K1_TEAM_IDS = new Set([
  'K01', // 울산
  'K03', // 포항
  'K04', // 제주
  'K05', // 전북
  'K09', // 서울
  'K10', // 대전
  'K18', // 인천 (2026 승격)
  'K21', // 강원
  'K22', // 광주
  'K26', // 부천 (2026 승격)
  'K27', // 안양
  'K35', // 김천
]);

// teamId → 짧은 팀명 매핑 (K리그 전체)
const TEAM_ID_TO_NAME = {
  K01: '울산',
  K02: '수원',
  K03: '포항',
  K04: '제주',
  K05: '전북',
  K06: '부산',
  K07: '전남',
  K08: '성남',
  K09: '서울',
  K10: '대전',
  K17: '대구',
  K18: '인천',
  K20: '경남',
  K21: '강원',
  K22: '광주',
  K26: '부천',
  K27: '안양',
  K29: '수원FC',
  K31: '서울E',
  K32: '안산',
  K34: '충남아산',
  K35: '김천',
  K36: '김포',
  K37: '충북청주',
  K38: '천안',
  K39: '화성',
  K40: '파주',
  K41: '김해',
  K42: '용인',
};

const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'X-Requested-With': 'XMLHttpRequest',
  Referer: `${BASE}/record/team.do`,
  Origin: BASE,
};

// ─── 공통: 재시도 + 타임아웃 ──────────────
async function fetchWithRetry(url, options, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      console.warn(`  시도 ${i + 1} 실패: ${e.message}`);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

// ─── 1. 팀 순위 ──────────────
async function scrapeStandings() {
  console.log('📊 팀 순위 크롤링 시작...');
  const params = new URLSearchParams({
    leagueId: String(LEAGUE_ID),
    year: String(SEASON),
    stadium: 'all',
    recordType: 'rank',
  });
  const res = await fetchWithRetry(
    `${BASE}/record/teamRank.do?${params.toString()}`,
    {
      method: 'POST',
      headers: COMMON_HEADERS,
    }
  );
  const json = await res.json();
  const list = json?.data?.teamRank;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('teamRank 응답이 비어있거나 형식이 다름');
  }

  const standings = list
    .filter((row) => K1_TEAM_IDS.has(row.teamId))
    .sort((a, b) => a.rank - b.rank)
    .map((row) => ({
      rank: row.rank,
      team: TEAM_ID_TO_NAME[row.teamId] || row.teamName?.replace(/\s/g, '') || '?',
      teamId: row.teamId,
      games: row.gameCount ?? 0,
      wins: row.winCnt ?? 0,
      draws: row.tieCnt ?? 0,
      losses: row.lossCnt ?? 0,
      points: row.gainPoint ?? 0,
      goalsFor: row.gainGoal ?? 0,
      goalsAgainst: row.lossGoal ?? 0,
      goalDiff: row.gapCnt ?? 0,
      last5: [row.game01, row.game02, row.game03, row.game04, row.game05]
        .filter((g) => g)
        .map((g) => (g === 'W' ? '승' : g === 'L' ? '패' : g === 'D' ? '무' : g))
        .join(''),
    }));

  if (standings.length === 0) {
    throw new Error('K리그1 팀이 화이트리스트와 매칭 안 됨');
  }
  if (standings.length < 10) {
    console.warn(`  ⚠️ 팀이 ${standings.length}개만 매칭됨 (예상 12개)`);
  }
  console.log(`  ✅ ${standings.length}팀 (1위: ${standings[0].team} ${standings[0].points}점)`);
  return standings;
}

// ─── 2. 선수 기록 (득점/도움 공통) ──────────────
async function scrapePlayerRank(recordType) {
  console.log(`⚽ 선수 기록 크롤링: ${recordType}...`);
  const body = JSON.stringify({
    year: SEASON,
    leagueId: LEAGUE_ID,
    recordType,
  });
  const res = await fetchWithRetry(`${BASE}/record/rankSort.do`, {
    method: 'POST',
    headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
    body,
  });
  const json = await res.json();
  const list = json?.data?.list;
  if (!Array.isArray(list)) {
    throw new Error(`rankSort(${recordType}) 응답 list 없음`);
  }

  const filtered = list.filter((p) => K1_TEAM_IDS.has(p.teamId));
  const players = filtered.map((p, idx) => ({
    rank: idx + 1,
    name: p.name,
    team: TEAM_ID_TO_NAME[p.teamId] || p.teamName?.replace(/\s/g, '') || '?',
    teamId: p.teamId,
    playerId: p.playerId,
    goals: p.goalQty ?? 0,
    assists: p.assistQty ?? 0,
    attackPoints: p.apQty ?? 0,
    games: p.gameQty ?? 0,
    shots: p.stQty ?? 0,
    perGame: typeof p.qtyPerGame === 'number' ? Math.round(p.qtyPerGame * 100) / 100 : 0,
  }));

  const key = recordType === 'GOAL' ? 'goals' : 'assists';
  const nonZero = players.filter((p) => p[key] > 0);

  console.log(
    `  ✅ ${nonZero.length}명 (1위: ${nonZero[0]?.name || '?'}(${nonZero[0]?.team || '?'}) ${
      nonZero[0]?.[key] || 0
    })`
  );
  return nonZero;
}

// ─── 3. 일정 (전회 결과 + 다음 일정) ──────────────
// K리그 사이트는 schedule.do 페이지에서 AJAX로 일정을 받아옴.
// 알려진 엔드포인트가 자주 바뀌므로 여러 경로를 순서대로 시도하고
// 응답 구조도 유연하게 파싱한다.
async function scrapeSchedule() {
  console.log('🗓️  일정 크롤링 시작...');

  const headers = { ...COMMON_HEADERS, 'Content-Type': 'application/json; charset=utf-8' };

  // 시도할 엔드포인트들. ✅ getScheduleList.do는 DevTools로 확정.
  // body 형식은 확실하지 않아서 4가지 패턴 순서대로 시도.

  const candidates = [
    // ✅ 2026.5.15 DevTools에서 확정된 엔드포인트
    {
      name: 'getScheduleList.do (JSON body)',
      url: `${BASE}/getScheduleList.do`,
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json; charset=utf-8', Referer: `${BASE}/schedule.do?leagueId=${LEAGUE_ID}` },
      body: JSON.stringify({ leagueId: LEAGUE_ID, year: SEASON }),
    },
    {
      name: 'getScheduleList.do (form-urlencoded)',
      url: `${BASE}/getScheduleList.do`,
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', Referer: `${BASE}/schedule.do?leagueId=${LEAGUE_ID}` },
      body: `leagueId=${LEAGUE_ID}&year=${SEASON}`,
    },
    {
      name: 'getScheduleList.do (no body)',
      url: `${BASE}/getScheduleList.do?leagueId=${LEAGUE_ID}&year=${SEASON}`,
      method: 'POST',
      headers: { ...COMMON_HEADERS, Referer: `${BASE}/schedule.do?leagueId=${LEAGUE_ID}` },
    },
    {
      name: 'getScheduleList.do (with month)',
      url: `${BASE}/getScheduleList.do`,
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json; charset=utf-8', Referer: `${BASE}/schedule.do?leagueId=${LEAGUE_ID}` },
      body: JSON.stringify({ leagueId: LEAGUE_ID, year: SEASON, month: '' }),
    },
  ];

  let rawList = null;
  let usedEndpoint = null;

  for (const c of candidates) {
    try {
      console.log(`  → 시도: ${c.name}`);
      const res = await fetch(c.url, {
        method: c.method,
        headers: c.headers || headers,
        body: c.body,
      });
      if (!res.ok) {
        console.log(`    HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      // 응답이 비어있으면 다음 후보 시도
      if (!text || text.trim() === '') {
        console.log('    빈 응답');
        continue;
      }
      const json = (() => {
        try { return JSON.parse(text); } catch { return null; }
      })();
      if (!json) {
        console.log(`    JSON 파싱 실패 (앞 100자: ${text.slice(0, 100)})`);
        continue;
      }
      // 응답 구조 유연 파싱 (getScheduleList.do 응답 키 후보 확장)
      const arr =
        json?.data?.scheduleList ||
        json?.data?.gameList ||
        json?.data?.kickoffEvents ||
        json?.data?.events ||
        json?.data?.list ||
        json?.data?.schedule ||
        (Array.isArray(json?.data) ? json.data : null) ||
        json?.scheduleList ||
        json?.gameList ||
        json?.kickoffEvents ||
        json?.events ||
        (Array.isArray(json) ? json : null);
      if (Array.isArray(arr) && arr.length > 0) {
        rawList = arr;
        usedEndpoint = c.name;
        console.log(`    ✅ ${arr.length}건 발견`);
        // 첫 항목 구조를 한 번 출력 (정규화 디버그)
        console.log(`    샘플 키: ${Object.keys(arr[0]).slice(0, 15).join(', ')}`);
        break;
      } else {
        // 배열이 비었거나 못 찾음 — 진단용 응답 구조 출력
        const topKeys = Object.keys(json).slice(0, 10);
        const dataKeys = json?.data ? Object.keys(json.data).slice(0, 10) : null;
        console.log(`    배열 비어있음. top keys: [${topKeys.join(',')}]${dataKeys ? `, data keys: [${dataKeys.join(',')}]` : ''}`);
      }
    } catch (e) {
      console.log(`    에러: ${e.message}`);
    }
  }

  if (!rawList) {
    console.warn('  ⚠️ 모든 일정 엔드포인트 실패 - 빈 배열 반환');
    return { recent: [], upcoming: [], usedEndpoint: null };
  }

  // 정규화: 각 응답마다 필드명이 다를 수 있음
  const normalize = (item) => {
    const meetDate =
      item.meetDate || item.matchDate || item.gameDate || item.kickoffDate || '';
    const meetTime =
      item.meetTime || item.matchTime || item.gameTime || item.kickoffTime || '';

    // home/away teamId
    const homeId =
      item.homeTeamId || item.homeId || item.home?.teamId || item.team1Id || null;
    const awayId =
      item.awayTeamId || item.awayId || item.away?.teamId || item.team2Id || null;

    // 팀 이름 (응답에 있으면 그대로, 없으면 매핑)
    const homeName =
      (homeId && TEAM_ID_TO_NAME[homeId]) ||
      item.homeTeamName ||
      item.home?.teamName ||
      item.homeName ||
      '?';
    const awayName =
      (awayId && TEAM_ID_TO_NAME[awayId]) ||
      item.awayTeamName ||
      item.away?.teamName ||
      item.awayName ||
      '?';

    // 점수
    const homeScore =
      item.homeGoal ?? item.homeScore ?? item.home?.score ?? null;
    const awayScore =
      item.awayGoal ?? item.awayScore ?? item.away?.score ?? null;

    // 경기장
    const stadium =
      item.fieldName || item.stadium || item.stadiumName || item.venue || '';

    // 상태: 점수가 있으면 종료, 없으면 예정
    const hasScore =
      homeScore !== null && awayScore !== null && homeScore !== '' && awayScore !== '';
    const status = hasScore ? 'finished' : 'scheduled';

    // 날짜 정규화: 'YYYYMMDD' 또는 'YYYY-MM-DD' 또는 'YYYY.MM.DD' 모두 처리
    let dateStr = '';
    const dRaw = String(meetDate).trim();
    if (/^\d{8}$/.test(dRaw)) {
      dateStr = `${dRaw.slice(0, 4)}.${dRaw.slice(4, 6)}.${dRaw.slice(6, 8)}`;
    } else if (/^\d{4}[-.]\d{2}[-.]\d{2}$/.test(dRaw)) {
      dateStr = dRaw.replace(/-/g, '.');
    } else {
      dateStr = dRaw;
    }

    // 시간 정규화: '1630' or '16:30'
    let timeStr = '';
    const tRaw = String(meetTime).trim();
    if (/^\d{4}$/.test(tRaw)) {
      timeStr = `${tRaw.slice(0, 2)}:${tRaw.slice(2, 4)}`;
    } else {
      timeStr = tRaw;
    }

    return {
      date: dateStr,
      time: timeStr,
      homeId,
      awayId,
      home: homeName,
      away: awayName,
      homeScore: hasScore ? Number(homeScore) : null,
      awayScore: hasScore ? Number(awayScore) : null,
      stadium,
      status,
    };
  };

  const games = rawList
    .map(normalize)
    // K1 팀끼리의 경기만
    .filter(
      (g) =>
        (g.homeId && K1_TEAM_IDS.has(g.homeId)) ||
        (g.awayId && K1_TEAM_IDS.has(g.awayId))
    )
    // 날짜 정렬
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // 최근 종료 경기 (지난 10경기)
  const recent = games
    .filter((g) => g.status === 'finished')
    .slice(-10)
    .reverse();

  // 다가오는 경기 (앞으로 10경기)
  const upcoming = games.filter((g) => g.status === 'scheduled').slice(0, 10);

  console.log(`  ✅ 최근 ${recent.length}경기, 예정 ${upcoming.length}경기 (엔드포인트: ${usedEndpoint})`);
  return { recent, upcoming, usedEndpoint };
}

// ─── 메인 ──────────────
async function main() {
  console.log(`\n=== K리그${LEAGUE_ID} 크롤러 v2.0 (${SEASON}시즌) ===\n`);

  const results = {};
  const errors = [];

  try {
    results.standings = await scrapeStandings();
  } catch (e) {
    errors.push({ task: 'standings', error: e.message });
    console.error('  ❌ standings 실패:', e.message);
  }

  try {
    results.scorers = await scrapePlayerRank('GOAL');
  } catch (e) {
    errors.push({ task: 'scorers', error: e.message });
    console.error('  ❌ scorers 실패:', e.message);
  }

  try {
    results.assists = await scrapePlayerRank('ASSIST');
  } catch (e) {
    errors.push({ task: 'assists', error: e.message });
    console.error('  ❌ assists 실패:', e.message);
  }

  try {
    const sched = await scrapeSchedule();
    results.schedule = sched;
  } catch (e) {
    errors.push({ task: 'schedule', error: e.message });
    console.error('  ❌ schedule 실패:', e.message);
    results.schedule = { recent: [], upcoming: [], usedEndpoint: null };
  }

  // ─── 파일 저장 ─────
  console.log('\n💾 파일 저장 중...');
  await fs.mkdir(DATA_DIR, { recursive: true });

  if (results.standings) {
    await fs.writeFile(
      path.join(DATA_DIR, 'standings.json'),
      JSON.stringify(results.standings, null, 2),
      'utf8'
    );
  }
  if (results.scorers) {
    await fs.writeFile(
      path.join(DATA_DIR, 'scorers.json'),
      JSON.stringify(results.scorers, null, 2),
      'utf8'
    );
  }
  if (results.assists) {
    await fs.writeFile(
      path.join(DATA_DIR, 'assists.json'),
      JSON.stringify(results.assists, null, 2),
      'utf8'
    );
  }
  if (results.schedule) {
    // schedule.json 에는 recent/upcoming만 저장 (usedEndpoint는 meta로 빠짐)
    const { usedEndpoint, ...schedToSave } = results.schedule;
    await fs.writeFile(
      path.join(DATA_DIR, 'schedule.json'),
      JSON.stringify(schedToSave, null, 2),
      'utf8'
    );
  }

  const nowUTC = new Date();
  const nowKST = new Date(nowUTC.getTime() + 9 * 60 * 60 * 1000);
  const totalTasks = 4;
  const meta = {
    updatedAt: nowUTC.toISOString(),
    updatedAtKST: nowKST.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    season: SEASON,
    leagueId: LEAGUE_ID,
    version: '2.0',
    success: totalTasks - errors.length,
    total: totalTasks,
    errors,
    scheduleEndpoint: results.schedule?.usedEndpoint || null,
  };
  await fs.writeFile(
    path.join(DATA_DIR, 'meta.json'),
    JSON.stringify(meta, null, 2),
    'utf8'
  );

  console.log('\n=== 완료 ===');
  console.log(`성공: ${meta.success}/${totalTasks}`);
  if (errors.length > 0) {
    console.log('실패:', errors);
    // standings/scorers/assists 중 하나라도 실패하면 1로 종료
    // schedule만 실패하면 0으로 종료 (앱은 그래도 동작)
    const criticalFail = errors.some((e) =>
      ['standings', 'scorers', 'assists'].includes(e.task)
    );
    if (criticalFail) process.exit(1);
  }
}

main().catch((e) => {
  console.error('💥 치명적 에러:', e);
  process.exit(1);
});
