import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
await page.setViewport({ width: 1280, height: 800 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1500))

await page.$$eval('.book', (bs) => bs[0].click())
await new Promise((r) => setTimeout(r, 1600))

// --- Test 1: close crossfade ---
const t0 = Date.now()
await page.keyboard.press('Escape')
const frames = []
for (let i = 0; i < 20; i++) {
  frames.push(await page.evaluate(() => {
    const el = document.querySelector('.book3d')
    const shelf = document.querySelectorAll('.book')[0]
    return {
      has3d: !!el,
      b3dOp: el ? getComputedStyle(el).opacity : null,
      shelfOp: getComputedStyle(shelf).opacity,
    }
  }))
  await new Promise((r) => setTimeout(r, 50))
}
console.log('--- close timeline (t,b3dOp,shelfOp) ---')
frames.forEach((f, i) => {
  console.log(`+${(i * 50).toString().padStart(4)} ${f.has3d ? '3D' : '--'} b3d=${f.b3dOp} shelf=${f.shelfOp}`)
})

// --- Test 2: cover close + reopen ---
await page.$$eval('.book', (bs) => bs[0].click())
await new Promise((r) => setTimeout(r, 1600))
const rig = await page.evaluate(() => {
  const r = document.querySelector('.book3d__rig').getBoundingClientRect()
  return { x: r.x, w: r.width, y: r.y, h: r.height }
})
// click left side to close cover (back at page 0)
await page.mouse.click(Math.round(rig.x + rig.w * 0.2), Math.round(rig.y + rig.h / 2))
await new Promise((r) => setTimeout(r, 700))
const afterClose = await page.evaluate(() => ({
  coverOpen: document.querySelector('.book3d__front').style.transform,
  spreadOp: getComputedStyle(document.querySelector('.book3d__spread')).opacity,
}))
console.log('after cover close:', JSON.stringify(afterClose))
// click the cover to reopen
await page.mouse.click(Math.round(rig.x + rig.w / 2), Math.round(rig.y + rig.h / 2))
await new Promise((r) => setTimeout(r, 60))
const t1 = Date.now()
const swing = []
for (let i = 0; i < 8; i++) {
  swing.push(await page.evaluate(() => document.querySelector('.book3d__front').style.transform))
  await new Promise((r) => setTimeout(r, 90))
}
console.log('--- cover reopen swing ---')
swing.forEach((s, i) => console.log(`+${Date.now() - t1}ms ${s}`))
await browser.close()
