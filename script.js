let siteData = {};

async function init() {
    try {
        const res = await fetch(`data.json?v=${Date.now()}`);
        if (!res.ok) throw new Error("Failed");
        siteData = await res.json();
        renderAll();
    } catch (e) { console.error(e); }
}

function renderAll() {
    // Settings
    document.title = siteData.siteSettings.siteTitle || "Premier ImpuLse";
    document.getElementById('site-logo').src = siteData.siteSettings.logoUrl;
    document.getElementById('marquee-text').innerHTML = siteData.siteSettings.marqueeText;
    document.getElementById('footer-text').innerHTML = siteData.siteSettings.footerText;
    document.getElementById('hero-title').innerText = siteData.siteSettings.siteTitle;

    // Menu
    const dMenu = document.getElementById('dynamic-menu');
    const mMenu = document.getElementById('mobile-menu-links');
    dMenu.innerHTML = ''; mMenu.innerHTML = '';
    
    (siteData.menu || []).forEach(item => {
        dMenu.innerHTML += `<li><a onclick="switchTab('${item.id}')" id="nav-${item.id}"><i class="${item.icon}"></i> ${item.label}</a></li>`;
        const mobileLink = document.createElement('a');
        mobileLink.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
        mobileLink.onclick = function() { switchTab(item.id); toggleMobileMenu(); };
        mMenu.appendChild(mobileLink);
    });

    // Ads, Partners, Sponsors
    const renderAd = (id, ad) => document.getElementById(id).innerHTML = (ad && ad.show) ? `<a href="${ad.link}" target="_blank"><img src="${ad.imageUrl}" alt="Ad"></a>` : '';
    renderAd('ad-header', siteData.ads.headerBanner);
    renderAd('ad-left', siteData.ads.sidebarLeft);
    renderAd('ad-right', siteData.ads.sidebarRight);
    renderAd('ad-content-bottom', siteData.ads.contentBottom);

    const card = i => `<a href="${i.url}" target="_blank" class="promo-card"><img src="${i.logo}" alt="${i.name}"><h4>${i.name}</h4></a>`;
    document.getElementById('partners-container').innerHTML = (siteData.partners || []).map(card).join('');
    document.getElementById('sponsors-container').innerHTML = (siteData.sponsors || []).map(card).join('');

    // --- MAIN CONTENT ---

    // 1. Matches (Free & VIP)
    // Използваме обновената функция createMatchRow
    document.getElementById('prognosis-tbody').innerHTML = (siteData.prognoses || []).map(m => createMatchRow(m, false)).join('');
    document.getElementById('vip-tbody').innerHTML = (siteData.vipPrognoses || []).map(m => createMatchRow(m, true)).join('');

    // 2. Fiches (ФИШОВЕ - СЕГА С ТАБЛИЦА ВЪТРЕ)
    document.getElementById('fiches-container').innerHTML = (siteData.fiches || []).map(f => {
        
        // Генерираме редовете за мачовете вътре във фиша, използвайки същата логика като за другите таблици
        const matchesRows = f.matches.map(m => createMatchRow(m, false)).join('');
        
        const ficheRibbon = f.ribbonText ? `<span class="ribbon-badge" style="background:${f.ribbonColor || '#ffd700'}; font-size:0.8rem; padding:4px 8px;">${f.ribbonText}</span>` : '';

        return `
        <div class="fiche-box glass-panel fade-in" style="${f.isVIP ? 'border-color:var(--gold);' : ''}">
            <div class="fiche-header">
                <div>
                    <h3 style="margin:0; font-size:1.1rem; color:${f.isVIP ? 'var(--gold)' : 'white'}">
                        ${f.isVIP ? '<i class="fas fa-crown"></i> ' : ''}${f.title} ${ficheRibbon}
                    </h3>
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.75rem; color:#aaa">Общ Коеф.</div>
                    <div style="font-size:1.4rem; font-weight:bold; color:var(--accent)">${f.totalOdd.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="fiche-body">
                <table class="pro-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Дата/Час</th>
                            <th>Среща</th>
                            <th>Информация</th>
                            <th>Прогноза</th>
                            <th>Коеф.</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matchesRows}
                    </tbody>
                </table>
            </div>

            <div style="padding:10px; text-align:center; font-size:0.75rem; color:#777;">${f.disclaimer || ''}</div>
        </div>`;
    }).join('');

    // 3. Pricing
    document.getElementById('pricing-grid').innerHTML = (siteData.pricing || []).map(p => {
        const tag = p.tag ? `<div class="price-tag" style="background:${p.tagColor || '#00ff9d'}">${p.tag}</div>` : '';
        return `
        <div class="price-card fade-in">
            ${tag}
            <h3 style="font-size:1.2rem; margin-bottom:10px;">${p.title}</h3>
            <div style="font-size:2.5rem; font-weight:900; color:var(--primary); margin:15px 0;">${p.price}</div>
            <a href="${p.link}" class="btn-glow" style="display:inline-block; text-decoration:none;">КУПИ</a>
        </div>`;
    }).join('');

    // 4. Monthly Stats
    const statsHtml = (siteData.monthlyStats || []).map(s => `<tr><td style="font-weight:bold">${s.month}</td><td style="color:var(--accent)">${s.wins}</td><td style="color:var(--danger)">${s.losses}</td><td style="font-weight:900; color:var(--primary)">${s.successRate}%</td></tr>`).join('');
    document.getElementById('monthly-stats-body').innerHTML = statsHtml;
    if(siteData.monthlyStats?.[0]) document.getElementById('home-stats-display').innerText = siteData.monthlyStats[0].successRate + "%";
    
    switchTab('home');
}

