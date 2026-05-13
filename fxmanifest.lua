fx_version 'cerulean'
game 'gta5'

description 'Darkness Community Indonesia - Advanced VIP System'
version '1.0.0'
author 'Google AI Studio'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/assets/*.png'
}

client_scripts {
    'config.lua',
    'client/main.lua'
}

server_scripts {
    '@oxmysql/lib/utils.lua',
    'config.lua',
    'server/main.lua'
}

lua54 'yes'
