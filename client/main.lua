local QBCore = exports['qb-core']:GetCoreObject()
local isMenuOpen = false

-- ==========================================
-- NUI TOGGLE
-- ==========================================

-- ==========================================
-- VIP VISUAL INDICATORS (Above Head & Chat)
-- ==========================================

local function DrawText3D(coords, text, color)
    local onScreen, _x, _y = World3dToScreen2d(coords.x, coords.y, coords.z + 1.0)
    local px, py, pz = table.unpack(GetGameplayCamCoords())
    
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(color[1], color[2], color[3], 215)
    SetTextEntry("STRING")
    SetTextCentre(1)
    AddTextComponentString(text)
    DrawText(_x, _y)
    local factor = (string.len(text)) / 370
    DrawRect(_x, _y + 0.0125, 0.15 + factor, 0.03, 0, 0, 0, 75)
end

-- Simpan status VIP pemain yang ada di sekitar (untuk optimasi)
local nearbyVIPs = {}

CreateThread(function()
    while true do
        local wait = 1000
        if Config.EnableAboveHead then
            local myCoords = GetEntityCoords(PlayerPedId())
            local players = GetActivePlayers()
            
            for _, player in ipairs(players) do
                local targetPed = GetPlayerPed(player)
                local targetCoords = GetEntityCoords(targetPed)
                local dist = #(myCoords - targetCoords)
                
                if dist < Config.DrawDistance and targetPed ~= PlayerPedId() then
                    local serverId = GetPlayerServerId(player)
                    -- Request data VIP jika belum ada cache (Event ini harus dibuat di server)
                    if nearbyVIPs[serverId] and nearbyVIPs[serverId] ~= 'none' then
                        wait = 0
                        local tier = nearbyVIPs[serverId]
                        local tierData = Config.VIPTiers[tier]
                        if tierData then
                            DrawText3D(targetCoords, tierData.tag .. " VIP", tierData.color)
                        end
                    end
                end
            end
        end
        Wait(wait)
    end
end)

-- Update cache VIP dari server
RegisterNetEvent('dc_vip:updateNearbyCache', function(serverId, tier)
    nearbyVIPs[serverId] = tier
end)

-- Ketika menu dibuka, trigger server untuk broadcast status kita ke orang lain
local function ToggleMenu(status)
    isMenuOpen = status
    SetNuiFocus(status, status)
    if status then
        QBCore.Functions.TriggerCallback('dc_vip:getServerData', function(data)
            local gachaConfig = Config.Gacha
            if data and data.activeBanner then
                gachaConfig.activeBanner = data.activeBanner
            end
            
            SendNUIMessage({
                action = "open",
                coins = data.coins,
                vip = data.vip,
                shop = Config.Shop,
                tiers = Config.VIPTiers,
                gacha = gachaConfig,
                nextRotation = data.nextRotation,
                isAdmin = data.isAdmin,
                pity = data.pity or { epic = 0, legend = 0 },
                userName = QBCore.Functions.GetPlayerData().charinfo.firstname
            })
        end)
    else
        SendNUIMessage({ action = "close" })
    end
end

-- Keybind untuk buka menu (Misal tombol F10 atau melalui command)
RegisterCommand('darkness_shop', function()
    ToggleMenu(not isMenuOpen)
end)

-- callback dari NUI ketika user menutup menu
RegisterNUICallback('closeMenu', function()
    ToggleMenu(false)
end)

-- callback dari NUI ketika user membeli sesuatu
RegisterNUICallback('buyItem', function(data, cb)
    TriggerServerEvent('dc_vip:purchaseItem', data)
    cb('ok')
end)

RegisterNUICallback('spinGacha', function(data, cb)
    TriggerServerEvent('dc_vip:spinGacha', data.bannerId, data.giftTargetId)
    cb('ok')
end)

-- Daily Reward Claim
RegisterNUICallback('claimDailyBonus', function(data, cb)
    QBCore.Functions.TriggerCallback('dc_vip:claimDailyReward', function(success, result)
        cb({success = success, result = result})
    end)
end)

-- Admin Toggle Banner
RegisterNUICallback('adminToggleBanner', function(data, cb)
    TriggerServerEvent('dc_vip:adminToggleBanner', data.bannerId)
    cb('ok')
end)

-- Admin Give DC
RegisterNUICallback('adminGiveDC', function(data, cb)
    TriggerServerEvent('dc_vip:adminGiveDC', data.targetId, data.amount)
    cb('ok')
end)

RegisterNetEvent('dc_vip:updateBanner', function(bannerId, nextRotation)
    Config.Gacha.activeBanner = bannerId
    SendNUIMessage({
        action = "updateBanner",
        bannerId = bannerId,
        nextRotation = nextRotation
    })
end)

-- Event dari server untuk hasil gacha
RegisterNetEvent('dc_vip:gachaResult', function(reward, rarity, coins, pity)
    SendNUIMessage({
        action = "gachaResult",
        reward = reward,
        rarity = rarity,
        coins = coins,
        pity = pity
    })
end)

-- ==========================================
-- VIP BENEFITS (Contoh Implementasi)
-- ==========================================

-- Menambahkan multiplier ke gaji (Opsional - Biasanya di qb-paycheck)
-- Di sini hanya sebagai referensi integrasi metadata
CreateThread(function()
    while true do
        local Player = QBCore.Functions.GetPlayerData()
        if Player and Player.metadata and Player.metadata["vip_tier"] ~= "none" then
            -- Tier logic bisa dihandle di sini jika ada visual khusus atau speed boost
        end
        Wait(10000)
    end
end)
