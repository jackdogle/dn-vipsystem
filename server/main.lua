local QBCore = exports['qb-core']:GetCoreObject()

-- ==========================================
-- FUNGSI HELPER & UTILITY
-- ==========================================

local function SendDiscordLog(title, message, color)
    if Config.Webhook == "MASUKKAN_WEBHOOK_ANDA_DISINI" then return end
    local embed = {
        {
            ["color"] = color or 3447003,
            ["title"] = "**"..title.."**",
            ["description"] = message,
            ["footer"] = {
                ["text"] = "Darkness VIP Logs - " .. os.date("%Y-%m-%d %H:%M:%S"),
            },
        }
    }
    PerformHttpRequest(Config.Webhook, function(err, text, headers) end, 'POST', json.encode({username = "Darkness Logger", embeds = embed}), { ['Content-Type'] = 'application/json' })
end

-- ==========================================
-- DISCORD BOT API INTEGRATION
-- ==========================================

local botToken = (Config.Discord.token and Config.Discord.token ~= "YOUR_DISCORD_BOT_TOKEN_HERE") and Config.Discord.token or GetConvar("DISCORD_BOT_TOKEN", "REPLACE_ME")

CreateThread(function()
    if Config.Discord.enabled then
        if botToken == "REPLACE_ME" or botToken == "" then
            print("^1[DISCORD ERROR]^7 Discord Bot Token is NOT configured in config.lua or Convar!")
        else
            print("^2[DISCORD SUCCESS]^7 Discord Bot Integration Active.")
            -- Test request to verify token
            local test = DiscordRequest("GET", "/users/@me")
            if test and test.code == 200 then
                local data = json.decode(test.data)
                print("^2[DISCORD SUCCESS]^7 Connected as Bot: ^5" .. data.username .. "#" .. data.discriminator .. "^7")
            else
                print("^1[DISCORD ERROR]^7 Failed to connect to Discord API. Check your token!")
            end
        end
    end
end)

local function DiscordRequest(method, endpoint, jsondata)
    local data = nil
    local finished = false

    if botToken == "REPLACE_ME" or botToken == "" then
        return nil
    end

    PerformHttpRequest("https://discordapp.com/api" .. endpoint, function(errorCode, resultData, resultHeaders)
        data = {data = resultData, code = errorCode, headers = resultHeaders}
        finished = true
    end, method, jsondata and json.encode(jsondata) or "", {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bot " .. botToken
    })

    while not finished do Wait(10) end
    return data
end

local function GetDiscordId(src)
    for _, id in pairs(GetPlayerIdentifiers(src)) do
        if string.find(id, "discord:") then
            return string.sub(id, 9)
        end
    end
    return nil
end

local function SyncPlayerDiscordRoles(src, targetTier)
    if not Config.Discord.enabled or botToken == "REPLACE_ME" then return end
    
    local discordId = GetDiscordId(src)
    if not discordId then return end

    local guildId = Config.Discord.guildId
    local endpoint = "/guilds/" .. guildId .. "/members/" .. discordId
    
    -- Get current roles
    local memberData = DiscordRequest("GET", endpoint)
    if not memberData or memberData.code ~= 200 then return end

    local data = json.decode(memberData.data)
    local currentRoles = data.roles or {}
    local vipRoles = Config.Discord.roles
    local roleToAdd = vipRoles[targetTier]
    
    -- 1. Remove ALL existing VIP roles from user
    for tier, roleId in pairs(vipRoles) do
        local hasRole = false
        for _, r in pairs(currentRoles) do if r == roleId then hasRole = true break end end
        if hasRole then
            DiscordRequest("DELETE", endpoint .. "/roles/" .. roleId)
        end
    end

    -- 2. Add the NEW VIP role
    if roleToAdd then
        DiscordRequest("PUT", endpoint .. "/roles/" .. roleToAdd)
    end
end

-- Command to manually sync
QBCore.Commands.Add("syncdiscord", "Sinkronisasi Role VIP Discord", {}, false, function(source)
    local Player = QBCore.Functions.GetPlayer(source)
    if Player then
        local tier = Player.PlayerData.metadata["vip_tier"] or "none"
        SyncPlayerDiscordRoles(source, tier)
        TriggerClientEvent('QBCore:Notify', source, "Proses sinkronisasi Discord dimulai...", "primary")
    end
end)

-- ==========================================
-- DATABASE GETTER & SETTER
-- ==========================================

