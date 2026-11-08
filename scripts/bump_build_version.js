import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.resolve(__dirname, '../package.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

// 1. Tính ngày hiện tại theo múi giờ Việt Nam (YYYYMMDD, VD: 20261108)
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).formatToParts(new Date());

const year = parts.find((p) => p.type === 'year')?.value || '2026';
const month = parts.find((p) => p.type === 'month')?.value || '11';
const day = parts.find((p) => p.type === 'day')?.value || '08';
const todayKey = `${year}${month}${day}`;

// 2. Tăng tự động Version patch: 1.2.0 -> 1.2.1 -> 1.2.2
const currentVersion = pkg.version || '1.2.0';
const vParts = currentVersion.split('.').map((n) => parseInt(n, 10) || 0);
while (vParts.length < 3) vParts.push(0);
vParts[2] += 1;
const nextVersion = `${vParts[0]}.${vParts[1]}.${vParts[2]}`;

// 3. Tăng thứ tự bản build trong ngày: 01, 02, 03... -> 2026110801v
const prevMeta = pkg.buildMeta || {};
const nextDailySeq =
  prevMeta.date === todayKey && typeof prevMeta.dailySeq === 'number'
    ? prevMeta.dailySeq + 1
    : 1;

const seqStr = String(nextDailySeq).padStart(2, '0');
const buildId = `${todayKey}${seqStr}v`;

pkg.version = nextVersion;
pkg.buildMeta = {
  date: todayKey,
  dailySeq: nextDailySeq,
  buildId,
  updatedAt: new Date().toISOString(),
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
console.log(`✅ [BUILD VERSION BUMP] Version ${nextVersion} • build ${buildId}`);

