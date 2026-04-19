# CLAUDE.md — Projekt Mjölnir (Codename: Hammerfall)

## Vision

Mjölnir ist ein lokales Web-UI zur Verwaltung von tmux- und Claude-Code-Sessions auf einem Linux-Rechner (Ryzen/Ubuntu). Erreichbar über Tailscale vom Handy (Termux-Browser oder mobiler Browser). Ein Knopf, alles unter Kontrolle — Schluss mit kryptischen Terminal-Befehlen.

## Warum

Der Entwickler (Chris) arbeitet mit Claude Code in tmux-Sessions auf einem stationären Ryzen-Rechner. Zugriff erfolgt oft mobil über Tailscale + SSH. Das Problem: tmux-Befehle sind kryptisch, Session-Management ist fummelig, und vom Handy aus fehlt die Übersicht. Mjölnir löst das mit einem simplen Browser-UI.

## Tech-Stack

- **Backend:** Python 3.12+, FastAPI, uvicorn
- **Frontend:** Vanilla HTML + CSS + JS (kein Framework — das hier ist ein Tool, kein SPA)
- **Session-Steuerung:** subprocess-Calls auf `tmux` CLI
- **Datenbank:** Keine im MVP. Optional später WAL-SQLite für Session-History
- **Deployment:** Läuft lokal auf dem Ryzen, erreichbar über Tailscale-IP
- **Port:** 8855 (konfigurierbar via .env)

## Projektstruktur

```
mjolnir/
├── CLAUDE.md              # Diese Datei
├── CHANGELOG.md           # Append-only, ein Eintrag pro Patch
├── .env                   # PORT, HOST, etc.
├── requirements.txt       # fastapi, uvicorn
├── main.py                # FastAPI-App, alle Routes
├── tmux_manager.py        # Wrapper um tmux subprocess-Calls
├── static/
│   ├── index.html         # Single-Page UI
│   ├── style.css          # Styling
│   └── app.js             # Frontend-Logik
└── README.md              # Setup-Anleitung
```

## Architektur

### Backend (FastAPI)

`tmux_manager.py` kapselt alle tmux-Interaktionen:

```python
# Kernfunktionen:
list_sessions()        → Liste aller tmux-Sessions mit Status
create_session(name)   → Neue benannte tmux-Session starten
kill_session(name)     → Session beenden
read_output(name, n)   → Letzte n Zeilen Output einer Session lesen
send_keys(name, cmd)   → Befehl an eine Session senden
```

### API-Endpoints

```
GET    /api/sessions              → Alle Sessions auflisten
POST   /api/sessions              → Neue Session erstellen {name: str}
DELETE /api/sessions/{name}       → Session beenden
GET    /api/sessions/{name}/output → Letzten Output lesen (?lines=50)
POST   /api/sessions/{name}/send   → Befehl senden {command: str}
GET    /api/health                 → Health-Check
```

### Frontend

Einzelne Seite mit:
- **Session-Liste:** Karten/Zeilen für jede tmux-Session. Name, Status (läuft/idle), letzte Aktivität.
- **Aktions-Buttons:** "Neue Session", "Output anzeigen", "Beenden" — große, mobilfreundliche Touch-Targets.
- **Output-Viewer:** Scrollbare Textbox mit den letzten n Zeilen einer Session. Auto-Refresh per Polling (alle 3–5 Sekunden).
- **Befehl-senden-Feld:** Textinput + Send-Button, um einen Befehl an eine Session zu schicken.

**Design-Richtung:** Dunkel, nordisch, industriell. Monospace-Font. Farbschema: Dunkler Hintergrund (#0a0a0f), gedämpfte Akzente in Eisblau (#7eb8da) und Bernstein (#d4a847) für Warnungen. Keine Verspieltheiten — das ist ein Werkzeug, es soll nach Schmiede aussehen, nicht nach Spielplatz.

**Mobile-first:** Alles muss auf einem Handy-Bildschirm benutzbar sein. Große Buttons (min. 48px Touch-Targets), kein Hover-abhängiges UI.

## Konventionen

- **CHANGELOG.md:** Jeder Patch bekommt einen Eintrag. Format: `## [Patch-XX] — YYYY-MM-DD` mit Zusammenfassung was geändert wurde.
- **Kein Auth im MVP:** Mjölnir läuft nur im Tailscale-Netz, das ist bereits ein privates VPN. Auth kommt ggf. in Phase 2.
- **Error Handling:** Jeder subprocess-Call wird in try/except gewrappt. Keine stillen Fehler — alles wird ans Frontend kommuniziert.
- **Encoding:** UTF-8 überall. tmux-Output kann ANSI-Escape-Codes enthalten → im Frontend entweder strippen oder mit einer kleinen Lib rendern.

## Entwicklungs-Phasen

### Phase 1 — MVP (Patch 01–03)
- [ ] FastAPI-Grundgerüst mit Health-Endpoint
- [ ] tmux_manager.py mit list/create/kill
- [ ] Frontend: Session-Liste + Neue-Session-Button
- [ ] Frontend: Session beenden

### Phase 2 — Interaktion (Patch 04–06)
- [ ] Output-Viewer (letzte n Zeilen einer Session lesen)
- [ ] Befehl an Session senden
- [ ] Auto-Refresh / Polling

### Phase 3 — Komfort (Patch 07+)
- [ ] Session-Templates (z.B. "Neue Claude-Code-Session in Zerberus-Pfad")
- [ ] ANSI-zu-HTML Rendering im Output-Viewer
- [ ] Syncthing-Status anzeigen
- [ ] Notifications (Session fertig / Error)
- [ ] Optional: WAL-SQLite für Session-History

## Sicherheitshinweise

- `send_keys` ist mächtig — erlaubt beliebige Befehle. Im MVP akzeptabel weil Tailscale-only. Für Phase 2+: Input-Validation und evtl. Allowlist.
- Keine Secrets in .env commiten falls das jemals in ein Repo geht.
- tmux-Sessions laufen als der User, der uvicorn startet. Keine Root-Rechte nötig oder erwünscht.

## Namensgebung

Nordisch. Das Projekt heißt Mjölnir, der Codename ist Hammerfall. Session-Templates können nordische Namen bekommen. Das Frontend darf einen subtilen Hammer-Icon haben. Nicht übertreiben — es ist ein Tool, kein Themenpark.