-- Broadcast status VIP ke semua pemain saat login
AddEventHandler('QBCore:Server:PlayerLoaded', function(Player)
    local citizenid = Player.PlayerData.citizenid
    local src = Player.PlayerData.source
    MySQL.single('SELECT dc_coin, vip_tier, vip_expire FROM players WHERE citizenid = ?', {citizenid}, function(result)
        if result then
            local tier = result.vip_tier or 'none'
            -- Cek masa berlaku VIP
            if result.vip_expire and os.time() > (result.vip_expire / 1000) then
                tier = 'none'
                MySQL.update('UPDATE players SET vip_tier = ?, vip_expire = NULL WHERE citizenid = ?', {'none', citizenid})
                Player.Functions.SetMetaData("vip_tier", "none")
            else
                Player.Functions.SetMetaData("vip_tier", tier)
            end
            Player.Functions.SetMetaData("dc_coin", result.dc_coin)
            -- Broadcast ke semua orang agar muncul Badge di atas kepala
            TriggerClientEvent('dc_vip:updateNearbyCache', -1, src, tier)
        end
    end)
end)

-- Sync ulang saat ada orang baru join
RegisterNetEvent('QBCore:Server:OnPlayerLoaded', function()
    local src = source
    local players = QBCore.Functions.GetPlayers()
    for _, v in ipairs(players) do
        local p = QBCore.Functions.GetPlayer(v)
        if p then
            local tier = p.PlayerData.metadata["vip_tier"] or 'none'
            TriggerClientEvent('dc_vip:updateNearbyCache', src, v, tier)
        end
    end
end)

-- Integrasi Chat (Prefix Otomatis)
AddEventHandler('chatMessage', function(source, name, message)
    local Player = QBCore.Functions.GetPlayer(source)
    if Player then
        local tier = Player.PlayerData.metadata["vip_tier"] or 'none'
        if tier ~= 'none' and Config.VIPTiers[tier] then
            local tag = Config.VIPTiers[tier].tag
            -- Batalkan chat original (opsional, tergantung script chat Anda)
            -- Kita bisa memodifikasi format pesan di sini
            CancelEvent()
            TriggerClientEvent('chat:addMessage', -1, {
                template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(20, 20, 20, 0.9); border-radius: 5px; border-left: 4px solid rgb({0}, {1}, {2});"><b>{3} {4}:</b> {5}</div>',
                args = { 
                    Config.VIPTiers[tier].color[1], 
                    Config.VIPTiers[tier].color[2], 
                    Config.VIPTiers[tier].color[3], 
                    tag, 
                    name, 
                    message 
                }
            })
        end
    end
end)

-- ==========================================
-- PERMISSIONS & UTILS
-- ==========================================

local function IsAdmin(src)
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return false end
    
    -- Check QBCore Permissions
    if QBCore.Functions.HasPermission(src, "admin") or QBCore.Functions.HasPermission(src, "god") then
        return true
    end
    
    return false
end

local function CheckVipRequirement(src, requirement)
    if not requirement or requirement == "none" then return true end
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return false end

    local userTier = Player.PlayerData.metadata["vip_tier"] or "none"
    local vipWeights = { ['none'] = 0, ['bronze_7d'] = 1, ['bronze'] = 2, ['silver'] = 3, ['gold'] = 4, ['platinum'] = 5 }
    
    local userWeight = vipWeights[userTier] or 0
    local reqWeight = vipWeights[requirement] or 0
    
    return userWeight >= reqWeight
end

-- Callback untuk mendapatkan Koin (NUI)
QBCore.Functions.CreateCallback('dc_vip:getServerData', function(source, cb)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player then
        MySQL.single('SELECT dc_coin, vip_tier, vip_expire FROM players WHERE citizenid = ?', {Player.PlayerData.citizenid}, function(result)
            cb({
                coins = (result and result.dc_coin) or 0,
                vip = (result and result.vip_tier) or 'none',
                expire = (result and result.vip_expire),
                activeBanner = Config.Gacha.activeBanner,
                nextRotation = nextRotationTime,
                isAdmin = IsAdmin(src),
                lastDailyClaim = Player.PlayerData.metadata["last_daily_claim"] or "",
                pity = {
                    epic = Player.PlayerData.metadata["gacha_pity_epic"] or 0,
                    legend = Player.PlayerData.metadata["gacha_pity_legend"] or 0
                }
            })
        end)
    else
        cb(nil)
    end
end)

