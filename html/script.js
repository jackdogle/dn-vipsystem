let currentShop = {};
let currentTiers = {};
let selectedItem = null;
let isGachaSpinFlag = false;
let currentCategory = 'vip';
let currentUserVip = 'none';
const vipWeights = { 'none': 0, 'bronze_7d': 1, 'bronze': 2, 'silver': 3, 'gold': 4, 'platinum': 5 };
let currentBannerId = 'limited_hypercar';

// Author Branding
console.log("%c DARKNESS COMMUNITY | VERSION 2.0 %c", "background: #ff0044; color: #fff; padding: 5px; font-weight: bold; border-radius: 3px 0 0 3px;", "background: #222; color: #ff0044; padding: 5px; font-weight: bold; border-radius: 0 3px 3px 0;");
console.log("%c Script Developed by Jack Dogle %c", "background: #222; color: #fff; padding: 5px;", "");

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function showBootScreen() {
    const boot = document.getElementById('boot-screen');
    const wrapper = document.querySelector('.tablet-wrapper');
    
    if (!boot) return;

    boot.classList.remove('hidden');
    boot.style.opacity = '1';
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'scale(0.9) translateY(20px)';

    setTimeout(() => {
        boot.style.opacity = '0';
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'scale(1) translateY(0)';
        setTimeout(() => boot.classList.add('hidden'), 500);
    }, 2000);
}

function exitApp() {
    // Hide main container immediately for responsiveness
    const wrapper = document.querySelector('.tablet-wrapper');
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'scale(0.9) translateY(20px)';
    
    setTimeout(() => {
        // Close session
        fetch(`https://${GetParentResourceName()}/closeMenu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    }, 300);
}

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('data-lucide', 'sun');
            if (window.lucide) lucide.createIcons();
        }
    }
}

function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        if (toggleBtn) toggleBtn.setAttribute('data-lucide', 'moon');
    } else {
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        if (toggleBtn) toggleBtn.setAttribute('data-lucide', 'sun');
    }
    
    if (window.lucide) lucide.createIcons();
}

initTheme();

let gachaBanners = {};
let currentPity = { epic: 0, legend: 0 };
let currentPityMax = { epic: 20, legendary: 50 };
let timerInterval = null;
let nextRotationTimestamp = 0;
let rotationTimerInterval = null;
let isAdmin = false;
let lastDailyClaim = "";
let currentAdminLogs = [];
let logPollInterval = null;
let currentLogFilter = 'all';

function checkVipRequirement(requirement) {
    if (!requirement || requirement === 'none') return true;
    const userWeight = vipWeights[currentUserVip] || 0;
    const reqWeight = vipWeights[requirement] || 0;
    return userWeight >= reqWeight;
}

window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.action === "open") {
        document.getElementById('app').style.display = 'flex';
        showBootScreen();
        updateClock();
        refreshIcons();
        if (!window.clockInterval) {
            window.clockInterval = setInterval(updateClock, 30000);
        }
        document.getElementById('user-coins').innerText = (data.coins || 0) + ' DC';
        document.getElementById('user-vip').innerText = (data.vip || 'NONE').toUpperCase();
        
        currentShop = data.shop;
        currentTiers = data.tiers;
        currentUserVip = data.vip;
        currentPity = data.pity || { epic: 0, legend: 0 };
        currentPityMax = data.gacha && data.gacha.pity ? data.gacha.pity : { epic: 20, legendary: 50 };
        window.allPools = data.gacha ? data.gacha.pools : {};
        isAdmin = data.isAdmin || false;
        lastDailyClaim = data.lastDailyClaim || "";

        if (data.gacha && data.gacha.banners) {
            gachaBanners = data.gacha.banners;
            currentBannerId = data.gacha.activeBanner || 'limited_hypercar';
            nextRotationTimestamp = data.nextRotation || 0;
            startRotationTimer();
        }

        // Toggle Admin Button visibility
        let adminBtn = document.querySelector('[data-cat="admin"]');
        let adminDockBtn = document.querySelector('.dock-item.admin-dock');
        
        if (isAdmin) {
            // Sidebar button
            if (!adminBtn) {
                const aside = document.getElementById('categories');
                const btn = document.createElement('button');
                btn.className = 'cat-btn';
                btn.dataset.cat = 'admin';
                btn.innerHTML = '<i data-lucide="shield-check"></i> ADMIN PANEL';
                aside.appendChild(btn);
                
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderShop('admin');
                });
            }
            
            // Dock button
            if (!adminDockBtn) {
                const dock = document.querySelector('.tablet-dock');
                const adminIcon = document.createElement('div');
                adminIcon.className = 'dock-item admin-dock';
                adminIcon.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
                adminIcon.innerHTML = '<i data-lucide="shield-check"></i>';
                adminIcon.onclick = () => renderShop('admin');
                dock.appendChild(adminIcon);
                if (window.lucide) lucide.createIcons();
            }
        } else {
            if (adminBtn) adminBtn.remove();
            if (adminDockBtn) adminDockBtn.remove();
        }

        renderShop('vip');

        // Add theme toggle listener
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn && !themeBtn.dataset.listener) {
            themeBtn.addEventListener('click', toggleTheme);
            themeBtn.dataset.listener = 'true';
        }
    }

    if (data.action === "close") {
        document.getElementById('app').style.display = 'none';
        if (rotationTimerInterval) {
            clearInterval(rotationTimerInterval);
            rotationTimerInterval = null;
        }
        closeModal();
    }

    if (data.action === "updateBanner") {
        currentBannerId = data.bannerId;
        nextRotationTimestamp = data.nextRotation;
        startRotationTimer();
        
        // Refresh UI if gacha view is open
        const activeBtn = document.querySelector('.cat-btn.active');
        if (activeBtn && activeBtn.dataset.category === 'gacha') {
            renderShop('gacha');
        }
    }

    if (data.action === "adminLogs") {
        currentAdminLogs = data.logs || [];
        updateLogTerminal();
    }

    if (data.action === "gachaResult") {
        if (data.pity) {
            currentPity = data.pity;
        }
        startRouletteAnimation(data.reward, data.rarity, data.coins);
    }
});

function createParticles(x, y, color, count, type = 'normal') {
    const container = document.getElementById('gacha-result-overlay');
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        
        let size = Math.random() * 8 + 4;
        let life = Math.random() * 1.5 + 0.8;
        
        if (type === 'sparkle') {
            size = Math.random() * 5 + 3;
            p.style.boxShadow = `0 0 10px ${color}`;
            p.style.borderRadius = '2px'; // Square sparkles
        } else if (type === 'intense') {
            size = Math.random() * 12 + 6;
            life = Math.random() * 2 + 1;
        }

        const angle = Math.random() * Math.PI * 2;
        const velocity = type === 'intense' ? (Math.random() * 400 + 100) : (Math.random() * 200 + 50);
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.backgroundColor = color;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--x', tx + 'px');
        p.style.setProperty('--y', ty + 'px');
        p.style.animation = `particleFlow ${life}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`;

        if (type === 'sparkle') {
            p.style.animation += `, particleTwinkle 0.3s infinite alternate`;
        }

        container.appendChild(p);
        setTimeout(() => p.remove(), life * 1000);
    }
}

function switchBanner(id) {
    if (document.getElementById('spin-btn').disabled) return;
    currentBannerId = id;
    renderShop('gacha');
}

function createRouletteItems(bannerId) {
    const banner = gachaBanners[bannerId];
    const track = document.getElementById('roulette-track');
    if (!track) return;
    track.innerHTML = '';
    
    // Default icons for different types
    const icons = {
        vehicle: '🚗',
        item: '📦',
        money: '💰',
        vip: '💎',
        weapon: '🔫'
    };

    // Flatten all items from pools for randomization
    let allPossibleItems = [];
    ['legendary', 'epic', 'rare', 'common'].forEach(r => {
        const pool = (banner.pools && banner.pools[r]) || (window.allPools ? window.allPools[r] : []);
        pool.forEach(item => {
            allPossibleItems.push({ ...item, rarity: r });
        });
    });

    if (allPossibleItems.length === 0) {
        allPossibleItems.push({ label: 'Mystery Reward', rarity: 'common', type: 'item' });
    }

    // Create 100 items for the track (more luxurious length)
    for (let i = 0; i < 100; i++) {
        const randomItem = allPossibleItems[Math.floor(Math.random() * allPossibleItems.length)];
        const el = document.createElement('div');
        el.className = `roulette-item ${randomItem.rarity}`;
        el.innerHTML = `
            <div class="item-icon-lux">${icons[randomItem.type] || '🎁'}</div>
            <div class="item-rarity-glow"></div>
            <span style="font-size: 10px; margin-top: 5px;">${randomItem.label}</span>
        `;
        track.appendChild(el);
    }
}

function spinGacha() {
    const btn = document.getElementById('spin-btn');
    if (btn.disabled) return;
    
    openGachaModal();
}

function openGachaModal() {
    isGachaSpinFlag = true;
    const banner = gachaBanners[currentBannerId];
    if (!banner) return;
    
    document.getElementById('modal-text').innerHTML = `
        <div style="text-align: center;">
            <i data-lucide="help-circle" style="width: 48px; height: 48px; color: var(--gold); margin-bottom: 15px;"></i>
            <h3 style="font-family: 'Orbitron'; color: white; margin-bottom: 10px;">KONFIRMASI SPIN</h3>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">Apakah Anda yakin ingin menggunakan <strong style="color: white;">${banner.label}</strong>?</p>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color);">
                <div style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 5px;">BIAYA SPIN</div>
                <div style="color: var(--accent); font-family: 'Orbitron'; font-size: 1.5em; font-weight: bold;">${banner.price} DC</div>
            </div>
        </div>
    `;
    
    document.getElementById('modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function executeSpinGacha() {
    const btn = document.getElementById('spin-btn');
    const giftInput = document.getElementById('gift-target-id');
    const giftTargetId = giftInput ? giftInput.value : null;

    if (btn.disabled) return;
    
    btn.disabled = true;
    btn.innerText = "OPENING VAULT...";
    
    // Reset track position
    const track = document.getElementById('roulette-track');
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    
    // Prepare items
    createRouletteItems(currentBannerId);

    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    if (isPreview) {
        setTimeout(() => {
            let mockRarity = 'common';
            const rand = Math.random() * 100;
            
            // Preview Pity Logic
            if (currentPity.legend + 1 >= currentPityMax.legendary) {
                mockRarity = 'legendary';
            } else if (currentPity.epic + 1 >= currentPityMax.epic) {
                mockRarity = 'epic';
            } else {
                if (rand < 5) mockRarity = 'legendary';
                else if (rand < 20) mockRarity = 'epic';
                else if (rand < 50) mockRarity = 'rare';
                else mockRarity = 'common';
            }

            // Update Pity
            currentPity.epic++;
            currentPity.legend++;
            
            if (mockRarity === 'legendary') {
                currentPity.legend = 0;
                currentPity.epic = 0;
            } else if (mockRarity === 'epic') {
                currentPity.epic = 0;
            }

            const mockReward = { label: `Preview ${mockRarity.toUpperCase()} Item`, type: 'item' };
            startRouletteAnimation(mockReward, mockRarity);
        }, 800);
        return;
    }

    fetch(`https://${GetParentResourceName()}/spinGacha`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            bannerId: currentBannerId,
            giftTargetId: giftTargetId
        })
    });
}

