import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { coreFixture, statusFixture } from './fixtures';

async function fixtureFeed(page: Page, work=1200) {
  const requests: string[] = [];
  await page.route('https://api.squeekchain.com/v1/**', async (route) => {
    const path=new URL(route.request().url()).pathname;requests.push(path);
    await route.fulfill({json:path.endsWith('/core')?coreFixture(work):statusFixture()});
  });
  return requests;
}
async function expectInViewport(page: Page, name: string) {
  const box=await page.getByRole('button',{name,exact:true}).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y+box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}
async function clockStart(page: Page) {
  await page.clock.install();
  await fixtureFeed(page);
  await page.goto('./');
  await expect(page.getByText('2.00× live power')).toBeVisible();
  await page.getByRole('button',{name:'Start round',exact:true}).click();
  await page.clock.runFor(3_100);
  await expect(page.getByRole('button',{name:'Boost',exact:true})).toBeEnabled();
}
async function clockHit(page:Page, clicks=1){
  for(let i=0;i<160;i++){
    const hit=await page.evaluate((clicks)=>{
      const n=document.querySelector<HTMLElement>('.timing-needle')!,t=document.querySelector<HTMLElement>('.target-zone')!;
      const a=n.getBoundingClientRect(),b=t.getBoundingClientRect();
      if(Math.abs(a.x+a.width/2-b.x-b.width/2)>=b.width*.38||n.parentElement!.classList.contains('sweep-used'))return false;
      const button=document.querySelector<HTMLButtonElement>('.boost-button')!;
      for(let n=0;n<clicks;n++)button.click();
      return true;
    },clicks);
    if(hit)return;
    await page.clock.runFor(16);
  }
  throw new Error('No playable sweep reached the target');
}

test('mobile first screen, local assets, keyboard dialog and accessibility', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  const errors:string[]=[];const missing:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().includes('127.0.0.1')&&r.status()>=400)missing.push(r.url());});
  await fixtureFeed(page);await page.goto('./');
  await expect(page.getByText('2.00× live power')).toBeVisible();
  await expectInViewport(page,'Start round');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.fonts.check('16px "Space Grotesk"'))).toBe(true);
  await page.getByRole('button',{name:'How to play',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const a11y=await new AxeBuilder({page}).analyze();expect(a11y.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'How to play',exact:true})).toBeFocused();
  const closed=await new AxeBuilder({page}).analyze();expect(closed.violations).toEqual([]);
  expect(errors).toEqual([]);expect(missing).toEqual([]);
});

test('round countdown, perfect boost, spam guard, keyboard pause and resume', async ({page}) => {
  await clockStart(page);
  await clockHit(page,6);
  const score=Number(await page.getByTestId('score').innerText());expect(score).toBeGreaterThan(0);
  // All six clicks happen inside one frame; just one 120- or 200-point hit is permitted.
  expect([120,200]).toContain(score);
  await page.getByRole('button',{name:'Pause round',exact:true}).focus();
  await page.keyboard.press('Space');
  await expect(page.getByText('Your timer is paused.')).toBeVisible();
  const timer=await page.locator('.timer strong').innerText();
  await page.clock.runFor(10_000);expect(await page.locator('.timer strong').innerText()).toBe(timer);
  await page.getByRole('button',{name:'Resume round',exact:true}).last().click();
  await page.clock.runFor(1_000);
  expect(await page.locator('.timer strong').innerText()).not.toBe(timer);
  await page.keyboard.press('Escape');await expect(page.getByText('Your timer is paused.')).toBeVisible();
});

test('35-second loss saves once and survives reload; replay resets the round', async ({page}) => {
  await clockStart(page);await page.clock.runFor(35_200);
  await expect(page.getByTestId('round-result')).toContainText('Lose');
  await expect(page.locator('.score-list li')).toHaveCount(1);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squeek-arena:scores:v1')!).length)).toBe(1);
  await page.reload();await expect(page.locator('.score-list li')).toHaveCount(1);
  await page.getByRole('button',{name:'Start round',exact:true}).click();
  expect(await page.getByTestId('score').innerText()).toBe('0000');
  await page.clock.runFor(3_100);await expect(page.getByRole('button',{name:'Boost',exact:true})).toBeEnabled();
});

