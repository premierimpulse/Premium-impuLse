// Динамичен час и дата
function updateDateTime() {
    const now = new Date();
    // Настройване за български формат (ДД.ММ.ГГГГ ЧЧ:ММ:СС)
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 24-часов формат
    };
    document.getElementById('dateTime').textContent = now.toLocaleString('bg-BG', options);
}

// Започваме актуализацията
setInterval(updateDateTime, 1000);
updateDateTime();

// Функция за превключване на съдържанието
function switchContent(targetId) {
    // За десктоп менюто
    document.querySelectorAll('.menu li').forEach(i => i.classList.remove('active'));
    document.querySelectorAll(`.menu li[data-target="${targetId}"]`).forEach(i => i.classList.add('active'));

    // За съдържанието
    document.querySelectorAll('.content-block').forEach(block => {
        block.classList.remove('active-content');
        block.classList.add('hidden-content');
    });
    document.getElementById(targetId).classList.add('active-content');
    document.getElementById(targetId).classList.remove('hidden-content');

    // Скриване на мобилното меню след избор
    document.querySelector('.mobile-menu').classList.remove('active');
    document.querySelector('.menu-toggle').classList.remove('active');
}

// Event Listeners за менюто (desktop & mobile)
document.querySelectorAll('[data-target]').forEach(item => {
    item.addEventListener('click', (e) => {
        // Проверяваме дали целта е вътрешна секция или е бутон за плащане в VIP секцията
        const targetId = e.currentTarget.getAttribute('data-target');
        switchContent(targetId);
    });
});

// Event Listener за мобилното меню toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('.mobile-menu').classList.toggle('active');
    document.querySelector('.menu-toggle').classList.toggle('active');
});