function startRouletteAnimation(reward, rarity, newCoins) {
    const track = document.getElementById('roulette-track');
    const container = document.querySelector('.roulette-container');
    const items = track.querySelectorAll('.roulette-item');
    const winningIndex = 85; // Target index near end of 100 items
    const itemWidthTotal = 140; // 130px width + 10px margin
    
    // Inject winning item
    const icons = { vehicle: '🚗', item: '📦', money: '💰', vip: '💎', weapon: '🔫' };
    const winningEl = items[winningIndex];
    winningEl.className = `roulette-item ${rarity}`;
    winningEl.innerHTML = `
        <div class="item-icon-lux" style="font-size: 50px">${icons[reward.type] || '🎁'}</div>
        <div class="item-rarity-glow"></div>
        <span style="font-size: 11px; font-weight: bold;">${reward.label}</span>
    `;

    const containerWidth = container.offsetWidth;
    const centerOffset = containerWidth / 2;
    const stopPos = (winningIndex * itemWidthTotal) + (itemWidthTotal / 2) - centerOffset;
    const randomFudge = mathRandom(-50, 50);

    // Speed Variation Tracking (Visual Pings)
    let lastActive = -1;
    const updateLoop = () => {
        if (!track.classList.contains('track-animating')) return;
        
        const style = window.getComputedStyle(track);
        const matrix = new WebKitCSSMatrix(style.transform);
        const currentX = Math.abs(matrix.m41);
        const centerPos = currentX + centerOffset;
        const activeIdx = Math.floor(centerPos / itemWidthTotal);

        if (activeIdx !== lastActive && activeIdx >= 0 && activeIdx < items.length) {
            if (lastActive >= 0) items[lastActive].classList.remove('passing');
            items[activeIdx].classList.add('passing');
            lastActive = activeIdx;
        }
        requestAnimationFrame(updateLoop);
    };

    function mathRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    // Phase 1: Sudden Acceleration
    setTimeout(() => {
        track.classList.add('track-animating');
        container.classList.add('track-rumble'); // Start rumble at peak speed
        track.style.transform = `translateX(-${stopPos + randomFudge}px)`;
        requestAnimationFrame(updateLoop);
        
        // Phase 2: Deceleration (Dampen rumble)
        setTimeout(() => container.classList.remove('track-rumble'), 3500);
    }, 100);

    // Show Result
    setTimeout(() => {
        showGachaResult(reward, rarity, newCoins);
        track.classList.remove('track-animating');
        if (lastActive >= 0) items[lastActive].classList.remove('passing');
    }, 7500); 
}

