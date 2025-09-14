# WebRTC ScreenCast (PC → móvil) con opción de cámara

Proyecto minimalista para ver la pantalla de tu computadora en vivo desde tu teléfono, con HTTPS mediante un túnel público y opción de añadir tu cámara (picture-in-picture).

## Requisitos
- Node.js LTS
- Navegador moderno (Chrome/Edge, Safari móvil)

## Instalación rápida
```bash
npm install
npm start
# en otra terminal
npx localtunnel --port 3000
```
Abre en el PC: `https://TU_SUBDOMINIO.loca.lt/sender.html`  
Abre en el móvil: `https://TU_SUBDOMINIO.loca.lt/viewer.html?room=MI_SALA`

## Scripts útiles (Windows PowerShell)
```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

## Despliegue con GitHub + Railway (opcional)
1. Autentícate:
```powershell
winget install GitHub.cli
gh auth login
```
2. Inicializa y sube el repo:
```powershell
git init
git add .
git commit -m "Initial commit: WebRTC ScreenCast"
git branch -M main
gh repo create webrtc-screencast-pc-movil --public --source=. --remote=origin --push
```
3. En Railway: crear proyecto → Deploy from GitHub → seleccionar repo → Start command: `node server.js` (PORT=3000 o variable $PORT).

## Notas
- `getDisplayMedia` exige HTTPS (usa LocalTunnel o Ngrok).
- Para NAT estrictos, añade un TURN server a `iceServers`.