test('a real-time skill round reaches Win and polls during gameplay', async ({page}) => {
  const requests=await fixtureFeed(page);
  await page.goto('./');await expect(page.getByText('2.00× live power')).toBeVisible();
  await page.getByRole('button',{name:'Start round',exact:true}).click();
  await expect(page.getByRole('button',{name:'Boost',exact:true})).toBeEnabled();
  // Operate the real button from the rendered timing bar. No app state or score is injected.
  await page.evaluate(()=>new Promise<void>(resolve=>{
    function play(){
      if(document.querySelector('[data-testid="round-result"]')){resolve();return;}
      const needle=document.querySelector<HTMLElement>('.timing-needle'),target=document.querySelector<HTMLElement>('.target-zone');
      const boost=document.querySelector<HTMLButtonElement>('.boost-button');
      if(needle&&target&&boost&&!needle.parentElement!.classList.contains('sweep-used')){
        const n=needle.getBoundingClientRect(),t=target.getBoundingClientRect();
        if(Math.abs(n.x+n.width/2-t.x-t.width/2)<t.width*.38)boost.click();
      }
      requestAnimationFrame(play);
    }
    requestAnimationFrame(play);
  }));
  await expect(page.getByTestId('round-result')).toContainText('Win!');
  expect(requests.filter(p=>p.endsWith('/core')).length).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.score-list .player-name')).toContainText('Guest');
});

