Config = {}

-- Nama Komunitas
Config.CommunityName = "DARKNESS COMMUNITY INDONESIA"
Config.CurrencyName = "Darkness Coin"
Config.CurrencyShort = "DC"

-- Discord Webhook untuk Logs
Config.Webhook = "MASUKKAN_WEBHOOK_ANDA_DISINI"

-- Tier VIP & Benefits (Struktur Data)
Config.VIPTiers = {
    ['bronze_7d'] = {
        label = "7-Day Bronze VIP",
        price = 150,
        duration = 7,
        salary_multiplier = 1.1,
        garage_slots = 2,
        discount = 0.02,
        color = {205, 127, 50},
        tag = "[BRONZE-7D]"
    },
    ['bronze'] = {
        label = "Bronze VIP",
        price = 500, -- DC
        duration = 30, -- Hari
        salary_multiplier = 1.2, -- Gaji x1.2
        garage_slots = 5,
        discount = 0.05, -- 5% Diskon di toko umum (perlu integrasi ke script toko lain)
        color = {205, 127, 50}, -- Bronze Color (RGB)
        tag = "[BRONZE]"
    },
    ['silver'] = {
        label = "Silver VIP",
        price = 1000,
        duration = 30,
        salary_multiplier = 1.5,
        garage_slots = 10,
        discount = 0.10,
        color = {192, 192, 192}, -- Silver Color
        tag = "[SILVER]"
    },
    ['gold'] = {
        label = "Gold VIP",
        price = 2500,
        duration = 30,
        salary_multiplier = 2.0,
        garage_slots = 20,
        discount = 0.15,
        color = {255, 215, 0}, -- Gold Color
        tag = "[GOLD]"
    },
    ['platinum'] = {
        label = "Platinum VIP",
        price = 5000,
        duration = 30,
        salary_multiplier = 3.0,
        garage_slots = 50,
        discount = 0.25,
        color = {0, 255, 255}, -- Platinum/Cyan Color
        tag = "[PLATINUM]"
    }
}

-- Pengaturan Visual
Config.EnableAboveHead = true -- Tampilkan teks di atas kepala
Config.DrawDistance = 15.0    -- Jarak maksimal terlihat (meter)

