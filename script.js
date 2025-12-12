let siteData = {};

async function init() {
    try {
        const res = await fetch(`data.json?v=${Date.now()}`);
        siteData = await res.json();
        renderAll();
    } catch (e) { console.error("Error loading JSON:", e); }
}

function renderAll() {
    renderSettings();
    renderMenu();
    renderAds();
    renderSponsorsAndPartners();
    renderContent();
    startTime();
}

function renderSettings() {
    document.title = siteData.siteSettings.siteTitle;
    document.getElementById('site-logo').src = siteData.siteSettings.logoUrl;
    document.getElementById('marquee-text').innerHTML = siteData.siteSettings.marqueeText;
    document.getElementById('footer-text').innerHTML = siteData.siteSettings.footerText;
}

function renderMenu() {
    const desktopList = document.getElementById('dynamic-menu');
    const mobileList = document.getElementById('mobile-menu-links');
    let html = '';
    let mobileHtml = '';

    siteData.menu.forEach(item => {
        html += `<li><a onclick="switchTab('${item.id}')"><i class="${item.icon}"></i> ${item.label}</a></li>`;
        mobileHtml += `<a onclick="switchTab('${item.id}')"><i class="${item.icon}"></i> ${item.label}</a>`;
    });
    desktopList.innerHTML = html;
    mobileList.innerHTML = mobileHtml;
}

function renderAds() {
    const ads = siteData.ads;
    const createAd = (ad) => ad.show ? `<a href="${ad.link}" target="_blank"><img src="${ad.imageUrl}" alt="Ad"><span class="ad-label">Реклама</span></a>` : '';
    document.getElementById('header-ad-container').innerHTML = createAd(ads.headerBanner);
    document.getElementById('left-ad-container').innerHTML = createAd(ads.sidebarLeft);
    document.getElementById('right-ad-container').innerHTML = createAd(ads.sidebarRight);
}

function renderSponsorsAndPartners() {
    // Partners (Left)
    const partners = siteData.partners || [];
    document.getElementById('partners-container').innerHTML = partners.map(p => `
        <a href="${p.url}" target="_blank" class="sponsor-item" title="${p.name}">
            <img src="${p.logo}" alt="${p.name}">
        </a>
    `).join('');

    // Sponsors (Right)
    const sponsors = siteData.sponsors || [];
    document.getElementById('sponsors-container').innerHTML = sponsors.map(s => `
        <a href="${s.url}" target="_blank" class="sponsor-item" title="${s.name}">
            <img src="${s.logo}" alt="${s.name}">
        </a>
    `).join('');
}

function renderContent() {
    // 1. Fiches (Only in Fiches tab)
    const fichesContainer = document.getElementById('fiches-content');
    
    fichesContainer.innerHTML = siteData.fiches.map(f => {
        const matchesHtml = f.matches.map(m => {
            const ribbonColor = m.ribbonColor || 'transparent';
            const ribbonText = m.ribbonText ? `<span class="ribbon-badge" style="background:${ribbonColor}">${m.ribbonText}</span>` : '';
            const ribbonMarker = `<div class="ribbon-marker" style="background:${ribbonColor}; box-shadow: 0 0 8px ${ribbonColor};"></div>`;

            return `
                <tr>
                    <td class="ribbon-cell">${ribbonMarker}</td>
                    <td><span style="color:#aaa; font-size:0.8em">${m.time}</span><br>${m.game} ${ribbonText}</td>
                    <td style="font-weight:bold; color:var(--accent)">${m.prediction}</td>
                    <td>${m.odd.toFixed(2)}</td>
                    <td><i class="${m.statusIcon}"></i></td>
                </tr>
            `;
        }).join('');

        return `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; margin-bottom:10px;">
                <h3 style="margin:0; width:100%; text-align:center; color: ${f.isVIP ? 'gold' : 'white'}">
                    ${f.isVIP ? '<i class="fas fa-crown"></i>' : ''} ${f.title}
                </h3>
            </div>
            
            ${f.ribbonText ? `
            <div style="text-align:center; margin-bottom:10px;">
                <span style="background:${f.ribbonColor || '#ccc'}; color:#000; font-weight:bold; padding:2px 8px; border-radius:4px; font-size:0.8rem;">${f.ribbonText}</span>
            </div>` : ''}

            <table class="custom-table">
                <thead><tr><th style="width:10px"></th><th>Мач</th><th>Прогноза</th><th>Коеф.</th><th>Статус</th></tr></thead>
                <tbody>
                    ${matchesHtml}
                </tbody>
            </table>
            <div style="text-align:center; margin-top:10px; font-weight:bold;">Общ коефициент: <span style="color:var(--accent); font-size:1.2em;">${f.totalOdd.toFixed(2)}</span></div>
            <div style="color:#777; font-size:0.8rem; margin-top:5px; text-align:center;">${f.disclaimer}</div>
        </div>
    `}).join('');

    // 2. Free Prognosis
    document.getElementById('prognosis-tbody').innerHTML = siteData.prognoses.map(p => createRow(p)).join('');

    // 3. VIP Prognosis
    document.getElementById('vip-tbody').innerHTML = siteData.vipPrognoses.map(p => createRow(p, true)).join('');

    // 4. Pricing
    document.getElementById('pricing-grid').innerHTML = siteData.pricing.map(plan => `
        <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:10px; text-align:center; border:1px solid rgba(255,255,255,0.1); position:relative;">
            ${plan.tag ? `<div style="position:absolute; top:-10px; right:10px; background:var(--accent); color:black; font-weight:900; font-size:0.7rem; padding:2px 8px; border-radius:4px;">${plan.tag}</div>` : ''}
            <h3 style="margin-top:10px;">${plan.title}</h3>
            <div style="font-size:2rem; font-weight:900; color:var(--primary); margin:15px 0;">${plan.price}</div>
            <a href="${plan.link}" style="display:inline-block; background:white; color:black; text-decoration:none; padding:10px 20px; font-weight:bold; border-radius:20px;">КУПИ</a>
        </div>
    `).join('');

    // 5. Monthly Stats
    document.getElementById('monthly-stats-body').innerHTML = siteData.monthlyStats.map(s => `
        <tr>
            <td>${s.month} ${s.year}</td>
            <td class="status-win">${s.wins}</td>
            <td class="status-lose">${s.losses}</td>
            <td style="font-weight:bold; color:var(--text-main)">${s.successRate}%</td>
        </tr>
    `).join('');
}