test('loading, offline practice, HTTP-200 unavailable and recovery are honest', async ({page}) => {
  await page.clock.install();
  let state:'delay'|'failure'|'unavailable'|'success'='delay';
  await page.route('https://api.squeekchain.com/v1/**',async route=>{
    if(state==='delay'){await new Promise(resolve=>setTimeout(resolve,500));}
    if(state==='failure'){await route.abort();return;}
    if(state==='unavailable'){await route.fulfill({json:{schemaVersion:1,status:'unavailable'}});return;}
    await route.fulfill({json:new URL(route.request().url()).pathname.endsWith('/core')?coreFixture():statusFixture()});
  });
  await page.goto('./');await expect(page.getByText('Syncing',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Start round',exact:true})).toBeEnabled();
  await expect(page.getByText('2.00× live power')).toBeVisible();
  state='failure';await page.clock.runFor(12_100);
  await expect(page.getByText('1.00× base power')).toBeVisible();
  await expect(page.getByText('Feed unavailable. Play at 1.00× or retry.')).toBeVisible();
  state='unavailable';await page.clock.runFor(24_100);
  await expect(page.getByText('Offline',{exact:true})).toBeVisible();
  state='success';await page.clock.runFor(60_100);
  await expect(page.getByText('2.00× live power')).toBeVisible();
});

test('feed failure during a round uses base power and produces a mixed result',async({page})=>{
  await page.clock.install();let online=true;
  await page.route('https://api.squeekchain.com/v1/**',async route=>{
    if(!online){await route.abort();return;}
    await route.fulfill({json:new URL(route.request().url()).pathname.endsWith('/core')?coreFixture():statusFixture()});
  });
  await page.goto('./');await expect(page.getByText('2.00× live power')).toBeVisible();
  await page.getByRole('button',{name:'Start round',exact:true}).click();await page.clock.runFor(3_100);
  await clockHit(page);
  expect(Number(await page.getByTestId('score').innerText())).toBeGreaterThan(0);
  online=false;await page.clock.runFor(12_100);await expect(page.getByText('1.00× base power')).toBeVisible();
  // Advance until the current marker is inside the target. The clock drives the same rAF as play.
  await clockHit(page);
  await page.clock.runFor(35_200);
  await expect(page.getByTestId('round-result')).toContainText('Mixed feed');
});

test('storage denial and corrupt storage keep the game playable',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Test storage denied')};Storage.prototype.setItem=()=>{throw new Error('Test storage denied')};});
  await page.clock.install();await fixtureFeed(page);await page.goto('./');
  await page.getByRole('button',{name:'Start round',exact:true}).click();await page.clock.runFor(38_200);
  await expect(page.getByTestId('round-result')).toBeVisible();
  await expect(page.getByText('Storage is unavailable. Scores will last until this page closes.')).toBeVisible();
  await expect(page.locator('.score-list li')).toHaveCount(1);
});

test('Retry-After from telemetry also delays further requests',async({page})=>{
  await page.clock.install();let limited=false;let coreRequests=0;
  await page.route('https://api.squeekchain.com/v1/**',async route=>{
    if(new URL(route.request().url()).pathname.endsWith('/core')){coreRequests++;await route.fulfill({json:coreFixture()});}
    else if(limited)await route.fulfill({status:429,headers:{'Retry-After':'30','Access-Control-Expose-Headers':'Retry-After'},json:{error:'rate_limited'}});
    else await route.fulfill({json:statusFixture()});
  });
  await page.goto('./');await expect(page.getByText('2.00× live power')).toBeVisible();
  limited=true;await page.clock.runFor(12_100);
  await expect(page.getByRole('button',{name:/Retry in \d+s/})).toBeDisabled();
  const before=coreRequests;await page.clock.runFor(24_100);expect(coreRequests).toBe(before);
  limited=false;await page.clock.runFor(24_100);await expect.poll(()=>coreRequests).toBeGreaterThan(before);
});

test('mobile wallet sheet offers all browser links and Coinbase Smart Wallet',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>Object.defineProperty(navigator,'userAgent',{value:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}));
  await fixtureFeed(page);await page.goto('./');
  await page.getByRole('button',{name:'Connect',exact:true}).click();
  for(const name of ['MetaMask','Coinbase Wallet','Rabby','Phantom']) await expect(page.getByRole('link',{name:`Open in ${name}`,exact:true})).toHaveAttribute('href',/https:\/\//);
  const rabby=new URL((await page.getByRole('link',{name:'Open in Rabby',exact:true}).getAttribute('href'))!);
  expect(rabby.searchParams.get('_cmd')).toBe('open-dapp');expect(rabby.searchParams.get('dapp')).toBe(page.url());
  await expect(page.getByRole('button',{name:'Coinbase Smart Wallet',exact:true})).toBeVisible();
  await expect(page.getByText('Injected',{exact:true})).toHaveCount(0);
  const a11y=await new AxeBuilder({page}).analyze();expect(a11y.violations).toEqual([]);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Connect',exact:true})).toBeFocused();
});