// Gacha result listener has been merged into main listener above.

function showGachaResult(reward, rarity, newCoins) {
    const overlay = document.getElementById('gacha-result-overlay');
    const rarityEl = document.getElementById('res-rarity');
    const labelEl = document.getElementById('res-label');
    
    rarityEl.innerText = rarity.toUpperCase();
    rarityEl.className = 'rarity-' + rarity;
    labelEl.innerText = reward.label;
    
    overlay.classList.remove('hidden');

    // Advanced Particle Burst (Ultra Luxurious)
    const colors = { legendary: '#ff0000', epic: '#a335ee', rare: '#0070dd', common: '#ffffff' };
    const pCount = { legendary: 500, epic: 250, rare: 100, common: 50 };
    const pType = rarity === 'legendary' ? 'intense' : (rarity === 'epic' ? 'sparkle' : 'normal');
    
    createParticles(window.innerWidth / 2, window.innerHeight / 2, colors[rarity], pCount[rarity], pType);
    
    if (rarity === 'legendary' || rarity === 'epic') {
        // Delayed secondary bursts for dramatic impact
        setTimeout(() => {
            createParticles(window.innerWidth / 3, window.innerHeight / 2, colors[rarity], pCount[rarity] / 3, pType);
            createParticles(2 * window.innerWidth / 3, window.innerHeight / 2, colors[rarity], pCount[rarity] / 3, pType);
        }, 400);
    }
    
    if (rarity === 'legendary') {
        const flash = document.createElement('div');
        flash.className = 'legendary-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1500);
        
        document.getElementById('app').classList.add('shake-anim');
        setTimeout(() => document.getElementById('app').classList.remove('shake-anim'), 1200);
    } else if (rarity === 'epic') {
        document.getElementById('app').classList.add('shake-anim');
        setTimeout(() => document.getElementById('app').classList.remove('shake-anim'), 600);
    }
    
    if (newCoins !== undefined) {
        document.getElementById('user-coins').innerText = newCoins + ' DC';
    }
}