-- Pengaturan Gacha (Darkness Vault)
Config.Gacha = {
    price = 250, -- DC per spin (default)
    activeBanner = "default", 
    rotationInterval = 24, -- Jam (Contoh: setiap 24 jam rotasi)
    rotationBanners = {"default", "limited_hypercar", "luxury_accessories"}, -- List banner yang akan dirotuasi
    pity = {
        epic = 20,       
        legendary = 50,  
    },
    banners = {
        ['default'] = {
            label = "Standard Vault",
            description = "Koleksi item klasik Darkness Community.",
            price = 250,
            image = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400",
            rarities = {
                ['legendary'] = { chance = 2, label = "LEGENDARY" },
                ['epic']      = { chance = 8, label = "EPIC" },
                ['rare']      = { chance = 25, label = "RARE" },
                ['common']    = { chance = 65, label = "COMMON" },
            },
            pools = {
                ['legendary'] = {
                    { type = 'money', amount = 1000000, label = '$1.000.000 Cash', weight = 1 },
                    { type = 'vehicle', model = 'pista', label = 'Ferrari Pista', weight = 0.5 },
                    { type = 'vehicle', model = 'r8', label = 'Audi R8 V10', weight = 0.5 },
                },
                ['epic'] = {
                    { type = 'money', amount = 250000, label = '$250.000 Cash', weight = 2 },
                    { type = 'item', name = 'weapon_pistol_heavy', label = 'Heavy Pistol', weight = 3 },
                    { type = 'item', name = 'phone_ultra', label = 'iPhone 15 Ultra', weight = 2 },
                }
            }
        },
        ['limited_hypercar'] = {
            label = "Hypercar Special",
            description = "Kesempatan terbatas mendapatkan mobil tercepat!",
            price = 500,
            endsAt = "2026-06-01 00:00:00",
            featured = {"Ferrari Pista", "Lamborghini Aventador", "Bugatti Chiron", "McLaren P1"},
            image = "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=400",
            rarities = {
                ['legendary'] = { chance = 5, label = "LEGENDARY" }, 
                ['epic']      = { chance = 15, label = "EPIC" },
                ['rare']      = { chance = 30, label = "RARE" },
                ['common']    = { chance = 50, label = "COMMON" },
            },
            pools = {
                ['legendary'] = {
                    { type = 'vehicle', model = 'pista', label = 'Ferrari Pista', weight = 1 },
                    { type = 'vehicle', model = 'aventador', label = 'Lamborghini Aventador', weight = 1 },
                    { type = 'vehicle', model = 'chiron', label = 'Bugatti Chiron', weight = 0.5 },
                    { type = 'vehicle', model = 'p1', label = 'McLaren P1', weight = 0.5 },
                },
                ['epic'] = {
                    { type = 'vehicle', model = 'gtr', label = 'Nissan GTR R35', weight = 2 },
                    { type = 'vehicle', model = 'r8', label = 'Audi R8 V10', weight = 2 },
                    { type = 'money', amount = 1000000, label = '$1.000.000 Cash', weight = 1 },
                }
            }
        },
        ['luxury_accessories'] = {
            label = "Elite Accessories",
            description = "Tingkatkan gaya hidupmu dengan item-item eksklusif.",
            price = 150,
            image = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400",
            rarities = {
                ['legendary'] = { chance = 1, label = "LEGENDARY" },
                ['epic']      = { chance = 5, label = "EPIC" },
                ['rare']      = { chance = 20, label = "RARE" },
                ['common']    = { chance = 74, label = "COMMON" },
            },
            pools = {
                ['legendary'] = {
                    { type = 'item', name = 'diamond_watch', label = 'Diamond Watch', weight = 1 },
                    { type = 'item', name = 'luxury_card', label = 'Platinum Membership Car', weight = 1 },
                },
                ['epic'] = {
                    { type = 'item', name = 'gold_chain', label = 'Gold Chain', weight = 5 },
                    { type = 'item', name = 'designer_bag', label = 'Designer Bag', weight = 4 },
                }
            }
        }
    },
    pools = {
        ['legendary'] = {
            { type = 'vehicle', model = 'pista', label = 'Ferrari Pista', weight = 1 },
            { type = 'vehicle', model = 'aventador', label = 'Lamborghini Aventador', weight = 1 },
            { type = 'vehicle', model = 'chiron', label = 'Bugatti Chiron', weight = 0.5 },
            { type = 'money', amount = 2500000, label = '$2.500.000 Cash', weight = 2 },
            { type = 'item', name = 'premium_case', label = 'Mystic Vault Case', weight = 1.5 },
        },
        ['epic'] = {
            { type = 'vehicle', model = 'gtr', label = 'Nissan GTR Nismo', weight = 2 },
            { type = 'vehicle', model = 'r8', label = 'Audi R8 V10', weight = 2 },
            { type = 'money', amount = 500000, label = '$500.000 Cash', weight = 5 },
            { type = 'item', name = 'weapon_pistol_heavy', label = 'Heavy Pistol', weight = 5 },
            { type = 'item', name = 'luxury_card', label = 'Diamond Membership', weight = 3 },
            { type = 'item', name = 'gold_chain', label = 'Solid Gold Chain', weight = 6 },
        },
        ['rare'] = {
            { type = 'money', amount = 100000, label = '$100.000 Cash', weight = 15 },
            { type = 'item', name = 'phone_ultra', label = 'iPhone 15 Ultra', weight = 20 },
            { type = 'item', name = 'tablet_pro', label = 'iPad Pro M2', weight = 15 },
            { type = 'item', name = 'armor_heavy', label = 'Heavy Armor', weight = 25 },
        },
        ['common'] = {
            { type = 'money', amount = 10000, label = '$10.000 Cash', weight = 50 },
            { type = 'item', name = 'sandwich', label = 'Premium Sandwich', weight = 80 },
            { type = 'item', name = 'water', label = 'Mineral Water', weight = 80 },
            { type = 'item', name = 'coffee', label = 'Hot Coffee', weight = 60 },
            { type = 'item', name = 'bandage', label = 'First Aid Bandage', weight = 70 },
        }
    }
}

-- Kategori & Isi Toko
Config.Shop = {
    ['vehicles'] = {
        label = "Kendaraan Eksklusif",
        items = {
            { model = 'pista', label = 'Ferrari Pista', price = 5000, type = 'vehicle', minVip = 'gold' },
            { model = 'gtr', label = 'Nissan GTR Nismo', price = 4500, type = 'vehicle', minVip = 'silver' },
        }
    },
    ['items'] = {
        label = "Item Langka",
        items = {
            { name = 'weapon_pistol', label = 'Pistol Vintage', price = 200, type = 'item', count = 1, minVip = 'bronze' },
            { name = 'phone', label = 'iPhone 15 Pro', price = 50, type = 'item', count = 1 },
        }
    },
    ['money'] = {
        label = "Tukar Uang",
        items = {
            { amount = 100000, label = '$100.000 Cash', price = 100, type = 'money' },
            { amount = 500000, label = '$500.000 Cash', price = 450, type = 'money', minVip = 'gold' },
        }
    }
}

-- Discord Bot Integration
Config.Discord = {
    enabled = true,
    token = "YOUR_DISCORD_BOT_TOKEN_HERE", -- Masukkan Token Bot Discord Anda
    guildId = "YOUR_GUILD_ID", -- ID Discord Server Anda
    roles = {
        ['bronze'] = "ROLE_ID_BRONZE",
        ['silver'] = "ROLE_ID_SILVER",
        ['gold']   = "ROLE_ID_GOLD",
        ['platinum'] = "ROLE_ID_PLATINUM"
    }
}

-- Hadiah Harian Berdasarkan VIP
Config.DailyRewards = {
    ['none']     = { money = 2000, coins = 0 },
    ['bronze_7d'] = { money = 3000, coins = 0 },
    ['bronze']   = { money = 5000, coins = 0 },
    ['silver']   = { money = 15000, coins = 2 },
    ['gold']     = { money = 25000, coins = 5 },
    ['platinum'] = { money = 50000, coins = 10 },
}