QBCore.Functions.CreateCallback('dc_vip:claimDailyReward', function(source, cb)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return cb(false) end

    local today = os.date("%Y-%m-%d")
    local lastClaim = Player.PlayerData.metadata["last_daily_claim"] or ""

    if lastClaim == today then
        return cb(false, "You already claimed your daily reward today!")
    end

    local tier = Player.PlayerData.metadata["vip_tier"] or "none"
    local reward = Config.DailyRewards[tier] or Config.DailyRewards['none']

    -- Give Rewards
    Player.Functions.AddMoney("cash", reward.money)
    
    if reward.coins > 0 then
        local currentCoins = Player.PlayerData.metadata["dc_coin"] or 0
        local nextCoins = currentCoins + reward.coins
        Player.Functions.SetMetaData("dc_coin", nextCoins)
        MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {nextCoins, Player.PlayerData.citizenid})
    end

    -- Update Last Claim
    Player.Functions.SetMetaData("last_daily_claim", today)
    
    cb(true, {
        money = reward.money,
        coins = reward.coins
    })
end)

-- Admin Toggle Banner
RegisterNetEvent('dc_vip:adminToggleBanner', function(bannerId)
    local src = source
    if not IsAdmin(src) then return end
    
    if Config.Gacha.banners[bannerId] then
        Config.Gacha.activeBanner = bannerId
        nextRotationTime = os.time() + (Config.Gacha.rotationInterval * 3600)
        
        TriggerClientEvent('dc_vip:updateBanner', -1, bannerId, nextRotationTime)
        
        -- Server announcement
        local bannerData = Config.Gacha.banners[bannerId]
        TriggerClientEvent('chat:addMessage', -1, {
            template = '<div style="padding: 1vw; margin: 0.5vw; background-color: rgba(0, 0, 0, 0.8); border: 1px solid #ff0044; border-left: 5px solid #ff0044; border-radius: 8px; box-shadow: 0 0 15px rgba(255, 0, 68, 0.3);"><div style="color: #ff0044; font-weight: bold; font-family: Orbitron; font-size: 1.1em; margin-bottom: 5px;">[GACHA SYSTEM ANNOUNCEMENT]</div><div style="color: #fff; font-size: 1.2em; font-weight: 500;">Banner Forced Rotated: {0}</div><div style="color: #aaa; font-style: italic; margin-top: 5px; font-size: 0.9em;">"{1}"</div></div>',
            args = { bannerData.label, bannerData.description or "Manual rotation by management." }
        })

        TriggerClientEvent('QBCore:Notify', src, "Active Banner changed to: " .. bannerId, "success")
    end
end)

-- Admin Give DC
RegisterNetEvent('dc_vip:adminGiveDC', function(targetId, amount)
    local src = source
    if not IsAdmin(src) then return end
    
    local TPlayer = QBCore.Functions.GetPlayer(tonumber(targetId))
    if TPlayer then
        local current = TPlayer.PlayerData.metadata["dc_coin"] or 0
        local newVal = current + tonumber(amount)
        TPlayer.Functions.SetMetaData("dc_coin", newVal)
        MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {newVal, TPlayer.PlayerData.citizenid})
        TriggerClientEvent('QBCore:Notify', src, "Gave " .. amount .. " DC to " .. TPlayer.PlayerData.charinfo.firstname, "success")
        TriggerClientEvent('QBCore:Notify', TPlayer.PlayerData.source, "You received " .. amount .. " Darkness Coins from Admin", "primary")
    end
end)

-- ==========================================
-- VIP DISCOUNTS INTEGRATION (EXPORTS)
-- ==========================================

--- Mengkalkulasi harga setelah diskon VIP
--- @param source number ID Pemain
--- @param originalPrice number Harga asli barang
--- @return number Harga setelah diskon
exports('GetDiscountedPrice', function(source, originalPrice)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return originalPrice end

    local tier = Player.PlayerData.metadata["vip_tier"] or "none"
    local discountPercent = 0

    if tier ~= "none" and Config.VIPTiers[tier] then
        discountPercent = Config.VIPTiers[tier].discount or 0
    end

    if discountPercent > 0 then
        local discountAmount = math.floor(originalPrice * discountPercent)
        return originalPrice - discountAmount
    end

    return originalPrice
end)

-- ==========================================
-- LOGIKA PEMBELIAN (TRANSAKSI AMAN)
-- ==========================================