function closeGachaResult() {
    document.getElementById('gacha-result-overlay').classList.add('hidden');
    const btn = document.getElementById('spin-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerText = "SPIN NOW";
    }
    // Re-render to update pity bars
    renderShop('gacha');
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const el = document.getElementById('banner-timer');
    if (!el) return;

    const endTime = new Date(el.getAttribute('data-end')).getTime();

    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            el.innerHTML = "EXPIRED";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        el.innerHTML = `SISA WAKTU: ${days}h ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// Preview Mode for Browser
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('preview') === 'true') {
        const mockData = {
            action: "open",
            coins: 1500,
            vip: "bronze",
            userName: "PreviewUser",
            tiers: {
                bronze_7d: { label: "7-Day Bronze", price: 150, duration: 7, salary_multiplier: 1.1, garage_slots: 2, discount: 0.02, color: [205, 127, 50] },
                bronze: { label: "Bronze VIP", price: 500, duration: 30, salary_multiplier: 1.2, garage_slots: 5, discount: 0.05, color: [205, 127, 50] },
                silver: { label: "Silver VIP", price: 1000, duration: 30, salary_multiplier: 1.5, garage_slots: 10, discount: 0.10, color: [192, 192, 192] },
                gold: { label: "Gold VIP", price: 2500, duration: 30, salary_multiplier: 2.0, garage_slots: 20, discount: 0.15, color: [255, 215, 0] },
                platinum: { label: "Platinum VIP", price: 5000, duration: 30, salary_multiplier: 3.0, garage_slots: 50, discount: 0.25, color: [0, 255, 255] }
            },
            shop: {
                vehicles: { items: [{ label: 'Ferrari Pista', price: 5000 }, { label: 'Nissan GTR', price: 4500 }] },
                items: { items: [{ label: 'Vintage Pistol', price: 200 }, { label: 'iPhone 15', price: 50 }] },
                money: { items: [{ label: '$100.000 Cash', price: 100 }, { label: '$500.000 Cash', price: 450 }] }
            }
        };
        window.postMessage(mockData, "*");
    }
});

// Render Shop berdasarkan kategori
function renderShop(category) {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    currentCategory = category;

    if (category === 'gacha') {
        const banner = gachaBanners[currentBannerId] || { label: "Unknown", price: 0, rarities: {} };
        
        // Render Banner Switcher (Luxury Grid)
        let bannerTabs = '';
        Object.keys(gachaBanners).forEach(id => {
            const b = gachaBanners[id];
            bannerTabs += `
                <div class="banner-card ${id === currentBannerId ? 'active' : ''}" onclick="switchBanner('${id}')">
                    <div class="banner-img-container">
                        <img src="${b.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200'}" alt="">
                        <div class="banner-card-overlay">
                            <span>${b.label}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        // Pity System Progress
        const epicMax = currentPityMax.epic || 20;
        const legendMax = currentPityMax.legendary || 50;
        const epicDisp = Math.min(currentPity.epic, epicMax);
        const legendDisp = Math.min(currentPity.legend, legendMax);
        const epicPityPct = (epicDisp / epicMax) * 100;
        const legendPityPct = (legendDisp / legendMax) * 100;

        const epicRemaining = epicMax - epicDisp;
        const legendRemaining = legendMax - legendDisp;

        // Featured Items
        let featuredHtml = '';
        if (banner.featured) {
            featuredHtml = '<div class="featured-items">';
            banner.featured.forEach(item => {
                featuredHtml += `<span class="featured-item">★ ${item}</span>`;
            });
            featuredHtml += '</div>';
        }

        grid.innerHTML = `
            <div class="gacha-luxury-wrapper" style="grid-column: span 3;">
                <div class="banner-hub">
                    ${bannerTabs}
                </div>
                
                <div class="gacha-stage">
                    <div class="stage-background" style="background-image: url('${banner.image || ''}')"></div>
                    <div class="stage-overlay"></div>
                    
                    <div class="gacha-header-premium">
                        <div class="title-cluster">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <h2>${banner.label.toUpperCase()}</h2>
                                <div class="rotation-timer">
                                    <span class="timer-label">ROTATION IN:</span>
                                    <span id="rotation-countdown" class="timer-value">00:00:00</span>
                                </div>
                            </div>
                            <p>${banner.description || 'Uji keberuntunganmu untuk mendapatkan hadiah legendaris!'}</p>
                        </div>
                        ${featuredHtml}
                    </div>

                    <div class="gacha-core">
                        <div class="roulette-container">
                            <div class="roulette-pointer"></div>
                            <div id="roulette-track" class="roulette-track">
                                <!-- Roulette items injected here -->
                            </div>
                        </div>
                    </div>

                    <div class="gacha-pity-hud">
                        <div class="pity-box">
                            <div class="pity-info">
                                <span style="color: ${epicPityPct >= 100 ? '#a335ee' : ''}">${epicPityPct >= 100 ? 'EPIC GUARANTEED!' : 'EPIC IN ' + epicRemaining + ' SPINS'}</span>
                                <span style="color: ${epicPityPct >= 100 ? '#a335ee' : ''}">${epicDisp}/${epicMax}</span>
                            </div>
                            <div class="pity-bar"><div class="pity-fill epic ${epicPityPct >= 100 ? 'full' : ''}" style="width: ${epicPityPct}%"></div></div>
                        </div>
                        <div class="pity-box">
                            <div class="pity-info">
                                <span style="color: ${legendPityPct >= 100 ? '#ff0000' : ''}">${legendPityPct >= 100 ? 'LEGENDARY GUARANTEED!' : 'LEGENDARY IN ' + legendRemaining + ' SPINS'}</span>
                                <span style="color: ${legendPityPct >= 100 ? '#ff0000' : ''}">${legendDisp}/${legendMax}</span>
                            </div>
                            <div class="pity-bar"><div class="pity-fill legend ${legendPityPct >= 100 ? 'full' : ''}" style="width: ${legendPityPct}%"></div></div>
                        </div>
                    </div>

                    <div class="gacha-footer-premium">
                        <div class="price-display">
                            <span class="label">SPIN COST</span>
                            <span class="value">${banner.price} DC</span>
                        </div>
                        <div class="action-buttons">
                            <div class="gift-input-field">
                                <input type="number" id="gift-target-id" placeholder="GIFT PLAYER ID (OPTIONAL)" min="1">
                            </div>
                            <button class="btn-secondary-luxury" onclick="showPoolTable()">VIEW TABLE</button>
                            <button id="spin-btn" class="btn-spin-luxury" onclick="spinGacha()">SPIN NOW</button>
                        </div>
                    </div>
                </div>

                <div id="pool-modal" class="hidden">
                    <div class="pool-content">
                        <h3>REWARD POOL - ${banner.label}</h3>
                        <div class="pool-scroll">
                            <div id="pool-list"></div>
                        </div>
                        <button class="btn-buy" onclick="closePoolTable()" style="margin-top: 15px;">CLOSE</button>
                    </div>
                </div>

                <div id="gacha-result-overlay" class="hidden">
                    <div class="reward-reveal-premium">
                        <div class="reveal-bg-flare"></div>
                        <div class="reveal-content">
                            <span id="res-rarity">RARITY</span>
                            <h2 id="res-label">REWARD NAME</h2>
                            <button class="btn-claim-luxury" onclick="closeGachaResult()">CLAIM REWARD</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        startTimer();
        return;
    }

    if (category === 'admin') {
        if (!isAdmin) { renderShop('profile'); return; }
        
        let bannerOptions = '';
        Object.keys(gachaBanners).forEach(id => {
            const isActive = currentBannerId === id;
            bannerOptions += `
                <div class="admin-card ${isActive ? 'active' : ''}" onclick="adminChangeBanner('${id}')">
                    <div class="card-icon"><i data-lucide="refresh-cw"></i></div>
                    <div class="card-info">
                        <h4>${gachaBanners[id].label}</h4>
                        <p>${isActive ? 'SET AS ACTIVE' : 'SWITCH TO THIS'}</p>
                    </div>
                </div>`;
        });

        grid.innerHTML = `
            <div class="admin-app-container" style="grid-column: span 3;">
                <div class="admin-app-sidebar">
                    <div class="admin-nav-item active" onclick="switchAdminTab('gacha')"><i data-lucide="package"></i> VAULT MGMT</div>
                    <div class="admin-nav-item" onclick="switchAdminTab('economy')"><i data-lucide="banknote"></i> ECONOMY</div>
                    <div class="admin-nav-item" onclick="switchAdminTab('vips')"><i data-lucide="crown"></i> VIP ACCESS</div>
                    <div class="admin-nav-item" onclick="switchAdminTab('vehicles')"><i data-lucide="car-front"></i> VEHICLES</div>
                    <div class="admin-nav-item" onclick="switchAdminTab('items')"><i data-lucide="box"></i> ITEMS</div>
                    <div class="admin-nav-item" onclick="switchAdminTab('money')"><i data-lucide="dollar-sign"></i> MONEY</div>
                    <div class="admin-nav-item" onclick="switchAdminTab('logs')"><i data-lucide="scroll-text"></i> SYSTEM LOGS</div>
                </div>
                
                <div class="admin-app-content">
                    <div id="admin-tab-gacha" class="admin-tab-pane active">
                        <header class="app-header">
                            <h3>CONTROL CENTER: VAULT</h3>
                            <p>Force rotate gacha banners globally.</p>
                        </header>
                        <div class="admin-grid-layout">
                            ${bannerOptions}
                        </div>
                    </div>

                    <div id="admin-tab-economy" class="admin-tab-pane">
                        <header class="app-header">
                            <h3>FINANCE DEPARTMENT</h3>
                            <p>Manage player coins and wealth distribution.</p>
                        </header>
                        <div class="admin-form-card">
                            <div class="form-group">
                                <label><i data-lucide="user"></i> PLAYER ID</label>
                                <input type="number" id="admin-target-id" placeholder="Enter CID...">
                            </div>
                            <div class="form-group">
                                <label><i data-lucide="banknote"></i> DC AMOUNT</label>
                                <input type="number" id="admin-amount" placeholder="e.g. 5000">
                            </div>
                            <button class="btn-primary-admin" onclick="adminGiveDC()">EXECUTE TRANSACTION</button>
                        </div>
                    </div>

                    <div id="admin-tab-vips" class="admin-tab-pane">
                        <header class="app-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3>VIP TIER REGISTRY</h3>
                                <p>Manage subscription tiers and rewards.</p>
                            </div>
                            <button class="btn-buy" style="font-size: 10px; padding: 8px 15px;" onclick="openVipModal()">+ ADD NEW TIER</button>
                        </header>
                        <div id="admin-vip-list" class="admin-list-container">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <div id="admin-tab-vehicles" class="admin-tab-pane">
                        <header class="app-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3>VEHICLE CATALOG</h3>
                                <p>Manage showroom cars and prices.</p>
                            </div>
                            <button class="btn-buy" style="font-size: 10px; padding: 8px 15px;" onclick="openItemModal('vehicles')">+ ADD VEHICLE</button>
                        </header>
                        <div id="admin-vehicles-list" class="admin-list-container"></div>
                    </div>

                    <div id="admin-tab-items" class="admin-tab-pane">
                        <header class="app-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3>INVENTORY REPOSITORY</h3>
                                <p>Manage miscellaneous items and equipment.</p>
                            </div>
                            <button class="btn-buy" style="font-size: 10px; padding: 8px 15px;" onclick="openItemModal('items')">+ ADD ITEM</button>
                        </header>
                        <div id="admin-items-list" class="admin-list-container"></div>
                    </div>

                    <div id="admin-tab-money" class="admin-tab-pane">
                        <header class="app-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3>CURRENCY PACKAGES</h3>
                                <p>Manage cash bundles and donations.</p>
                            </div>
                            <button class="btn-buy" style="font-size: 10px; padding: 8px 15px;" onclick="openItemModal('money')">+ ADD PACKAGE</button>
                        </header>
                        <div id="admin-money-list" class="admin-list-container"></div>
                    </div>

                    <div id="admin-tab-logs" class="admin-tab-pane">
                        <header class="app-header">
                            <h3>INTERNAL LOGS</h3>
                            <p>Real-time system actions and auditor events.</p>
                        </header>
                        
                        <div class="log-controls">
                            <button class="log-filter-btn active" onclick="setLogFilter('all')">ALL</button>
                            <button class="log-filter-btn" onclick="setLogFilter('success')">SUCCESS</button>
                            <button class="log-filter-btn" onclick="setLogFilter('error')">ERROR</button>
                            <button class="log-filter-btn" onclick="setLogFilter('system')">SYSTEM</button>
                        </div>

                        <div id="admin-log-terminal" class="admin-log-terminal">
                            <div class="log-line system">[SYSTEM] Loading logs...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    if (category === 'profile') {
        const tierData = currentTiers[currentUserVip] || { label: 'NONE', color: [160, 160, 160], discount: 0, salary_multiplier: 1.0 };
        const today = new Date().toISOString().split('T')[0];
        const canClaim = lastDailyClaim !== today;
        
        const el = document.createElement('div');
        el.className = 'profile-container';
        el.style.gridColumn = "span 3";
        
        el.innerHTML = `
            <div class="profile-header" style="display: flex; gap: 20px; align-items: center; margin-bottom: 25px;">
                <div class="p-avatar" style="width: 70px; height: 70px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">👤</div>
                <div class="p-info">
                    <h2 style="font-family: 'Orbitron'; font-size: 20px; margin-bottom: 5px;">PLAYER SURVIVOR</h2>
                    <div class="profile-vip-badge" style="background: rgba(${tierData.color[0]}, ${tierData.color[1]}, ${tierData.color[2]}, 0.15); color: rgb(${tierData.color[0]}, ${tierData.color[1]}, ${tierData.color[2]}); border-color: rgba(${tierData.color[0]}, ${tierData.color[1]}, ${tierData.color[2]}, 0.3);">
                        <i data-lucide="crown"></i>
                        ${tierData.label.toUpperCase()} MEMBER
                    </div>
                </div>
            </div>
            <div class="p-stats-grid">
                <div class="p-stat">
                    <i data-lucide="wallet" style="margin-bottom: 10px; color: #4facfe;"></i>
                    <span>DC BALANCE</span>
                    <h3>${document.getElementById('user-coins').innerText}</h3>
                </div>
                <div class="p-stat">
                    <i data-lucide="percent" style="margin-bottom: 10px; color: #f093fb;"></i>
                    <span>DISCOUNT</span>
                    <h3>${tierData ? Math.round(tierData.discount * 100) : 0}%</h3>
                </div>
                <div class="p-stat">
                    <i data-lucide="trending-up" style="margin-bottom: 10px; color: #38ef7d;"></i>
                    <span>SALARY BONUS</span>
                    <h3>x${tierData ? tierData.salary_multiplier : 1.0}</h3>
                </div>
            </div>

            <div class="daily-bonus-section admin-section" style="margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
                <h3 style="color: var(--accent); font-family: 'Orbitron'; font-size: 14px; margin-bottom: 5px;">🎁 DAILY REWARD</h3>
                <p style="color: #888; font-size: 12px; margin-bottom: 15px;">Klaim hadiah harianmu berdasarkan status VIP-mu.</p>
                
                <div class="claim-status ${canClaim ? 'can-claim' : 'claimed'}" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${canClaim ? 'var(--accent)' : '#222'};">
                    <div>
                        <span style="display: block; font-size: 13px; color: ${canClaim ? '#fff' : '#666'}; font-weight: bold;">
                            ${canClaim ? 'Hadiah Tersedia!' : 'Sudah Diklaim'}
                        </span>
                        <span style="font-size: 11px; color: #555;">Reset setiap jam 00:00 server.</span>
                    </div>
                    <button id="claim-btn" class="${canClaim ? 'btn-buy' : 'btn-ghost'}" style="${!canClaim ? 'opacity: 0.5; pointer-events: none;' : ''}" onclick="claimDailyBonus()">
                        ${canClaim ? 'KLAIM SEKARANG' : 'KEMBALI BESOK'}
                    </button>
                </div>
            </div>

            <div class="p-actions" style="margin-top: 20px;">
                <button class="btn-buy" style="width: 100%;" onclick="renderShop('vip')">Upgrade VIP (Tingkatkan Hadiah)</button>
            </div>
        `;
        grid.appendChild(el);
        if (window.lucide) lucide.createIcons();
        return;
    }

    if (category === 'vip') {
        const vipPlaceholders = {
            bronze: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=400',
            silver: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?q=80&w=400',
            gold: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400',
            platinum: 'https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=400'
        };

        Object.keys(currentTiers).forEach(key => {
            const tier = currentTiers[key];
            const isActive = currentUserVip === key;
            const el = document.createElement('div');
            el.className = `item-card vip-card ${isActive ? 'active-tier' : ''}`;
            el.innerHTML = `
                ${isActive ? '<div class="active-badge">MILIK ANDA</div>' : ''}
                <div class="item-display">
                    <img src="${tier.image || vipPlaceholders[key] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400'}" class="item-img" alt="">
                    <div class="item-img-overlay"></div>
                </div>
                <div class="tier-header" style="color: rgb(${tier.color[0]}, ${tier.color[1]}, ${tier.color[2]})">
                    <h4>${tier.label}</h4>
                </div>
                <div class="benefits-list">
                    <ul>
                        <li><i class="icon">💰</i> Gaji: x${tier.salary_multiplier}</li>
                        <li><i class="icon">🚗</i> Garasi: ${tier.garage_slots} Slot</li>
                        <li><i class="icon">🏷️</i> Diskon: ${Math.round(tier.discount * 100)}%</li>
                        <li><i class="icon">📅</i> Durasi: ${tier.duration} Hari</li>
                    </ul>
                </div>
                <span class="price-tag">${tier.price} DC</span>
                <button class="btn-buy" onclick="openModal('${key}')">${isActive ? 'PERPANJANG' : 'BELI SEKARANG'}</button>
            `;
            grid.appendChild(el);
        });
    } else {
        const items = currentShop[category].items;
        const userTierData = currentTiers[currentUserVip] || { discount: 0 };
        const discount = userTierData.discount || 0;

        const placeholders = {
            vehicles: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=400',
            items: 'https://images.unsplash.com/photo-1549463591-14cc5c17d8a0?q=80&w=400',
            money: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=400'
        };

        items.forEach((item, index) => {
            if (!checkVipRequirement(item.minVip)) return;
            
            const originalPrice = item.price;
            const discountedPrice = Math.floor(originalPrice * (1 - discount));
            const hasDiscount = discount > 0;

            const el = document.createElement('div');
            el.className = 'item-card';
            el.innerHTML = `
                <div class="item-display">
                    <img src="${item.image || placeholders[category] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400'}" class="item-img" alt="">
                    <div class="item-img-overlay"></div>
                </div>
                <h4>${item.label}</h4>
                <div class="item-meta">
                    <span class="sub">${category.toUpperCase()}</span>
                    ${item.minVip ? `<span class="vip-badge">MIN: ${item.minVip.toUpperCase()}</span>` : ''}
                </div>
                ${hasDiscount ? `
                    <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">
                        <div style="font-size: 11px; color: #666; text-decoration: line-through; margin-bottom: 2px;">${originalPrice} DC</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="price-tag" style="margin-bottom:0;">${discountedPrice} DC</span>
                            <span style="font-size: 10px; color: var(--accent); background: rgba(255,0,68,0.1); padding: 2px 4px; border-radius: 3px; font-weight: bold;">-${Math.round(discount * 100)}%</span>
                        </div>
                    </div>
                ` : `
                    <span class="price-tag">${originalPrice} DC</span>
                `}
                <button class="btn-buy" onclick="openModal(${index})">BELI</button>
            `;
            el.style.animationDelay = `${index * 0.05}s`;
            grid.appendChild(el);
        });
    }
}

