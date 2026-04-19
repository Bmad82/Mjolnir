# Mjölnir — Hammerfall

Web-UI für tmux Session-Management. Läuft lokal, erreichbar über Tailscale.

## Setup

```bash
pip install -r requirements.txt
python main.py
```

Dann im Browser: `http://localhost:8855` (oder Tailscale-IP).

## .env

```
HOST=0.0.0.0
PORT=8855
```