RegisterNetEvent('dc_vip:purchaseItem', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local itemData = data.item
    local category = data.category
    
    -- Ambil data item dari config server-side untuk validasi (mencegah manipulasi client)
    local actualItemData = nil
    if category == 'vip' then
        actualItemData = Config.VIPTiers[itemData.tier]
        if actualItemData then actualItemData.type = 'vip' actualItemData.tier = itemData.tier end
    else
        if Config.Shop[category] and Config.Shop[category].items then
            for _, it in ipairs(Config.Shop[category].items) do
                if (it.model == itemData.model and it.type == 'vehicle') or (it.name == itemData.name and it.type == 'item') or (it.type == 'money' and it.amount == itemData.amount) then
                    actualItemData = it
                    break
                end
            end
        end
    end

    if not actualItemData then 
        TriggerClientEvent('QBCore:Notify', src, "Item tidak valid!", "error")
        return 
    end

    -- Validasi VIP Requirement
    if not CheckVipRequirement(src, actualItemData.minVip) then
        TriggerClientEvent('QBCore:Notify', src, "Tingkatan VIP Anda tidak mencukupi untuk membeli item ini!", "error")
        return
    end

    -- Ambil saldo terbaru dari database untuk mencegah eksploitasi memory injection
    MySQL.single('SELECT dc_coin FROM players WHERE citizenid = ?', {Player.PlayerData.citizenid}, function(result)
        local currentBalance = result.dc_coin or 0
        local finalPrice = actualItemData.price

        -- Terapkan diskon jika bukan pembelian VIP
        if category ~= 'vip' then
            local tier = Player.PlayerData.metadata["vip_tier"] or "none"
            if tier ~= "none" and Config.VIPTiers[tier] then
                local discountPercent = Config.VIPTiers[tier].discount or 0
                if discountPercent > 0 then
                    finalPrice = math.floor(actualItemData.price * (1 - discountPercent))
                end
            end
        end
        
        if currentBalance >= finalPrice then
            -- Proses Pembelian
            local newBalance = currentBalance - finalPrice
            
            if actualItemData.type == 'vehicle' then
                -- Logika spawn kendaraan atau masukkan ke database showroom
                -- Di sini kita contohkan memasukkannya ke player_vehicles
                local plate = QBCore.Functions.GeneratePlate()
                MySQL.insert('INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, state) VALUES (?, ?, ?, ?, ?, ?, ?)', {
                    Player.PlayerData.license,
                    Player.PlayerData.citizenid,
                    actualItemData.model,
                    GetHashKey(actualItemData.model),
                    '{}',
                    plate,
                    1
                })
                TriggerClientEvent('QBCore:Notify', src, "Sukses membeli " .. actualItemData.label .. " (Cek Garasi)", "success")
                
            elseif actualItemData.type == 'item' then
                Player.Functions.AddItem(actualItemData.name, actualItemData.count or 1)
                TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[actualItemData.name], "add")
                
            elseif actualItemData.type == 'money' then
                Player.Functions.AddMoney('cash', actualItemData.amount)
                
            elseif actualItemData.type == 'vip' then
                local duration = Config.VIPTiers[actualItemData.tier].duration
                local expireDate = os.time() + (duration * 86400)
                MySQL.update('UPDATE players SET vip_tier = ?, vip_expire = FROM_UNIXTIME(?) WHERE citizenid = ?', {
                    actualItemData.tier,
                    expireDate,
                    Player.PlayerData.citizenid
                })
                Player.Functions.SetMetaData("vip_tier", actualItemData.tier)
                -- Sync Discord Roles
                SyncPlayerDiscordRoles(src, actualItemData.tier)
            end

-- Update Koin di Database
            MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {newBalance, Player.PlayerData.citizenid})
            Player.Functions.SetMetaData("dc_coin", newBalance)
            
            -- Log Discord
            SendDiscordLog("TRANSAKSI TOKO VIP", "**Nama:** " .. Player.PlayerData.charinfo.firstname .. "\n**Item:** " .. actualItemData.label .. "\n**Harga:** " .. actualItemData.price .. " DC", 15158332)
        else
            TriggerClientEvent('QBCore:Notify', src, "Koin tidak mencukupi!", "error")
        end
    end)
end)

-- ==========================================
-- DAILY REWARD SYSTEM
-- ==========================================

