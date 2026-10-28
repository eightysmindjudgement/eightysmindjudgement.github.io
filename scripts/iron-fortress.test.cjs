/* Run with Node + Playwright: node scripts/iron-fortress.test.cjs
 * Set PLAYWRIGHT_MODULE and BROWSER_PATH when they are not on the default path.
 * Test instrumentation is appended to the HTTP response, never the shipped game.
 */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const hooks=`
globalThis.gameTest={
 state:()=>({mode,time,score,kills,life,best,level,enemies:enemies.length,shots:shots.length,bullets:bullets.length,particles:particles.length,boss:boss?.hp,x:player.position.x,fire:firePointer!==null,drag:!!drag}),
 step:n=>{for(let i=0;i<n;i++)if(mode==='playing')update(1/60)},
 damage:()=>{invulnerable=0;damage()},
 target:()=>{addEnemy();const e=enemies.at(-1);e.mesh.position.set(player.position.x,player.position.y,-8)},
 hazard:kind=>{invulnerable=0;if(kind==='bullet'){enemyBullet(player.position.clone(),new T.Vector3(0,0,10))}else{addRock();enemies.at(-1).mesh.position.copy(player.position)}},
 boss:()=>{time=100;createBoss();boss.mesh.position.set(player.position.x,player.position.y,-26)},
 aim:()=>{if(boss){target.set(boss.mesh.position.x,boss.mesh.position.y);player.position.x=target.x;player.position.y=target.y}},
 stage:()=>{invulnerable=1000;for(let i=0;i<6060;i++)update(1/60)},
 shield:()=>{invulnerable=1000}
};`;
async function run(){
 const server=http.createServer(async(req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error();if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{}),args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const base=`http://127.0.0.1:${server.address().port}`,page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/games/iron-fortress/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('/* IRON_FORTRESS_TEST_POINT */',hooks)})});
  await page.goto(base+'/games/iron-fortress/iron-fortness.html');await page.waitForFunction(()=>globalThis.gameTest);
  const state=()=>page.evaluate(()=>gameTest.state());
  assert.equal((await state()).mode,'title');assert.equal((await state()).time,0);
  await page.locator('#if-start').click();await page.keyboard.down('Space');await page.evaluate(()=>{gameTest.target();gameTest.step(35)});await page.keyboard.up('Space');assert.equal((await state()).kills,1);assert.equal((await state()).score,150);
  await page.locator('#if-pause').click();const paused=await state();await page.evaluate(()=>gameTest.step(200));assert.equal((await state()).time,paused.time);
  await page.locator('#if-start').click();await page.evaluate(()=>{gameTest.hazard('bullet');gameTest.step(1)});assert.equal((await state()).life,2);
  await page.evaluate(()=>{gameTest.hazard('rock');gameTest.step(1)});assert.equal((await state()).life,1);
  await page.evaluate(()=>{gameTest.damage()});assert.equal((await state()).mode,'over');
  for(let i=0;i<2;i++){await page.locator('#if-start').click();const s=await state();assert.equal(s.life,3);assert.equal(s.score,0);assert.equal(s.enemies,0);assert.equal(s.bullets,0);assert.equal(s.shots,0);if(i===0)await page.evaluate(()=>{gameTest.damage();gameTest.damage();gameTest.damage()})}
  await page.evaluate(()=>{gameTest.stage()});assert.ok((await state()).boss>0);
  await page.locator('#if-canvas').focus();await page.keyboard.down('Space');await page.evaluate(()=>{gameTest.shield();for(let i=0;i<2000;i++){gameTest.aim();gameTest.step(1)}});await page.keyboard.up('Space');assert.equal((await state()).mode,'clear');assert.ok((await state()).score>=4500);
  await page.locator('#if-home').click();await page.locator('[data-difficulty="HARD"]').click();assert.equal((await state()).best,0);await page.locator('#if-start').click();await page.keyboard.down('KeyD');await page.evaluate(()=>gameTest.step(120));await page.keyboard.up('KeyD');assert.ok((await state()).x>0);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});await page.locator('.if-game').scrollIntoViewIfNeeded();const cb=await page.locator('#if-canvas').boundingBox(),fb=await page.locator('#if-fire').boundingBox();const p1={id:1,x:cb.x+cb.width*.4,y:cb.y+cb.height*.6},p2={id:2,x:fb.x+fb.width/2,y:fb.y+fb.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});p1.x+=30;p1.y-=35;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p1,p2]});await page.evaluate(()=>gameTest.step(10));
  assert.ok((await state()).fire);assert.ok((await state()).drag);assert.ok((await state()).shots>0);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await state()).fire,false);assert.equal((await state()).drag,false);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).mode,'paused');
  const blocked=await browser.newPage();await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('disabled')};Storage.prototype.setItem=()=>{throw Error('disabled')}});await blocked.goto(base+'/games/iron-fortress/iron-fortness.html');await blocked.locator('#if-start').click();assert.equal(await blocked.locator('#if-overlay').isHidden(),true);
  const noGL=await browser.newPage();await noGL.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args)}});await noGL.goto(base+'/games/iron-fortress/iron-fortness.html');await noGL.waitForFunction(()=>document.querySelector('#if-title').textContent==='起動できませんでした');
  await page.goto(base+'/games.html');assert.equal(await page.locator('a[href="games/iron-fortress/iron-fortness.html"]').count(),1);
  await page.goto(base+'/emj-puzzle.html');assert.equal(await page.locator('#puzzle-start').count(),1);
  await page.unroute('**/games/iron-fortress/game.js');await page.goto(require('node:url').pathToFileURL(path.join(root,'games.html')).href);await page.getByRole('button',{name:'Next game',exact:true}).click();await page.locator('a[href="games/iron-fortress/iron-fortness.html"]').click();await page.locator('#if-start').click();assert.equal(await page.locator('#if-overlay').isHidden(),true);
  assert.deepEqual(errors,[]);console.log('PASS: stage flow, combat, hazards, retry, records, keyboard, pointer input, mobile layout, storage/WebGL fallbacks, existing puzzle and GAMES');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
}
run().catch(e=>{console.error(e);process.exitCode=1});