function showPoolTable() {
    const banner = gachaBanners[currentBannerId];
    if (!banner) return;

    const poolModal = document.getElementById('pool-modal');
    const poolList = document.getElementById('pool-list');
    const titleEl = poolModal.querySelector('h3');
    
    titleEl.innerText = `DATABASE: ${banner.label.toUpperCase()}`;
    poolList.innerHTML = '';

    const rarities = ['legendary', 'epic', 'rare', 'common'];
    
    rarities.forEach(rarity => {
        let pool = (banner.pools && banner.pools[rarity]) || (window.allPools ? window.allPools[rarity] : []);
        
        if (pool && pool.length > 0) {
            const group = document.createElement('div');
            group.className = 'pool-group';
            group.innerHTML = `<div class="pool-rarity rarity-${rarity}">${rarity.toUpperCase()}</div>`;
            
            // Show item list with weights
            pool.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'pool-item';
                itemEl.innerHTML = `
                    <span>${item.label}</span> 
                    <small>WT: ${item.weight || 1.0}</small>
                `;
                group.appendChild(itemEl);
            });
            poolList.appendChild(group);
        }
    });

    poolModal.classList.remove('hidden');
}

function closePoolTable() {
    document.getElementById('pool-modal').classList.add('hidden');
}

// Redundant listener removed.

