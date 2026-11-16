import { sync_playwright } from 'playwright';

async function checkClassroomView() {
  const p = await sync_playwright().start();
  const browser = await p.chromium.launch({
    executable_path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--headless=new']
  });

  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  const page = await ctx.newPage();

  console.log("Navigating to classroom LH004 as GV952...");
  await page.goto('http://127.0.0.1:3000/classroom/LH004?sso_uid=GV952', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log("Page title:", title);

  // Check tabs
  const tabs = await page.locator('.ant-tabs-tab').allTextContents();
  console.log("Classroom Tabs:", tabs);

  // Click on Tab 3 (Evaluation)
  const tabEval = page.locator('.ant-tabs-tab:has-text("Đánh Giá"), .ant-tabs-tab:has-text("Evaluation")').first();
  if (await tabEval.count() > 0) {
    console.log("Found Evaluation tab, clicking...");
    await tabEval.click();
    await page.waitForTimeout(2000);

    const shotPath = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/teacher_maj_classroom_tab_eval.png';
    await page.screenshot({ path: shotPath });
    console.log("Screenshot saved:", shotPath);

    const evalContent = await page.locator('.classroom-page').innerText();
    console.log("Eval tab text preview:\n", evalContent.substring(0, 400));
  } else {
    console.log("Evaluation tab not found!");
  }

  await browser.close();
  await p.stop();
}

checkClassroomView().catch(console.error);