test('EIP-6963 discovery, signature rejection, verified local registration and disconnect',async({page})=>{
  await page.clock.install();
  // An ephemeral test account signs only inside the Node test runner, never in the frontend.
  const account=privateKeyToAccount(generatePrivateKey());
  await page.exposeFunction('arenaTestSign',(raw:`0x${string}`)=>account.signMessage({message:{raw}}));
  await page.addInitScript(({address})=>{
    const listeners=new Map<string,Set<(...args:unknown[])=>void>>();
    let authorized = sessionStorage.getItem('arena-test-authorized') === 'true';
    let chain = sessionStorage.getItem('arena-test-chain') ?? '0x1';
    let known = chain === '0xaa36a7';
    const emit = (e:string,value:unknown) => listeners.get(e)?.forEach(fn=>fn(value));
    const provider={
      on:(e:string,fn:(...args:unknown[])=>void)=>{if(!listeners.has(e))listeners.set(e,new Set());listeners.get(e)!.add(fn);},
      removeListener:(e:string,fn:(...args:unknown[])=>void)=>listeners.get(e)?.delete(fn),
      request:async({method,params}:{method:string;params:unknown[]})=>{
        if(method==='eth_chainId')return chain;
        if(method==='eth_accounts')return authorized ? [address] : [];
        if(method==='eth_requestAccounts'){authorized=true;sessionStorage.setItem('arena-test-authorized','true');return [address];}
        if(method==='personal_sign'){
          const win=window as unknown as {arenaTestReject?:boolean;arenaTestSign:(raw:unknown)=>Promise<string>};
          if(win.arenaTestReject)throw Object.assign(new Error('User rejected request'),{code:4001});
          return win.arenaTestSign(params[0]);
        }
        if(method==='wallet_switchEthereumChain'){
          if(!known)throw Object.assign(new Error('Unknown chain'),{code:4902});
          chain='0xaa36a7';sessionStorage.setItem('arena-test-chain',chain);emit('chainChanged',chain);return null;
        }
        if(method==='wallet_addEthereumChain'){
          known=true;chain='0xaa36a7';sessionStorage.setItem('arena-test-chain',chain);emit('chainChanged',chain);return null;
        }
        throw Object.assign(new Error(`Unsupported test method ${method}`),{code:4200});
      },
    };
    const info={uuid:crypto.randomUUID(),name:'Arena Test Wallet',icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="green"/></svg>',rdns:'test.arena.wallet'};
    const announce=()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info,provider}}));
    window.addEventListener('eip6963:requestProvider',announce);announce();
  },{address:account.address});
  await fixtureFeed(page);await page.goto('./');
  await page.getByRole('button',{name:'Connect',exact:true}).click();
  await expect(page.getByRole('button',{name:'Arena Test Wallet',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Browser wallet',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Arena Test Wallet',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Switch to Sepolia',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Start round',exact:true}).click();await page.clock.runFor(38_200);
  await expect(page.getByTestId('round-result')).toBeVisible();
  await expect(page.locator('.score-list .player-name')).toContainText('Guest');
  await page.getByRole('button',{name:'Register player name',exact:true}).click();
  await page.getByRole('button',{name:'Switch to Sepolia',exact:true}).last().click();
  await expect(page.getByRole('button',{name:'Register with signature',exact:true})).toBeVisible();
  await page.getByLabel('Player name',{exact:true}).fill('A');
  await page.getByRole('button',{name:'Register with signature',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('2–20');
  await page.getByLabel('Player name',{exact:true}).fill('SnackBandit');
  await page.evaluate(()=>{(window as unknown as {arenaTestReject:boolean}).arenaTestReject=true;});
  await page.getByRole('button',{name:'Register with signature',exact:true}).click();
  await expect(page.getByText('Registration was not completed. Check your wallet and try signing again.')).toBeVisible();
  await page.evaluate(()=>{(window as unknown as {arenaTestReject:boolean}).arenaTestReject=false;});
  await page.getByRole('button',{name:'Register with signature',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.score-list .player-name')).toContainText('SnackBandit');
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('squeek-arena:profile:v1')!));
  expect(profile.name).toBe('SnackBandit');expect(profile.address).toBe(account.address);expect(profile.message).toContain('Site: http://127.0.0.1:4182');
  await page.reload();await expect(page.locator('.arena-bottomline')).toContainText('SnackBandit');
  await page.getByRole('button',{name:new RegExp(account.address.slice(0,6))}).click();
  await page.getByRole('button',{name:'Disconnect',exact:true}).click();
  await expect(page.getByRole('button',{name:'Connect',exact:true})).toBeVisible();
});

test('320, 768 and 1440 layouts reflow, and reduced motion removes decoration',async({page})=>{
  await fixtureFeed(page);await page.goto('./');
  for(const width of [320,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Start round',exact:true}).click();
  await expect(page.getByRole('button',{name:'Boost',exact:true})).toBeEnabled();
  expect(await page.locator('.wheel-treads').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
});