// Sidebar logic
function switchCategory(category) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-cat') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderShop(category);
    refreshIcons();
}

document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        switchCategory(this.getAttribute('data-cat'));
    });
});

// Modal konfirmasi
function openModal(id) {
    selectedItem = id;
    let itemData;
    let currentDiscount = 0;
    
    if (currentCategory === 'vip') {
        itemData = currentTiers[selectedItem];
    } else {
        itemData = currentShop[currentCategory].items[selectedItem];
        const userTierData = currentTiers[currentUserVip] || { discount: 0 };
        currentDiscount = userTierData.discount || 0;
    }
    
    if (itemData) {
        const finalPrice = Math.floor(itemData.price * (1 - currentDiscount));

        document.getElementById('modal-text').innerHTML = `
            Apakah Anda yakin ingin membeli <strong style="color: white;">${itemData.label}</strong>?<br>
            <div style="margin-top: 10px; color: var(--accent); font-family: 'Orbitron'; font-size: 1.1em;">Harga: ${finalPrice} DC ${currentDiscount > 0 ? `<small style="font-size: 0.7em; color: #666; text-decoration: line-through; margin-left: 5px;">${itemData.price} DC</small>` : ''}</div>
        `;
    }
    
    document.getElementById('modal').classList.remove('hidden');
}

function startRotationTimer() {
    if (rotationTimerInterval) clearInterval(rotationTimerInterval);
    
    const update = () => {
        const timerEl = document.getElementById('rotation-countdown');
        if (!timerEl) return;
        
        const now = Math.floor(Date.now() / 1000);
        const diff = nextRotationTimestamp - now;
        
        if (diff <= 0) {
            timerEl.innerText = "ROTATING...";
            return;
        }
        
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        
        timerEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    update();
    rotationTimerInterval = setInterval(update, 1000);
}
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    selectedItem = null;
    isGachaSpinFlag = false;
}

document.getElementById('cancel-buy').addEventListener('click', closeModal);

// Confirmation Modal Logic
document.getElementById('confirm-buy').addEventListener('click', function() {
    if (isGachaSpinFlag) {
        closeModal();
        executeSpinGacha();
        return;
    }

    let itemData;
    if (currentCategory === 'vip') {
        itemData = {
            ...currentTiers[selectedItem],
            tier: selectedItem,
            type: 'vip'
        };
    } else {
        itemData = currentShop[currentCategory].items[selectedItem];
    }

    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

    if (isPreview) {
        console.log("PREVIEW MODE: Purchased", itemData.label);
        closeModal();
        // Update mock UI
        if (itemData.type === 'vip') {
            currentUserVip = itemData.tier;
            document.getElementById('user-vip').innerText = currentUserVip.toUpperCase();
            renderShop('vip');
        }
        return;
    }

    fetch(`https://${GetParentResourceName()}/buyItem`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
            item: itemData,
            category: currentCategory
        })
    }).then(resp => resp.json()).then(resp => {
        closeModal();
    });
});