QBCore.Commands.Add("claimvip", "Klaim Hadiah Harian VIP", {}, false, function(source)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    local tier = Player.PlayerData.metadata["vip_tier"] or "none"
    
    if tier == "none" then
        TriggerClientEvent('QBCore:Notify', src, "Anda bukan anggota VIP!", "error")
        return
    end

    local lastClaim = Player.PlayerData.metadata["last_vip_claim"] or 0
    local currentTime = os.time()

    if (currentTime - lastClaim) >= 86400 then -- 24 Jam
        local reward = Config.DailyRewards[tier]
        if reward then
            if reward.money > 0 then Player.Functions.AddMoney('cash', reward.money) end
            if reward.coins > 0 then
                local newCoins = (Player.PlayerData.metadata["dc_coin"] or 0) + reward.coins
                MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {newCoins, Player.PlayerData.citizenid})
                Player.Functions.SetMetaData("dc_coin", newCoins)
            end
            
            Player.Functions.SetMetaData("last_vip_claim", currentTime)
            TriggerClientEvent('QBCore:Notify', src, "Berhasil klaim hadiah harian untuk tier " .. tier, "success")
            SendDiscordLog("DAILY REWARD CLAIM", "**Nama:** " .. Player.PlayerData.charinfo.firstname .. "\n**Tier:** " .. tier, 3447003)
        end
    else
        local remaining = math.ceil((86400 - (currentTime - lastClaim)) / 3600)
        TriggerClientEvent('QBCore:Notify', src, "Hadiah harian belum tersedia. Tunggu " .. remaining .. " jam lagi.", "error")
    end
end)

-- ==========================================
-- GACHA SYSTEM (DARKNESS VAULT) + PITY SYSTEM
-- ==========================================

local function GetRandomReward(pityEpic, pityLegend, bannerId)
    local banner = Config.Gacha.banners[bannerId] or Config.Gacha.banners['default']
    local rand = math.random() * 100
    local cumulative = 0
    local selectedRarity = 'common'

    -- Pity Logic: Guaranteed Epic and Legendary (Hard Pity)
    local thresholdLegend = (Config.Gacha.pity and Config.Gacha.pity.legendary) or 50
    local thresholdEpic = (Config.Gacha.pity and Config.Gacha.pity.epic) or 20

    if pityLegend >= thresholdLegend then
        selectedRarity = 'legendary'
    elseif pityEpic >= thresholdEpic then
        selectedRarity = 'epic'
    end

    if selectedRarity == 'common' then
        for rarity, data in pairs(banner.rarities) do
            cumulative = cumulative + data.chance
            if rand <= cumulative then
                selectedRarity = rarity
                break
            end
        end
    end

    -- Pilih Item dari Pool Rarity tersebut
    local pool = (banner.pools and banner.pools[selectedRarity]) or Config.Gacha.pools[selectedRarity]
    local totalWeight = 0
    if not pool or #pool == 0 then
        -- Fallback ke default pool jika banner pool kosong
        pool = Config.Gacha.pools[selectedRarity]
    end
    
    for _, item in ipairs(pool) do totalWeight = totalWeight + (item.weight or 1) end
    
    local itemRand = math.random() * totalWeight
    local weightSum = 0
    for _, item in ipairs(pool) do
        weightSum = weightSum + (item.weight or 1)
        if itemRand <= weightSum then
            return item, selectedRarity
        end
    end
end