// -- ЗАРЕЖДАНЕ НА ДАННИ ОТ data.json --
async function loadData() {
    try {
        // КОРЕКЦИЯ 1: Добавяне на timestamp (?v=...), за да се избегне кеширането на data.json
        const timestamp = new Date().getTime();
        const dataUrl = `data.json?v=${timestamp}`;
        
        const response = await fetch(dataUrl); // Използваме новия URL
        if (!response.ok) {
            throw new Error(`HTTP грешка! Статус: ${response.status}`);
        }
        const data = await response.json();

        // 1. Попълване на Обща Статистика (Statistics)
        document.getElementById('total-prognoses').textContent = data.generalStats.totalPrognoses;
        
        // --- Логика за цвят на Общата успеваемост ---
        const successRateValueGeneral = parseInt(data.generalStats.totalSuccessRate.replace('%', ''));
        let rateClassGeneral = '';
        if (successRateValueGeneral >= 60) {
            rateClassGeneral = 'green-text';
        } else if (successRateValueGeneral < 50) {
            rateClassGeneral = 'red-text';
        }
        document.getElementById('total-success-rate').innerHTML = `<span class="${rateClassGeneral}">${data.generalStats.totalSuccessRate}</span>`;
        // --- КРАЙ НА Логика за цвят ---
        
        document.getElementById('avg-odd').innerHTML = `<span class="green-text">${data.generalStats.avgOdd.toFixed(2)}</span>`;

        // 2. Попълване на Фишове (Fiches)
        const fichesContainer = document.getElementById('fiches-content');
        // Изчистваме старото съдържание, запазваме само заглавието
        fichesContainer.innerHTML = '<h2 class="content-title">Фишове</h2><hr class="section-divider">';

        data.fiches.forEach(fiche => {
            let matchesHtml = fiche.matches.map(match => {
                const oddFormatted = match.odd > 0 ? match.odd.toFixed(2) : '-';
                return `
                    <tr>
                        <td>${match.date}</td>
                        <td>${match.time}</td>
                        <td>${match.game}</td>
                        <td>${oddFormatted}</td>
                        <td>${match.prediction}</td>
                        <td><i class="${match.statusIcon}"></i></td>
                    </tr>
                `;
            }).join('');

            const totalOddFormatted = fiche.totalOdd > 0 ? fiche.totalOdd.toFixed(2) : 0;
            const vipTag = fiche.isVIP ? '<i class="fas fa-crown green-text-vip"></i>' : '';

            fichesContainer.innerHTML += `
                <div class="fiche-card card">
                    <h3>${vipTag} ${fiche.title}</h3>
                    <table class="fiche-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Час</th>
                                <th>Среща</th>
                                <th>Коефициент</th>
                                <th>Прогноза</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>${matchesHtml}</tbody>
                    </table>
                    <hr class="section-divider">
                    <p><span class="fiche-total">Общ Коефициент: ${totalOddFormatted}</span></p>
                    <p class="disclaimer"><center><span style="color: red;">${fiche.disclaimer}</span></center></p>
                    <hr class="section-divider">
                </div>
                <hr class="section-divider">
            `;
        });

        // 3. Попълване на Прогнози (Prognosis Content)
        const prognosisTableBody = document.querySelector('#prognosis-content .prognosis-table tbody');
        prognosisTableBody.innerHTML = data.prognoses.map(p => {
            // Логика за цензуриране на играта, прогнозата и коефициента
            const gameDisplay = p.isCensoredGame ? '-' : p.game;
            const predictionDisplay = p.isCensoredPrediction ? '-' : p.prediction;
            const oddDisplay = p.isCensoredOdd ? '-' : p.odd.toFixed(2);
            const statusColorClass = p.statusIcon.includes('check-circle') ? 'green-text' : p.statusIcon.includes('times-circle') ? 'red-text' : 'stat-value-neutral';

            return `
                <tr>
                    <td>${p.date} / ${p.time}</td>
                    <td>${gameDisplay}</td>
                    <td>${predictionDisplay}</td>
                    <td>${oddDisplay}</td>
                    <td>${p.result}</td>
                    <td><i class="${p.statusIcon} ${statusColorClass}"></i></td>
                </tr>
            `;
        }).join('');

        // 4. Попълване на VIP Прогнози (VIP Prognosis Content)
        const vipTableBody = document.querySelector('#vip-prognosis-content .prognosis-table tbody');
        vipTableBody.innerHTML = data.vipPrognoses.map(p => {
            // В VIP секцията цензурата е ЗАДЪЛЖИТЕЛНА
            const gameDisplay = p.isCensoredGame ? '***' : p.game;
            const predictionDisplay = p.isCensoredPrediction ? '*' : p.prediction;
            const oddDisplay = p.isCensoredOdd ? '*' : p.odd.toFixed(2);
            const statusColorClass = p.statusIcon.includes('check-circle') ? 'green-text' : p.statusIcon.includes('times-circle') ? 'red-text' : 'stat-value-neutral';

            return `
                <tr class="blurred-text">
                    <td>${p.date} / ${p.time}</td>
                    <td>${gameDisplay}</td>
                    <td>${predictionDisplay}</td>
                    <td>${oddDisplay}</td>
                    <td><i class="${p.statusIcon} ${statusColorClass}"></i></td>
                </tr>
            `;
        }).join('');

        // 5. Попълване на Месечна Статистика (Monthly Stats)
        const monthlyStatsTableBody = document.querySelector('#monthly-stats-table tbody');
        // Изчистване на статичните примерни данни
        monthlyStatsTableBody.innerHTML = '';

        data.monthlyStats.forEach(stat => {
            const successRate = stat.successRate > 0 ? `${stat.successRate}%` : '0%';
            const rateColorClass = stat.successRate >= 60 ? 'green-text' : stat.successRate > 0 ? 'yellow-text' : 'white-text';
            const winsColorClass = stat.wins > 0 ? 'green-text' : 'white-text';
            const lossesColorClass = stat.losses > 0 ? 'red-text' : 'white-text';

            monthlyStatsTableBody.innerHTML += `
                <tr data-month="${stat.month}.${stat.year}">
                    <td>${stat.month}</td>
                    <td><span class="${winsColorClass}">${stat.wins}</span></td>
                    <td><span class="${lossesColorClass}">${stat.losses}</span></td>
                    <td><span class="stat-value-neutral">${stat.postponed}</span></td>
                    <td><span class="success-rate"><span class="${rateColorClass}">${successRate}</span></span></td>
                </tr>
            `;
        });

        // script.js (СЕКЦИЯ 6)

        // 6. Попълване на Таблото (Dashboard)
        const d = data.dashboard;

        // Daily Challenge
        document.getElementById('daily-date').textContent = d.dailyChallenge.date;
        document.getElementById('daily-time').textContent = d.dailyChallenge.time;
        document.getElementById('daily-game').textContent = d.dailyChallenge.game;
        document.getElementById('daily-prediction').textContent = d.dailyChallenge.prediction;
        document.getElementById('daily-odd').textContent = d.dailyChallenge.odd.toFixed(2);


        // Last VIP (в info-card)
        const lv = d.lastVip;
        const lastVipCard = document.querySelector('.vip-last-card');

        // КОРЕКЦИЯ 3: Актуализираме датата. Търсим span с клас .value, не .match-name-full.
        // Според index.html: <p class="fiche-date-row"><span class="label">Дата:</span><span class="value">...</span></p>
        const dateElement = lastVipCard.querySelector('.fiche-matches-list p:nth-child(1) .value');
        if (dateElement) {
            dateElement.textContent = lv.date;
        }

        // КОРЕКЦИЯ 4: Актуализираме мачовете. Използваме директните ID-та, за да е по-надеждно.
        document.getElementById('lv-game1').textContent = lv.game1;
        document.getElementById('lv-game2').textContent = lv.game2;
        document.getElementById('lv-game3').textContent = lv.game3;


        // Общ Коефициент
        // Този селектор е вече точен: <span id="lv-total-odd">
        lastVipCard.querySelector('#lv-total-odd').textContent = lv.totalOdd.toFixed(2); 

        // Статус
        // --- Логика за оцветяване ---
        const statusElement = document.getElementById('lv-status'); // Вземане на елемента по ID

        if (statusElement) {
            statusElement.textContent = lv.status; 
            
            // Премахване на всички стари класове за цвят
            statusElement.classList.remove('green-text-vip', 'red-text', 'white-text', 'status-winning', 'status-losing', 'status-pending', 'summary-value'); 

            // Нормализиране на текста за проверка (премахва '!' и '.')
            const statusText = (lv.status || '').toUpperCase().trim().replace(/!/g, '').replace(/\./g, ''); 

            // Добавяне на новия клас
            if (statusText.includes('ПЕЧЕЛИВШ')) {
                statusElement.classList.add('status-winning');
            } else if (statusText.includes('ГУБЕЩ')) {
                statusElement.classList.add('status-losing');
            } else if (statusText.includes('ИЗЧАКВА')) {
                statusElement.classList.add('status-pending');
            } else {
                // Ако няма статус или е различен, връщаме го към основния стил
                statusElement.classList.add('summary-value');
            }
            
            // Премахваме всички инлайн стилове
            statusElement.style.background = 'none';
        }
        // --- КРАЙ НА Логика за оцветяване ---


        // Top Achievements (Селекторите са ОК)
        const ta = d.topAchievements;
        document.querySelector('.info-card.stats-info-card:nth-child(4) p:nth-of-type(1) .stat-value-positive').textContent = ta.maxOdd.toFixed(2);
        document.querySelector('.info-card.stats-info-card:nth-child(4) p:nth-of-type(2) .stat-value-positive').textContent = ta.longestStreak;

        // Update success rate card (Селекторите са ОК)
        const statLarge = document.querySelector('.info-card.stats-info-card[data-target="statistics-content"] .stat-large');
        const successRateValue = parseInt(data.generalStats.totalSuccessRate.replace('%', ''));
        statLarge.textContent = data.generalStats.totalSuccessRate;
        if (successRateValue >= 60) {
            statLarge.classList.add('green-text');
            statLarge.classList.remove('red-text');
        } else if (successRateValue < 50) {
            statLarge.classList.add('red-text');
            statLarge.classList.remove('green-text');
        } else {
            statLarge.classList.remove('green-text', 'red-text');
        }

    } catch (error) {
        console.error("Грешка при обработка на данни:", error);
    }
}

// Извикваме функцията за зареждане на данни при зареждане на страницата
document.addEventListener('DOMContentLoaded', loadData);