// Close ESC
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
        if (isPreview) {
            console.log("PREVIEW MODE: Closed");
            return;
        }
        exitApp();
    }
});

// ==========================================
// ADMIN HELPERS
// ==========================================

function claimDailyBonus() {
    const btn = document.getElementById('claim-btn');
    if (btn) btn.disabled = true;

    fetch(`https://${GetParentResourceName()}/claimDailyBonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(resp => resp.json()).then(data => {
        if (data.success) {
            lastDailyClaim = new Date().toISOString().split('T')[0];
            // Update UI
            if (data.result.coins > 0) {
                // We'll trust the server for coins, but we can update locally for immediate feedback
                let current = parseInt(document.getElementById('user-coins').innerText);
                document.getElementById('user-coins').innerText = (current + data.result.coins) + ' DC';
            }
            renderShop('profile'); // Re-render to show claimed status
        }
    });
}

function updateClock() {
    const clockEl = document.getElementById('current-time');
    if (clockEl) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockEl.innerText = `${hours}:${minutes}`;
    }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-tab-pane').forEach(el => el.classList.remove('active'));
    
    // Fallback if event is not passed correctly or currentTarget is not available
    let currentTab;
    if (window.event && window.event.currentTarget) {
        currentTab = window.event.currentTarget;
    } else {
        // Find by tab name if called programmatically or from other contexts
        currentTab = Array.from(document.querySelectorAll('.admin-nav-item')).find(el => el.textContent.toLowerCase().includes(tab));
    }
    
    if (currentTab) currentTab.classList.add('active');
    
    const targetPane = document.getElementById(`admin-tab-${tab}`);
    if (targetPane) targetPane.classList.add('active');

    // Polling logic
    if (logPollInterval) {
        clearInterval(logPollInterval);
        logPollInterval = null;
    }

    if (tab === 'logs') {
        refreshAdminLogs();
        logPollInterval = setInterval(refreshAdminLogs, 3000);
    }

    if (tab === 'vips') {
        renderAdminVipList();
    }

    if (['vehicles', 'items', 'money'].includes(tab)) {
        renderAdminShopList(tab);
    }

    if (window.lucide) lucide.createIcons();
}

function renderAdminShopList(category) {
    const list = document.getElementById(`admin-${category}-list`);
    if (!list) return;

    let html = '';
    const items = currentShop[category].items || [];
    
    items.forEach((item, index) => {
        html += `
            <div class="admin-list-item">
                <div class="item-info">
                    <div class="item-icon-circle" style="background: rgba(255,255,255,0.05); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="${category === 'vehicles' ? 'car' : (category === 'money' ? 'dollar-sign' : 'box')}"></i>
                    </div>
                    <div>
                        <div class="item-name">${item.label} <span class="item-id">(${item.model || item.name || 'PACK'})</span></div>
                        <div class="item-meta">Price: ${item.price} DC • VIP: ${item.minVip || 'None'}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="icon-btn" onclick="openItemModal('${category}', ${index})"><i data-lucide="edit-3"></i></button>
                    <button class="icon-btn delete" onclick="deleteShopItem('${category}', ${index})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
    });

    list.innerHTML = html || '<div class="empty-list">No items found in this category.</div>';
    if (window.lucide) lucide.createIcons();
}

function openItemModal(category, index = null) {
    const modal = document.getElementById('item-modal');
    const title = document.getElementById('item-modal-title');
    const catInput = document.getElementById('item-edit-category');
    const idxInput = document.getElementById('item-edit-index');
    const extraFields = document.getElementById('item-extra-fields');
    
    catInput.value = category;
    idxInput.value = index !== null ? index : '';

    // Reset basics
    document.getElementById('item-edit-label').value = '';
    document.getElementById('item-edit-price').value = '';
    document.getElementById('item-edit-vip').value = 'none';
    document.getElementById('item-edit-image').value = '';

    // Extra fields based on category
    if (category === 'vehicles') {
        extraFields.innerHTML = `
            <label>Spawn Name (Model)</label>
            <input type="text" id="item-edit-model" placeholder="e.g. pista">
        `;
    } else if (category === 'items') {
        extraFields.innerHTML = `
            <label>Item Name (ID)</label>
            <input type="text" id="item-edit-name" placeholder="e.g. weapon_pistol">
            <label style="margin-top: 10px;">Count</label>
            <input type="number" id="item-edit-count" placeholder="1" value="1">
        `;
    } else if (category === 'money') {
        extraFields.innerHTML = `
            <label>Amount (Cash)</label>
            <input type="number" id="item-edit-amount" placeholder="e.g. 100000">
        `;
    }

    if (index !== null) {
        const item = currentShop[category].items[index];
        title.innerText = `EDIT ${category.slice(0,-1).toUpperCase()}`;
        document.getElementById('item-edit-label').value = item.label;
        document.getElementById('item-edit-price').value = item.price;
        document.getElementById('item-edit-vip').value = item.minVip || 'none';
        document.getElementById('item-edit-image').value = item.image || '';
        
        if (category === 'vehicles') document.getElementById('item-edit-model').value = item.model;
        if (category === 'items') {
            document.getElementById('item-edit-name').value = item.name;
            document.getElementById('item-edit-count').value = item.count || 1;
        }
        if (category === 'money') document.getElementById('item-edit-amount').value = item.amount;
    } else {
        title.innerText = `ADD NEW ${category.slice(0,-1).toUpperCase()}`;
    }

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeItemModal() {
    document.getElementById('item-modal').classList.add('hidden');
}

function saveShopItem() {
    const category = document.getElementById('item-edit-category').value;
    const index = document.getElementById('item-edit-index').value;
    
    const label = document.getElementById('item-edit-label').value;
    const price = parseInt(document.getElementById('item-edit-price').value);
    const minVip = document.getElementById('item-edit-vip').value;
    const image = document.getElementById('item-edit-image').value;

    if (!label || isNaN(price)) {
        alert("Please fill in required fields.");
        return;
    }

    const itemData = { label, price, minVip, image, type: category === 'vehicles' ? 'vehicle' : (category === 'money' ? 'money' : 'item') };

    if (category === 'vehicles') itemData.model = document.getElementById('item-edit-model').value;
    if (category === 'items') {
        itemData.name = document.getElementById('item-edit-name').value;
        itemData.count = parseInt(document.getElementById('item-edit-count').value) || 1;
    }
    if (category === 'money') itemData.amount = parseInt(document.getElementById('item-edit-amount').value);

    fetch(`https://${GetParentResourceName()}/adminSaveShopItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, index: index === '' ? null : parseInt(index), data: itemData })
    });

    if (new URLSearchParams(window.location.search).get('preview') === 'true') {
        if (index === '') {
            currentShop[category].items.push(itemData);
        } else {
            currentShop[category].items[index] = itemData;
        }
        renderAdminShopList(category);
    }

    closeItemModal();
}

function deleteShopItem(category, index) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    fetch(`https://${GetParentResourceName()}/adminDeleteShopItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, index })
    });

    if (new URLSearchParams(window.location.search).get('preview') === 'true') {
        currentShop[category].items.splice(index, 1);
        renderAdminShopList(category);
    }
}