RegisterNetEvent('dc_vip:spinGacha', function(bannerId, giftTargetId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    -- Handle Gifting logic
    local isGift = false
    local targetId = tonumber(giftTargetId)
    local targetPlayer = Player

    if targetId and targetId > 0 and targetId ~= src then
        local TPlayer = QBCore.Functions.GetPlayer(targetId)
        if TPlayer then
            targetPlayer = TPlayer
            isGift = true
        else
            return TriggerClientEvent('QBCore:Notify', src, "Target Player ID tidak ditemukan!", "error")
        end
    end

    local activeBanner = bannerId or Config.Gacha.activeBanner
    local banner = Config.Gacha.banners[activeBanner]
    if not banner then return end

    local currentCoin = Player.PlayerData.metadata["dc_coin"] or 0
    if currentCoin >= banner.price then
        -- Pity Counters (Sender's pity is used)
        local pityEpic = (Player.PlayerData.metadata["gacha_pity_epic"] or 0) + 1
        local pityLegend = (Player.PlayerData.metadata["gacha_pity_legend"] or 0) + 1
        
        -- Kurangi Koin (Sender pays)
        local newBalance = currentCoin - banner.price
        Player.Functions.SetMetaData("dc_coin", newBalance)
        MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {newBalance, Player.PlayerData.citizenid})

        -- Tentukan Hadiah
        local reward, rarity = GetRandomReward(pityEpic, pityLegend, activeBanner)
        
        -- Reset Pity berdasarkan Kelangkaan (Sender's pity is updated)
        if rarity == 'legendary' then
            pityLegend = 0
            pityEpic = 0
        elseif rarity == 'epic' then
            pityEpic = 0
        end

        Player.Functions.SetMetaData("gacha_pity_epic", pityEpic)
        Player.Functions.SetMetaData("gacha_pity_legend", pityLegend)

        -- Berikan Hadiah (Recipient gets rewards)
        if reward.type == 'vehicle' then
            local plate = QBCore.Functions.GeneratePlate()
            MySQL.insert('INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, state) VALUES (?, ?, ?, ?, ?, ?, ?)', {
                targetPlayer.PlayerData.license, targetPlayer.PlayerData.citizenid, reward.model, GetHashKey(reward.model), '{}', plate, 1
            })
        elseif reward.type == 'item' then
            targetPlayer.Functions.AddItem(reward.name, 1)
            TriggerClientEvent('inventory:client:ItemBox', targetPlayer.PlayerData.source, QBCore.Shared.Items[reward.name], 'add')
        elseif reward.type == 'money' then
            targetPlayer.Functions.AddMoney('cash', reward.amount)
        end

        -- Notifications
        if isGift then
            TriggerClientEvent('QBCore:Notify', src, "Hadiah Gacha berhasil dikirim ke " .. targetPlayer.PlayerData.charinfo.firstname, "success")
            TriggerClientEvent('QBCore:Notify', targetPlayer.PlayerData.source, "Anda menerima hadiah Gacha (" .. reward.label .. ") dari " .. Player.PlayerData.charinfo.firstname, "success")
            
            TriggerClientEvent('chat:addMessage', targetPlayer.PlayerData.source, {
                template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(255, 0, 68, 0.2); border-radius: 5px; border-left: 4px solid #ff0044;"><b>[GACHA GIFT]</b> {0} telah memberikan Anda hadiah: <span style="color: #ff0044;">{1}</span>!</div>',
                args = { Player.PlayerData.charinfo.firstname, reward.label }
            })
        end

        TriggerClientEvent('dc_vip:gachaResult', src, reward, rarity, newBalance, {
            epic = pityEpic,
            legend = pityLegend
        })
        
        SendDiscordLog("GACHA SPIN" .. (isGift and " GIFT" or ""), "**Giver:** " .. Player.PlayerData.charinfo.firstname .. "\n**Recipient:** " .. targetPlayer.PlayerData.charinfo.firstname .. "\n**Banner:** " .. banner.label .. "\n**Hadiah:** " .. reward.label .. " (" .. rarity .. ")\n**Pity Epic:** " .. pityEpic .. "\n**Pity Legend:** " .. pityLegend, 15844367)
    else
        TriggerClientEvent('QBCore:Notify', src, "Koin tidak cukup untuk Gacha!", "error")
    end
end)

-- ==========================================
-- TRANSFER & GIFT SYSTEM
-- ==========================================

QBCore.Commands.Add("paydc", "Kirim Darkness Coin ke Pemain lain", {{name="id", help="ID Pemain"}, {name="amount", help="Jumlah"}}, true, function(source, args)
    local src = source
    local targetId = tonumber(args[1])
    local amount = tonumber(args[2])
    
    if targetId == src then return TriggerClientEvent('QBCore:Notify', src, "Anda tidak bisa mengirim ke diri sendiri!", "error") end
    if not amount or amount <= 0 then return TriggerClientEvent('QBCore:Notify', src, "Jumlah tidak valid!", "error") end

    local sender = QBCore.Functions.GetPlayer(src)
    local target = QBCore.Functions.GetPlayer(targetId)

    if target then
        local senderCoin = sender.PlayerData.metadata["dc_coin"] or 0
        if senderCoin >= amount then
            local targetCoin = target.PlayerData.metadata["dc_coin"] or 0
            
            -- Update Sender
            sender.Functions.SetMetaData("dc_coin", senderCoin - amount)
            MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {senderCoin - amount, sender.PlayerData.citizenid})
            
            -- Update Target
            target.Functions.SetMetaData("dc_coin", targetCoin + amount)
            MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {targetCoin + amount, target.PlayerData.citizenid})
            
            TriggerClientEvent('QBCore:Notify', src, "Berhasil mengirim " .. amount .. " DC ke " .. target.PlayerData.charinfo.firstname, "success")
            TriggerClientEvent('QBCore:Notify', target.PlayerData.source, "Anda menerima " .. amount .. " DC dari " .. sender.PlayerData.charinfo.firstname, "success")
            
            SendDiscordLog("TRANSFER DC", "**Dari:** " .. sender.PlayerData.charinfo.firstname .. "\n**Ke:** " .. target.PlayerData.charinfo.firstname .. "\n**Jumlah:** " .. amount .. " DC", 3447003)
        else
            TriggerClientEvent('QBCore:Notify', src, "Saldo tidak cukup!", "error")
        end
    else
        TriggerClientEvent('QBCore:Notify', src, "Pemain tidak ditemukan!", "error")
    end
end)