function createRow(match, isVip = false) {
    const game = (isVip && match.isCensoredGame) ? '<span class="vip-blur">HIDDEN GAME</span>' : match.game;
    const pred = (isVip && match.isCensoredPrediction) ? '<span class="vip-blur">1X2</span>' : match.prediction;
    const odd = (isVip && match.isCensoredOdd) ? '<span class="vip-blur">0.00</span>' : match.odd.toFixed(2);
    
    const ribbonColor = match.ribbonColor || 'transparent';
    const ribbonText = match.ribbonText ? `<span class="ribbon-badge" style="background:${ribbonColor}">${match.ribbonText}</span>` : '';
    const ribbonMarker = `<div class="ribbon-marker" style="background:${ribbonColor}; box-shadow: 0 0 8px ${ribbonColor};"></div>`;

    // ПРОМЯНА: Разделени клетки за Час и Мач, за да пасне на заглавната част (6 колони)
    return `
        <tr>
            <td class="ribbon-cell">${ribbonMarker}</td>
            <td style="white-space:nowrap; color:#aaa; font-weight:bold;">${match.time}</td>
            <td style="text-align:left;">${game} ${ribbonText}</td>
            <td style="color:var(--accent); font-weight:bold">${pred}</td>
            <td>${odd}</td>
            <td><i class="${match.statusIcon}"></i></td>
        </tr>
    `;
}

function switchTab(tabId) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    
    let targetId = tabId + '-content';
    if(tabId === 'home') targetId = 'home-content';
    
    const target = document.getElementById(targetId);
    if(target) target.classList.remove('hidden');
    else document.getElementById('home-content').classList.remove('hidden'); 

    document.querySelector('.mobile-menu-overlay').classList.remove('active');
}

// ПРОМЯНА: Нова логика за дата и час на български
function startTime() {
    const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
    
    setInterval(() => {
        const now = new Date();
        
        // Взимаме деня от седмицата
        const dayName = days[now.getDay()];
        
        // Форматираме датата: 12.12.2025
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${day}.${month}.${year}г.`;
        
        // Форматираме часа: 15:32
        const timeString = now.toLocaleTimeString('bg-BG', {hour:'2-digit', minute:'2-digit'});
        
        // Сглобяваме крайния низ
        document.getElementById('clock').innerText = `Дата: ${dayName}, ${dateString} / Час: ${timeString}`;
    }, 1000);
}

document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('.mobile-menu-overlay').classList.add('active');
});
document.querySelector('.close-menu').addEventListener('click', () => {
    document.querySelector('.mobile-menu-overlay').classList.remove('active');
});
const style = document.createElement('style');
style.innerHTML = `.hidden { display: none !important; }`;
document.head.appendChild(style);

init();