// Тази функция вече генерира 6 колони
function createMatchRow(m, isVip) {
    const game = (isVip && m.isCensoredGame) ? '<span style="filter:blur(5px); user-select:none;">HIDDEN GAME</span>' : m.game;
    const pred = (isVip && m.isCensoredPrediction) ? '<span style="filter:blur(5px); user-select:none;">1X2</span>' : m.prediction;
    
    // Информация (Ribbon Text) - преместена в отделна колона
    const infoBadge = m.ribbonText 
        ? `<span class="info-badge" style="background:${m.ribbonColor || '#ffd700'}">${m.ribbonText}</span>` 
        : '-';

    // Определяне на правилния клас за иконката
    // Ако в JSON-а вече пише 'status-win', CSS-ът ще го хване. 
    // Ако не, правим проверка за всеки случай, но разчитаме основно на данните от Admin панела.
    let iconClass = m.statusIcon || 'fas fa-hourglass-half status-pending';

    return `
        <tr>
            <td style="color:#aaa; font-size:0.85rem; white-space:nowrap;">${m.time}</td>
            <td class="game-cell">${game}</td>
            <td class="info-cell">${infoBadge}</td> <td style="color:var(--accent); font-weight:bold">${pred}</td>
            <td>${m.odd.toFixed(2)}</td>
            <td><i class="${iconClass}" style="font-size:1.1rem;"></i></td>
        </tr>
    `;
}

function switchTab(id) {
    document.querySelectorAll('.tab-section').forEach(e => e.classList.add('hidden'));
    const t = document.getElementById(id === 'home' ? 'home-content' : id + '-content');
    if(t) { t.classList.remove('hidden'); t.classList.add('fade-in'); window.scrollTo(0,0); }
    document.querySelectorAll('.desktop-nav a').forEach(a => a.classList.remove('active'));
    const nav = document.getElementById('nav-' + id);
    if(nav) nav.classList.add('active');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('active');
    if (menu.classList.contains('active')) { document.body.style.overflow = 'hidden'; } 
    else { document.body.style.overflow = 'auto'; }
}

init();