QBCore.Commands.Add("transfervehicle", "Transfer/Gift kepemilikan kendaraan ke Pemain lain", {{name="id", help="ID Pemain"}, {name="plate", help="Nomor Plat Kendaraan"}}, true, function(source, args)
    local src = source
    local targetId = tonumber(args[1])
    local plate = tostring(args[2]):upper()
    
    if targetId == src then return TriggerClientEvent('QBCore:Notify', src, "Anda tidak bisa mengirim ke diri sendiri!", "error") end

    local sender = QBCore.Functions.GetPlayer(src)
    local target = QBCore.Functions.GetPlayer(targetId)

    if target then
        -- Cek kepemilikan di database
        MySQL.single('SELECT citizenid, vehicle FROM player_vehicles WHERE plate = ?', {plate}, function(result)
            if result then
                if result.citizenid == sender.PlayerData.citizenid then
                    -- Transfer kepemilikan
                    MySQL.update('UPDATE player_vehicles SET citizenid = ?, license = ? WHERE plate = ?', {
                        target.PlayerData.citizenid,
                        target.PlayerData.license,
                        plate
                    }, function(affected)
                        if affected > 0 then
                            TriggerClientEvent('QBCore:Notify', src, "Berhasil mentransfer " .. result.vehicle .. " [" .. plate .. "] ke " .. target.PlayerData.charinfo.firstname, "success")
                            TriggerClientEvent('QBCore:Notify', target.PlayerData.source, "Anda menerima hadiah kendaraan " .. result.vehicle .. " [" .. plate .. "] dari " .. sender.PlayerData.charinfo.firstname, "success")
                            SendDiscordLog("VEHICLE TRANSFER", "**Dari:** " .. sender.PlayerData.charinfo.firstname .. "\n**Ke:** " .. target.PlayerData.charinfo.firstname .. "\n**Kendaraan:** " .. result.vehicle .. "\n**Plat:** " .. plate, 3447003)
                        else
                            TriggerClientEvent('QBCore:Notify', src, "Gagal memproses transfer!", "error")
                        end
                    end)
                else
                    TriggerClientEvent('QBCore:Notify', src, "Kendaraan ini bukan milik Anda!", "error")
                end
            else
                TriggerClientEvent('QBCore:Notify', src, "Plat nomor tidak ditemukan di database!", "error")
            end
        end)
    else
        TriggerClientEvent('QBCore:Notify', src, "Pemain tidak ditemukan!", "error")
    end
end)

-- ==========================================
-- ADMIN COMMANDS (EXTENDED)
-- ==========================================

QBCore.Commands.Add("givedc", "Berikan Darkness Coin ke Pemain", {{name="id", help="ID Pemain"}, {name="amount", help="Jumlah"}}, true, function(source, args)
    local targetId = tonumber(args[1])
    local amount = tonumber(args[2])
    local target = QBCore.Functions.GetPlayer(targetId)

    if target then
        local currentCoin = target.PlayerData.metadata["dc_coin"] or 0
        local newCoin = currentCoin + amount
        MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {newCoin, target.PlayerData.citizenid})
        target.Functions.SetMetaData("dc_coin", newCoin)
        TriggerClientEvent('QBCore:Notify', target.PlayerData.source, "Anda menerima " .. amount .. " DC dari Admin", "success")
        SendDiscordLog("ADMIN GIVE DC", "**Admin:** " .. GetPlayerName(source) .. "\n**Target:** " .. target.PlayerData.charinfo.firstname .. "\n**Jumlah:** " .. amount .. " DC", 3066993)
    end
end, "admin")

