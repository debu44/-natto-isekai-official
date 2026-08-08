const menuBtn = document.querySelector('.menu-btn');
const mobileNav = document.querySelector('.mobile-nav');

menuBtn?.addEventListener('click', () => {
  const open = mobileNav?.classList.toggle('open') ?? false;
  menuBtn.setAttribute('aria-expanded', String(open));
});

mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Character images are optional until official transparent PNG assets are uploaded.
document.querySelectorAll('[data-optional-image]').forEach((img) => {
  const hideIfMissing = () => img.classList.add('image-missing');
  img.addEventListener('error', hideIfMissing);
  if (img.complete && img.naturalWidth === 0) hideIfMissing();
});

const characters = {
  rubina: {
    number: 'CHARACTER 01', bg: 'RUBINA', role: '双子魔王・姉', name: 'ルビナ＝バランシェ', roman: 'RUBINA BALANCHE',
    desc: '見た目は幼いが、実年齢は500歳を超える魔王。強気で好奇心旺盛。納豆の匂いと粘りを心底嫌っているが、魔力補給のため毎朝食べさせられている。',
    quote: '「こんなの食べるよりだったら、倒れた方がマシよ！」', tags: ['魔王','500+','納豆嫌い'], image: 'assets/rubina.png', initial: 'R', fallback: 'rubina-fallback'
  },
  rivil: {
    number: 'CHARACTER 02', bg: 'RIVIL', role: '双子魔王・弟', name: 'リヴィル＝バランシェ', roman: 'RIVIL BALANCHE',
    desc: 'ルビナの双子の弟。穏やかで慎重、そして姉思い。納豆は苦手だが必要なら食べる現実派で、姉が暴走した時の数少ないブレーキ役。',
    quote: '「臭いけど、食べないと……」', tags: ['魔王','500+','姉思い'], image: 'assets/rivil.png', initial: 'R', fallback: 'rivil-fallback'
  },
  koharu: {
    number: 'CHARACTER 03', bg: 'KOHARU', role: '魔王城・農政を担う女性', name: '稲守 こはる', roman: 'KOHARU INAMORI',
    desc: '秋田の米農家にいた女性。500年前にこの世界へ渡り、米と稲作の知識を持ち込んだ。現在は双子魔王を支える農政の要であり、彼女の存在はこの世界の食文化の歴史そのものに深く関わっている。',
    quote: '「……って、ここ、どこ？」', tags: ['秋田','米農家','500年前'], image: 'assets/koharu.png', initial: 'K', fallback: 'koharu-fallback'
  }
};

const tabs = document.querySelectorAll('[data-character]');
const stage = document.querySelector('#character-stage');
const charImage = document.querySelector('#char-image');
const fallback = document.querySelector('#char-fallback');

function setCharacter(key) {
  const c = characters[key];
  if (!c || !stage) return;
  stage.dataset.theme = key;
  document.querySelector('#char-number').textContent = c.number;
  document.querySelector('#char-bgname').textContent = c.bg;
  document.querySelector('#char-role').textContent = c.role;
  document.querySelector('#char-name').textContent = c.name;
  document.querySelector('#char-roman').textContent = c.roman;
  document.querySelector('#char-desc').textContent = c.desc;
  document.querySelector('#char-quote').textContent = c.quote;
  document.querySelector('#char-tags').innerHTML = c.tags.map((tag) => `<span>${tag}</span>`).join('');
  fallback.className = `art-fallback ${c.fallback}`;
  fallback.innerHTML = `<span>${c.initial}</span>`;
  charImage.classList.remove('image-missing');
  charImage.src = c.image;
  charImage.alt = c.name;
  tabs.forEach((tab) => {
    const active = tab.dataset.character === key;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}

tabs.forEach((tab) => tab.addEventListener('click', () => setCharacter(tab.dataset.character)));

// Scroll-driven prologue: the onigiri falls as the visitor moves through the opening incident.
const prologue = document.querySelector('.prologue');
const falling = document.querySelector('.falling-onigiri');
const impact = document.querySelector('.impact-ring');
const copies = [...document.querySelectorAll('.prologue-copy')];

function updatePrologue() {
  if (!prologue || !falling || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = prologue.getBoundingClientRect();
  const travel = prologue.offsetHeight - window.innerHeight;
  const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, travel)));
  const y = progress * (window.innerHeight * 0.68);
  const rotation = -8 + progress * 30;
  falling.style.transform = `translateY(${y}px) rotate(${rotation}deg)`;
  impact.style.opacity = progress > .88 ? String((progress - .88) / .12) : '0';
  impact.style.transform = `scale(${1 + Math.max(0, progress - .88) * 10})`;

  const active = progress < .34 ? 0 : progress < .7 ? 1 : 2;
  copies.forEach((copy, index) => {
    copy.style.opacity = index === active ? '1' : '0';
    copy.style.transform = index === active ? 'translateY(0)' : 'translateY(20px)';
  });
}

window.addEventListener('scroll', updatePrologue, { passive: true });
window.addEventListener('resize', updatePrologue);
updatePrologue();
