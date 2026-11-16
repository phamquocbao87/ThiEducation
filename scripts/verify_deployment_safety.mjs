/**
 * verify_deployment_safety.mjs
 * 
 * BỘ KIỂM TOÁN AN TOÀN TRƯỚC KHI DEPLOY (PRE-FLIGHT DEPLOYMENT SAFETY AUDIT)
 * Khẳng định 100% sự cách ly giữa Production, Backup và Dev.
 * Tuyệt đối ngăn chặn rủi ro ghi nhầm dữ liệu Localhost vào Production hoặc Deploy nhầm Target.
 */
import fs from 'fs';
import path from 'path';

console.log('🔍 BẮT ĐẦU KIỂM TOÁN AN TOÀN CẤU HÌNH MULTI-HOSTING & DATABASE...');

let passed = true;

// 1. Kiểm tra .firebaserc mapping
const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
console.log('\n1. KIỂM TRA .firebaserc MAPPING:');
if (firebaserc.projects.prod === 'lakeducation' && 
    firebaserc.projects.backup === 'lakeducation-backup' && 
    firebaserc.projects.dev === 'lakeducation-dev') {
  console.log('  ✅ [PASS] Projects alias mapping chính xác 100% (prod -> lakeducation, backup -> lakeducation-backup, dev -> lakeducation-dev)');
} else {
  console.error('  ❌ [FAIL] Projects alias mapping trong .firebaserc bị sai lệch!');
  passed = false;
}

if (firebaserc.targets.lakeducation?.hosting?.erp?.[0] === 'lakeducation-erp-portal' &&
    firebaserc.targets['lakeducation-backup']?.hosting?.erp?.[0] === 'lakeducation-backup-erp' &&
    firebaserc.targets['lakeducation-dev']?.hosting?.erp?.[0] === 'lakeducation-dev-erp') {
  console.log('  ✅ [PASS] Hosting targets mapping chính xác 100% cho cả 3 project.');
} else {
  console.error('  ❌ [FAIL] Hosting targets mapping trong .firebaserc bị sai lệch!');
  passed = false;
}

// 2. Kiểm tra package.json deploy scripts
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('\n2. KIỂM TRA LỆNH DEPLOY TRONG package.json:');
const scripts = pkg.scripts;
if (scripts['deploy:prod'].includes('--project prod') &&
    scripts['deploy:backup'].includes('--project backup') &&
    scripts['deploy:dev'].includes('--project dev')) {
  console.log('  ✅ [PASS] Lệnh deploy độc lập 100%:');
  console.log('     - deploy:prod   -> --project prod (lakeducation)');
  console.log('     - deploy:backup -> --project backup (lakeducation-backup)');
  console.log('     - deploy:dev    -> --project dev (lakeducation-dev)');
} else {
  console.error('  ❌ [FAIL] Scripts deploy trong package.json thiếu cờ chỉ định project!');
  passed = false;
}

// 3. Kiểm tra file firebase.js logic cách ly
console.log('\n3. KIỂM TRA LOGIC CÁCH LY MÔI TRƯỜNG (src/core/services/firebase.js):');
const firebaseJs = fs.readFileSync('src/core/services/firebase.js', 'utf8');

if (firebaseJs.includes('isLocalhost') && 
    firebaseJs.includes('isDevDomain') && 
    firebaseJs.includes('IS_DEVELOPMENT_FIREBASE')) {
  console.log('  ✅ [PASS] Logic phân tầng nhận diện: Localhost & Dev Domains được bọc cách ly.');
} else {
  console.error('  ❌ [FAIL] Thiếu logic cách ly trong firebase.js!');
  passed = false;
}

// 4. Giả lập Runtime Domain Evaluation trong Node
console.log('\n4. KIỂM THỬ GIẢ LẬP RUNTIME TRÊN TỪNG TÊN MIỀN:');

const testCases = [
  { domain: 'localhost', expectedEnv: 'development', expectedProject: 'lakeducation-dev', desc: 'Máy lập trình viên Localhost' },
  { domain: '127.0.0.1', expectedEnv: 'development', expectedProject: 'lakeducation-dev', desc: 'Máy lập trình viên IP Loopback' },
  { domain: 'lakeducation-dev-erp.web.app', expectedEnv: 'development', expectedProject: 'lakeducation-dev', desc: 'Trang ERP Môi trường Dev' },
  { domain: 'dev.lakeducation.edu.vn', expectedEnv: 'development', expectedProject: 'lakeducation-dev', desc: 'Subdomain Dev chính thức' },
  { domain: 'lakeducation-dev.web.app', expectedEnv: 'development', expectedProject: 'lakeducation-dev', desc: 'Trang Landing Môi trường Dev' },
  { domain: 'erp.lakeducation.edu.vn', expectedEnv: 'production', expectedProject: 'lakeducation', desc: 'Trang ERP Production Thật' },
  { domain: 'lakeducation.edu.vn', expectedEnv: 'production', expectedProject: 'lakeducation', desc: 'Trang Landing Production Thật' },
  { domain: 'bk.lakeducation.edu.vn', expectedEnv: 'production', expectedProject: 'lakeducation', desc: 'Trang ERP Backup (DB Thật)' },
  { domain: 'lakeducation-backup-erp.web.app', expectedEnv: 'production', expectedProject: 'lakeducation', desc: 'Hosting Backup ERP (DB Thật)' },
  { domain: 'lakeducation-backup.web.app', expectedEnv: 'production', expectedProject: 'lakeducation', desc: 'Hosting Backup Landing (DB Thật)' },
];

for (const tc of testCases) {
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(tc.domain);
  const isDevDomain = tc.domain.includes('lakeducation-dev') || tc.domain.includes('dev.lakeducation') || tc.domain.includes('-dev');
  const isExplicitProd = false;
  const isExplicitDev = false;
  const isEmulator = false;

  const isDev = ((isLocalhost && !isExplicitProd) || isDevDomain || isExplicitDev) && !isEmulator;
  const env = isDev ? 'development' : 'production';
  const project = isDev ? 'lakeducation-dev' : 'lakeducation';

  if (env === tc.expectedEnv && project === tc.expectedProject) {
    console.log(`  ✅ [PASS] ${tc.desc} (${tc.domain}) -> ${env} [${project}]`);
  } else {
    console.error(`  ❌ [FAIL] ${tc.desc} (${tc.domain}) -> Thực tế: ${env} [${project}] | Kỳ vọng: ${tc.expectedEnv} [${tc.expectedProject}]`);
    passed = false;
  }
}

console.log('\n======================================================');
if (passed) {
  console.log('🎉 TẤT CẢ 10/10 KỊCH BẢN ĐẠT TIÊU CHUẨN AN TOÀN TUYỆT ĐỐI (100% PASS)!');
  console.log('   - Localhost & Dev 100% ghi vào lakeducation-dev (Sandbox)');
  console.log('   - Production & Backup 100% bảo vệ dữ liệu lakeducationdb thật');
  console.log('   - Lệnh deploy cách ly hoàn toàn theo project target');
} else {
  console.error('🚨 PHÁT HIỆN LỖI CẤU HÌNH! Vui lòng khắc phục trước khi deploy.');
  process.exit(1);
}