QBCore.Commands.Add("removedc", "Tarik Darkness Coin dari Pemain", {{name="id", help="ID Pemain"}, {name="amount", help="Jumlah"}}, true, function(source, args)
    local targetId = tonumber(args[1])
    local amount = tonumber(args[2])
    local target = QBCore.Functions.GetPlayer(targetId)

    if target then
        local currentCoin = target.PlayerData.metadata["dc_coin"] or 0
        local newCoin = math.max(0, currentCoin - amount)
        MySQL.update('UPDATE players SET dc_coin = ? WHERE citizenid = ?', {newCoin, target.PlayerData.citizenid})
        target.Functions.SetMetaData("dc_coin", newCoin)
        TriggerClientEvent('QBCore:Notify', target.PlayerData.source, amount .. " DC telah ditarik dari saldo Anda", "error")
    end
end, "admin")

QBCore.Commands.Add("checkdc", "Cek Saldo DC Pemain", {{name="id", help="ID Pemain"}}, true, function(source, args)
    local targetId = tonumber(args[1])
    local target = QBCore.Functions.GetPlayer(targetId)
    if target then
        local coins = target.PlayerData.metadata["dc_coin"] or 0
        TriggerClientEvent('QBCore:Notify', source, "Saldo " .. target.PlayerData.charinfo.firstname .. ": " .. coins .. " DC", "primary")
    end
end, "admin")

QBCore.Commands.Add("setvip", "Set Status VIP Pemain (Admin Only)", {{name="id", help="ID Pemain"}, {name="tier", help="bronze/silver/gold/platinum"}, {name="days", help="Durasi Hari"}}, true, function(source, args)
    local targetId = tonumber(args[1])
    local tier = tostring(args[2]):lower()
    local days = tonumber(args[3])
    local target = QBCore.Functions.GetPlayer(targetId)

    if target and Config.VIPTiers[tier] then
        local expireDate = os.time() + (days * 86400)
        MySQL.update('UPDATE players SET vip_tier = ?, vip_expire = FROM_UNIXTIME(?) WHERE citizenid = ?', {tier, expireDate, target.PlayerData.citizenid})
        target.Functions.SetMetaData("vip_tier", tier)
        TriggerClientEvent('QBCore:Notify', target.PlayerData.source, "Status VIP Anda diset ke " .. tier .. " untuk " .. days .. " hari", "success")
        SendDiscordLog("ADMIN SET VIP", "**Admin:** " .. GetPlayerName(source) .. "\n**Target:** " .. target.PlayerData.charinfo.firstname .. "\n**Tier:** " .. tier, 15105570)
    end
end, "admin")

-- ==========================================
-- AUTOMATED BANNER ROTATION SYSTEM
-- ==========================================

local currentRotationIndex = -1
local nextRotationTime = 0

CreateThread(function()
    while true do
        local interval = (Config.Gacha.rotationInterval or 24) * 3600
        local currentTime = os.time()
        local index = math.floor(currentTime / interval)
        nextRotationTime = (index + 1) * interval
        
        if index ~= currentRotationIndex then
            currentRotationIndex = index
            local bannerList = Config.Gacha.rotationBanners
            if bannerList and #bannerList > 0 then
                local listIndex = (index % #bannerList) + 1
                local newBannerId = bannerList[listIndex]
                
                if Config.Gacha.activeBanner ~= newBannerId then
                    Config.Gacha.activeBanner = newBannerId
                    local bannerData = Config.Gacha.banners[newBannerId]
                    
                    print("^2[GACHA]^7 Rotated to banner: " .. newBannerId)
                    
                    -- Notify all players
                    TriggerClientEvent('chat:addMessage', -1, {
                        template = '<div style="padding: 1vw; margin: 0.5vw; background-color: rgba(0, 0, 0, 0.8); border: 1px solid #ff0044; border-left: 5px solid #ff0044; border-radius: 8px; box-shadow: 0 0 15px rgba(255, 0, 68, 0.3);"><div style="color: #ff0044; font-weight: bold; font-family: Orbitron; font-size: 1.1em; margin-bottom: 5px;">[GACHA SYSTEM ANNOUNCEMENT]</div><div style="color: #fff; font-size: 1.2em; font-weight: 500;">Banner: {0}</div><div style="color: #aaa; font-style: italic; margin-top: 5px; font-size: 0.9em;">"{1}"</div></div>',
                        args = { bannerData.label, bannerData.description or "Uji keberuntunganmu sekarang!" }
                    })

                    TriggerClientEvent('dc_vip:updateBanner', -1, newBannerId, nextRotationTime)
                    
                    SendDiscordLog("GACHA ROTATION", "Banner has rotated to: **" .. bannerData.label .. "** (" .. newBannerId .. ")", 15158332)
                end
            end
        end
        
        Wait(60000) -- Check every minute
    end
end)
