#!/usr/bin/env python3
"""Assemble web/index.html (site, PWA, Android, Windows) à partir de src/. Usage : python3 tools/build_web.py"""
import re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
src = R / 'src'
shell = (src / 'shell.html').read_text()
i = shell.index('<style>'); head = shell[:i]; rest = shell[i:]
j = rest.index('</style>') + 8; style, body = rest[:j], rest[j:]
js = '\n'.join((src / f).read_text() for f in ['core.js', 'recipes.js', 'app.js', 'options.js', 'cloud.js', 'boot.js'])
reset = "<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font-size:14px;font-family:system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>"
meta = ('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#2F6B4F"><meta name="description" content="Recettes anti-gaspi à partir de ce qu’il y a dans votre frigo.">'
        '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg" type="image/svg+xml">'
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes">'
        '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Tambouille">'
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">')
sw = "<script>if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}</script>"
html = (f'<!doctype html><html lang="fr"><head>{meta}{reset}{head}{style}</head><body>{body}'
        f'<script src="vendor/supabase.js"></script><script>{js}</script>{sw}</body></html>')
html = '\n'.join(l.strip() for l in html.split('\n') if l.strip() and not re.fullmatch(r'/\*.*\*/', l.strip()))
(R / 'web' / 'index.html').write_text(html)
print('web/index.html', len(html.encode()), 'octets')