function renderAdminVipList() {
    const list = document.getElementById('admin-vip-list');
    if (!list) return;

    let html = '';
    Object.keys(currentTiers).forEach(id => {
        const tier = currentTiers[id];
        if (id === 'none') return;
        
        html += `
            <div class="admin-list-item">
                <div class="item-info">
                    <div class="tier-color-dot" style="background: rgb(${tier.color.join(',')})"></div>
                    <div>
                        <div class="item-name">${tier.label} <span class="item-id">(${id})</span></div>
                        <div class="item-meta">Price: ${tier.price} DC • Multiplier: x${tier.salary_multiplier} • Discount: ${Math.round(tier.discount * 100)}%</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="icon-btn" onclick="openVipModal('${id}')"><i data-lucide="edit-3"></i></button>
                    ${id === 'none' ? '' : `<button class="icon-btn delete" onclick="deleteVipTier('${id}')"><i data-lucide="trash-2"></i></button>`}
                </div>
            </div>
        `;
    });

    list.innerHTML = html || '<div class="empty-list">No VIP tiers found.</div>';
    if (window.lucide) lucide.createIcons();
}

function openVipModal(id = null) {
    const modal = document.getElementById('vip-modal');
    const title = document.getElementById('vip-modal-title');
    const idInput = document.getElementById('vip-edit-id');
    
    // Clear fields first
    document.getElementById('vip-edit-label').value = '';
    document.getElementById('vip-edit-price').value = '';
    document.getElementById('vip-edit-duration').value = 30;
    document.getElementById('vip-edit-salary').value = 1.0;
    document.getElementById('vip-edit-garage').value = 0;
    document.getElementById('vip-edit-discount').value = 0.05;
    document.getElementById('vip-edit-color').value = '255,255,255';

    if (id && currentTiers[id]) {
        const t = currentTiers[id];
        title.innerText = 'EDIT VIP TIER';
        idInput.value = id;
        document.getElementById('vip-edit-label').value = t.label;
        document.getElementById('vip-edit-price').value = t.price;
        document.getElementById('vip-edit-duration').value = t.duration || 30;
        document.getElementById('vip-edit-salary').value = t.salary_multiplier;
        document.getElementById('vip-edit-garage').value = t.garage_slots || 0;
        document.getElementById('vip-edit-discount').value = t.discount;
        document.getElementById('vip-edit-color').value = t.color.join(',');
    } else {
        title.innerText = 'ADD NEW VIP TIER';
        idInput.value = '';
    }
    
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeVipModal() {
    document.getElementById('vip-modal').classList.add('hidden');
}

function saveVipTier() {
    const id = document.getElementById('vip-edit-id').value;
    const label = document.getElementById('vip-edit-label').value;
    const priceStr = document.getElementById('vip-edit-price').value;
    const durationStr = document.getElementById('vip-edit-duration').value;
    const multiplierStr = document.getElementById('vip-edit-salary').value;
    const garageStr = document.getElementById('vip-edit-garage').value;
    const discountStr = document.getElementById('vip-edit-discount').value;
    const colorStr = document.getElementById('vip-edit-color').value;

    const price = parseInt(priceStr);
    const duration = parseInt(durationStr);
    const multiplier = parseFloat(multiplierStr);
    const garage = parseInt(garageStr);
    const discount = parseFloat(discountStr);
    const color = colorStr.split(',').map(v => parseInt(v.trim()));

    if (!label || isNaN(price)) {
        alert("Please fill in required fields correctly.");
        return;
    }

    const tierData = {
        label, price, duration,
        salary_multiplier: multiplier,
        garage_slots: garage,
        discount, color
    };

    const targetId = id || label.toLowerCase().replace(/\s+/g, '_');

    fetch(`https://${GetParentResourceName()}/adminSaveVipTier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetId, data: tierData })
    });

    if (new URLSearchParams(window.location.search).get('preview') === 'true') {
        currentTiers[targetId] = tierData;
        renderAdminVipList();
    }

    closeVipModal();
}

function deleteVipTier(id) {
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;

    fetch(`https://${GetParentResourceName()}/adminDeleteVipTier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });

    if (new URLSearchParams(window.location.search).get('preview') === 'true') {
        delete currentTiers[id];
        renderAdminVipList();
    }
}

function refreshAdminLogs() {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    if (isPreview) {
        // Mock some logs for preview
        const mockLog = {
            type: ['success', 'error', 'system'][Math.floor(Math.random() * 3)],
            message: `[MOCK] Event triggered at ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toLocaleTimeString()
        };
        currentAdminLogs.unshift(mockLog);
        if (currentAdminLogs.length > 50) currentAdminLogs.pop();
        updateLogTerminal();
        return;
    }

    fetch(`https://${GetParentResourceName()}/getAdminLogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

function setLogFilter(filter) {
    currentLogFilter = filter;
    document.querySelectorAll('.log-filter-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    updateLogTerminal();
}

function updateLogTerminal() {
    const terminal = document.getElementById('admin-log-terminal');
    if (!terminal) return;

    const filteredLogs = currentAdminLogs.filter(log => {
        if (currentLogFilter === 'all') return true;
        return log.type.toLowerCase() === currentLogFilter.toLowerCase();
    });

    terminal.innerHTML = filteredLogs.map(log => `
        <div class="log-line ${log.type || ''}">
            <span class="log-time">[${log.timestamp || ''}]</span>
            <span class="log-msg">${log.message || ''}</span>
        </div>
    `).join('');
}

function adminChangeBanner(id) {
    fetch(`https://${GetParentResourceName()}/adminToggleBanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId: id })
    });
}

function adminGiveDC() {
    const targetId = document.getElementById('admin-target-id').value;
    const amount = document.getElementById('admin-amount').value;
    
    if (!targetId || !amount) return;

    fetch(`https://${GetParentResourceName()}/adminGiveDC`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: targetId, amount: amount })
    });
    
    document.getElementById('admin-target-id').value = '';
    document.getElementById('admin-amount').value = '';
}
