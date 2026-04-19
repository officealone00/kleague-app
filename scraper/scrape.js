/**
 * K리그1 데이터 크롤러 v2
 *
 * 데이터 소스: 다음스포츠
 * - 순위: https://sports.daum.net/record/kl/team
 * - 개인 순위: https://sports.daum.net/record/kl/person
 * - 경기: https://sports.daum.net/schedule/kl
 *
 * ✅ 개선사항 (KBO 앱 경험 반영)
 * - 인코딩 대응 (UTF-8 + 폴백 EUC-KR)
 * - 다단계 파싱 (여러 JSON 패턴 시도)
 * - 경기 데이터 구조화 (home/away/homeScore/awayScore)
 * - 크롤러 실패 시 기존 데이터 보존 (덮어쓰지 않음)
 *
 * GitHub Actions로 매시간 실행 → data/*.json 자동 커밋
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import iconv from 'iconv-lite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── 인코딩 대응 fetch ───
async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Referer': 'https://sports.daum.net/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);

  const contentType = res.headers.get('content-type') || '';
  const buffer = await res.arrayBuffer();

  // 다음스포츠는 UTF-8, 한국 레거시 사이트는 EUC-KR 대비
  const isEucKr =
    /euc-kr/i.test(contentType) ||
    (!/utf-?8/i.test(contentType) && /\.co\.kr|\.or\.kr/.test(url) && !url.includes('daum.net'));

  if (isEucKr) {
    return iconv.decode(Buffer.from(buffer), 'euc-kr');
  }
  return Buffer.from(buffer).toString('utf-8');
}

// ─── K리그 팀명 정규화 ───
const TEAM_NAME_MAP = {
  '전북 현대 모터스': '전북',
  '전북 현대': '전북',
  '전북': '전북',
  '울산 HD FC': '울산',
  '울산 HD': '울산',
  '울산 현대': '울산',
  '울산': '울산',
  '포항 스틸러스': '포항',
  '포항': '포항',
  'FC 서울': '서울',
  'FC서울': '서울',
  '서울': '서울',
  '대전 하나 시티즌': '대전',
  '대전 하나시티즌': '대전',
  '대전 시티즌': '대전',
  '대전': '대전',
  '제주 SK FC': '제주',
  '제주 SK': '제주',
  '제주 유나이티드': '제주',
  '제주': '제주',
  '김천 상무 FC': '김천',
  '김천 상무': '김천',
  '김천': '김천',
  '강원 FC': '강원',
  '강원': '강원',
  '광주 FC': '광주',
  '광주': '광주',
  '인천 유나이티드 FC': '인천',
  '인천 유나이티드': '인천',
  '인천': '인천',
  'FC 안양': '안양',
  'FC안양': '안양',
  '안양': '안양',
  '부천 FC 1995': '부천',
  '부천 FC': '부천',
  '부천': '부천',
};

function normalizeTeam(name) {
  if (!name) return name;
  const trimmed = String(name).trim().replace(/\s+/g, ' ');
  if (TEAM_NAME_MAP[trimmed]) return TEAM_NAME_MAP[trimmed];
  for (const [key, val] of Object.entries(TEAM_NAME_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return val;
  }
  return trimmed.split(' ')[0];
}

// ─── 기존 파일 보존 유틸 ───
function safeWriteJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  📄 data/${filename} 저장 완료`);
}

function keepExisting(filename, reason) {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    console.warn(`  ⚠️  ${filename} 크롤링 실패 (${reason}) - 기존 데이터 유지`);
  } else {
    console.warn(`  ❌ ${filename} 크롤링 실패 (${reason}) - 기존 데이터도 없음`);
  }
}

// ─── 순위표 ───
async function scrapeStandings() {
  try {
    const html = await fetchText('https://sports.daum.net/record/kl/team');

    const patterns = [
      /__RAW_DATA__\s*=\s*(\[[\s\S]*?\])\s*[;<]/,
      /teamRankList["\s:]+(\[[\s\S]*?\])/,
      /"rankList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
    ];

    let data = null;
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) {
        try {
          data = JSON.parse(m[1]);
          if (Array.isArray(data) && data.length > 0) break;
        } catch {}
      }
    }

    if (!data || !Array.isArray(data) || !data.length) {
      throw new Error('JSON not found');
    }

    return data.map((item, i) => ({
      rank: Number(item.rank || i + 1),
      team: normalizeTeam(item.teamName || item.name),
      games: Number(item.gameCount || item.games || 0),
      wins: Number(item.winCount || item.wins || 0),
      draws: Number(item.drawCount || item.draws || 0),
      losses: Number(item.loseCount || item.losses || 0),
      points: Number(item.point || item.points || 0),
      goalsFor: Number(item.goalFor || item.goals || 0),
      goalsAgainst: Number(item.goalAgainst || 0),
      goalDiff: Number(item.goalDiff || 0),
      last5: item.recentResult || '-',
      home: item.homeRecord || '-',
      away: item.awayRecord || '-',
    }));
  } catch (e) {
    console.warn('[standings]', e.message);
    return null;
  }
}

// ─── 득점왕/도움왕 ───
async function scrapePlayerRanking(type = 'goal') {
  try {
    const url = `https://sports.daum.net/record/kl/person?rankType=${type}`;
    const html = await fetchText(url);

    const patterns = [
      /__RAW_DATA__\s*=\s*(\[[\s\S]*?\])\s*[;<]/,
      /personRankList["\s:]+(\[[\s\S]*?\])/,
      /"rankList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
    ];

    let data = null;
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) {
        try {
          data = JSON.parse(m[1]);
          if (Array.isArray(data) && data.length > 0) break;
        } catch {}
      }
    }

    if (!data || !Array.isArray(data)) return null;

    return data.slice(0, 30).map((item, i) => ({
      rank: Number(item.rank || i + 1),
      name: item.personName || item.name || '',
      team: normalizeTeam(item.teamName || ''),
      games: Number(item.gameCount || 0),
      goals: Number(item.goalCount || item.goals || 0),
      assists: Number(item.assistCount || item.assists || 0),
      shoots: Number(item.shootCount || 0),
      attackPoint: Number(item.attackPoint || 0),
      position: item.position || '',
    }));
  } catch (e) {
    console.warn(`[player ${type}]`, e.message);
    return null;
  }
}

// ─── 경기 ───
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function scrapeGamesByDate(dateStr) {
  try {
    const url = `https://sports.daum.net/schedule/kl?date=${dateStr}`;
    const html = await fetchText(url);

    const patterns = [
      /__RAW_DATA__\s*=\s*(\[[\s\S]*?\])\s*[;<]/,
      /scheduleList["\s:]+(\[[\s\S]*?\])/,
      /"gameList"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
    ];

    let data = null;
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) {
        try {
          data = JSON.parse(m[1]);
          if (Array.isArray(data) && data.length > 0) break;
        } catch {}
      }
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map(g => ({
      home: normalizeTeam(g.homeTeamName || g.home?.name),
      away: normalizeTeam(g.awayTeamName || g.away?.name),
      homeScore: g.homeScore ?? g.home?.score ?? null,
      awayScore: g.awayScore ?? g.away?.score ?? null,
      status: g.stateName || g.status || '예정',
      time: g.gameTime || g.startTime || '',
      stadium: g.stadium || g.venueName || '',
    })).filter(g => g.home && g.away);
  } catch (e) {
    console.warn(`[games ${dateStr}]`, e.message);
    return [];
  }
}

async function scrapeGames() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [todayGames, yestGames] = await Promise.all([
    scrapeGamesByDate(fmtDate(today)),
    scrapeGamesByDate(fmtDate(yesterday)),
  ]);

  return {
    today: { date: fmtDate(today), games: todayGames },
    yesterday: { date: fmtDate(yesterday), games: yestGames },
  };
}

// ─── 메인 ───
async function main() {
  console.log('⚽ K리그1 데이터 크롤링 시작');
  console.log(`⏰ ${new Date().toISOString()}\n`);

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const results = { success: 0, total: 4 };
  const errors = [];

  // 1) 순위
  const standings = await scrapeStandings();
  if (standings && standings.length) {
    safeWriteJson('standings.json', standings);
    console.log(`✅ 순위: ${standings.length}개 팀`);
    results.success++;
  } else {
    keepExisting('standings.json', 'crawler failed');
    errors.push('standings');
  }

  // 2) 득점왕
  const goals = await scrapePlayerRanking('goal');
  if (goals && goals.length) {
    safeWriteJson('goals.json', goals);
    console.log(`✅ 득점왕: ${goals.length}명`);
    results.success++;
  } else {
    keepExisting('goals.json', 'crawler failed');
    errors.push('goals');
  }

  // 3) 도움왕
  const assists = await scrapePlayerRanking('assist');
  if (assists && assists.length) {
    safeWriteJson('assists.json', assists);
    console.log(`✅ 도움왕: ${assists.length}명`);
    results.success++;
  } else {
    keepExisting('assists.json', 'crawler failed');
    errors.push('assists');
  }

  // 4) 경기
  const games = await scrapeGames();
  const gc = games.today.games.length + games.yesterday.games.length;
  if (gc > 0) {
    safeWriteJson('games.json', games);
    console.log(`✅ 경기: 오늘 ${games.today.games.length}건, 어제 ${games.yesterday.games.length}건`);
    results.success++;
  } else {
    keepExisting('games.json', 'no games found');
    errors.push('games');
  }

  // 메타
  const now = new Date();
  const meta = {
    updatedAt: now.toISOString(),
    updatedAtKST: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    season: now.getFullYear(),
    success: results.success,
    total: results.total,
    errors,
    league: 'K리그1',
  };
  safeWriteJson('meta.json', meta);

  console.log(`\n${results.success === results.total ? '✅' : '⚠️'} 완료: ${results.success}/${results.total} 성공`);
  if (errors.length) {
    console.warn('실패 항목:', errors.join(', '));
  }
}

main().catch(err => {
  console.error('💥 치명적 에러:', err);
  process.exit(1);
});
