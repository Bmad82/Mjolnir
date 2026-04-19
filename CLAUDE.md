# CLAUDE.md — Projekt Mjölnir (Codename: Hammerfall)

## Vision

Mjölnir ist das **Cockpit** für Claude Code auf dem Ryzen. Es ergänzt Anthropics eigenes "Remote Control" Feature (das die laufende Session spiegelt) um alles, was Remote Control NICHT kann: neue Sessions starten, Projekte auswählen, Modell wechseln, Berechtigungen setzen — alles per Knopfdruck statt Slash-Befehle.

**Die Arbeitsteilung:**
- **Remote Control** (von Anthropic) = der Spiegel in die laufende Session. Zeigt Output, erlaubt Eingaben.
- **Mjölnir** (dieses Projekt) = der Launcher und Kommandostand drumherum. Startet Sessions, konfiguriert sie, navigiert zwischen Projekten. Springt dann in Remote Control rein.

**SCOPE-WARNUNG:** Mjölnir baut NICHTS von Claude Code nach. Keine KI-Integration, keine Code-Ausführung, keine Git-Logik, keinen Output-Viewer (das macht Remote Control). Mjölnir ist eine Sammlung von Knöpfen. Hinter jedem Knopf steckt ein CLI-Befehl oder tmux-Kommando. Mjölnir übersetzt "Knopf drücken" in "Befehl ausführen". Mehr nicht.

## Warum

Der Entwickler (Chris) arbeitet mit Claude Code in tmux-Sessions auf einem stationären Ryzen-Rechner (Ubuntu). Zugriff erfolgt mobil über Tailscale. Remote Control spiegelt laufende Sessions — aber:
- Neue Sessions starten geht nicht über Remote Control
- Modell wechseln erfordert `/model opus-4.7` tippen
- Berechtigungen umgehen erfordert CLI-Flags
- Projekt wechseln erfordert Terminal-Befehle
- Alles erfordert kryptische Slash-Befehle oder CLI-Flags

Chris will Knöpfe. Große, mobile, fingerfreundliche Knöpfe. Mjölnir liefert die.

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
├── README.md              # Lebendiges Handbuch — jeden Button dokumentiert
├── start_mjolnir.sh       # Startskript (pip install + uvicorn)
├── .env                   # PORT, HOST, etc.
├── requirements.txt       # fastapi, uvicorn
├── main.py                # FastAPI-App, alle Routes
├── tmux_manager.py        # Wrapper um tmux subprocess-Calls
├── static/
│   ├── index.html         # Single-Page UI
│   ├── style.css          # Styling
│   └── app.js             # Frontend-Logik
```

## Architektur

### Wie es funktioniert

Mjölnir läuft als FastAPI-Server auf dem Ryzen. Das Frontend zeigt Buttons. Jeder Button löst einen API-Call aus. Der API-Call führt einen CLI-Befehl via subprocess aus. Das ist alles.

```
[Handy-Browser] → [Tailscale] → [FastAPI auf Ryzen] → [subprocess: tmux/claude CLI]
```

### Backend (FastAPI)

`tmux_manager.py` kapselt alle tmux-Interaktionen:

```python
# Session-Management:
list_sessions()                          → Alle tmux-Sessions auflisten
create_claude_session(name, project, model, flags)  → Neue Claude-Code-Session starten
kill_session(name)                       → Session beenden
send_slash_command(name, command)         → Slash-Befehl an laufende Session senden
enable_remote_control(name)              → /rc in der Session ausführen

# Projekt-/Ordner-Management:
list_projects()                          → Verfügbare Projektordner auflisten
list_recent_projects()                   → Zuletzt verwendete Projekte

# Info:
get_session_status(name)                 → Status einer Session (aktiv/idle)
```

### API-Endpoints

```
GET    /api/sessions                     → Alle Sessions auflisten
POST   /api/sessions                     → Neue Session erstellen
                                            {name, project_path, model, bypass_permissions}
DELETE /api/sessions/{name}              → Session beenden
POST   /api/sessions/{name}/rc           → Remote Control aktivieren
POST   /api/sessions/{name}/command      → Slash-Befehl senden
GET    /api/projects                     → Projektordner auflisten
GET    /api/models                       → Verfügbare Modelle
GET    /api/health                       → Health-Check
```

### Frontend — Die Knöpfe

Das UI ist eine einzige Seite mit klaren Sektionen:

**1. Session-Launcher (oben, prominent)**
- Dropdown: Projektordner auswählen (Zerberus, Mjölnir, Rosa, etc.)
- Dropdown: Modell auswählen (Opus 4.7, Opus 4.7 1M, Sonnet 4.6, Haiku 4.5)
- Toggle: Berechtigungen umgehen (ja/nein)
- Toggle: Plan-Modus / Auto-Modus
- **GROSSER BUTTON: "⚡ Neue Session starten"**

**2. Aktive Sessions (Mitte)**
- Karten für jede laufende tmux-Session
- Pro Karte: Name, Projekt, Modell, Status
- Buttons pro Karte:
  - "🔗 Remote Control öffnen" → aktiviert /rc und öffnet claude.ai/code
  - "🗑️ Session beenden"
  - "📌 Anpinnen" (für Favoriten)

**3. Angepinnte / Letzte Sessions (unten)**
- Schnellzugriff auf häufig genutzte Projekte
- "Zuletzt verwendet" Liste

**4. Quick-Links (Footer oder Sidebar)**
- "💬 Chat öffnen" → Link zu claude.ai/chat
- "⚙️ Einstellungen" (später)

### Design

**Design-Richtung:** Dunkel, nordisch, industriell. Monospace-Font. Farbschema: Dunkler Hintergrund (#0a0a0f), gedämpfte Akzente in Eisblau (#7eb8da) und Bernstein (#d4a847) für Warnungen. Keine Verspieltheiten — das ist ein Werkzeug, es soll nach Schmiede aussehen, nicht nach Spielplatz. Subtiles Claude-Männchen als Animation (Sahnehäubchen, Phase 3+).

**⚡ HANDY-FIRST — OBERSTE DESIGN-REGEL:** Das primäre Endgerät ist ein Android-Handy über Tailscale. JEDE Design-Entscheidung wird zuerst für Handy-Viewport (360–412px breit) getroffen. Desktop-Darstellung ist nice-to-have, nicht Pflicht. Konkret bedeutet das:
- Minimum Touch-Target: 48x48px für alle interaktiven Elemente
- Kein Hover-abhängiges UI — alles muss per Touch funktionieren
- Sidebar: ein/ausklappbar, mobilfreundlich (Hamburger-Menü, nicht kollabierende Desktop-Sidebar)
- Textgrößen: mindestens 16px Body, 14px minimum für sekundären Text
- Scrolling vertikal, nicht horizontal
- Modals/Overlays statt neuer Seiten wo möglich

## Konventionen

- **CHANGELOG.md:** Jeder Patch bekommt einen Eintrag. Format: `## [Patch-XX] — YYYY-MM-DD` mit Zusammenfassung was geändert wurde.
- **README.md — Lebendiges Handbuch:** Die README ist kein totes Setup-Dokument. Sie dokumentiert JEDEN Button/jede Funktion im UI: was er tut, welcher tmux-Befehl dahintersteckt, und warum. Bei jedem neuen Feature wird die README aktualisiert — KEIN Feature ohne README-Eintrag. Struktur mit Unterkategorien, damit sie mitwachsen kann. Kann später optional als HTML-Version im UI selbst angezeigt werden.
- **Startskript:** `start_mjolnir.sh` im Projekt-Root. Installiert Dependencies und startet uvicorn. Soll auch als systemd-Service registrierbar sein für Autostart.
- **Kein Auth im MVP:** Mjölnir läuft nur im Tailscale-Netz, das ist bereits ein privates VPN. Auth kommt ggf. später.
- **Error Handling:** Jeder subprocess-Call wird in try/except gewrappt. Keine stillen Fehler — alles wird ans Frontend kommuniziert.
- **Encoding:** UTF-8 überall. tmux-Output kann ANSI-Escape-Codes enthalten → im Frontend entweder strippen oder mit einer kleinen Lib rendern.

## Entwicklungs-Phasen

### Phase 1 — Launcher MVP (Patch 01–03)
- [ ] FastAPI-Grundgerüst mit Health-Endpoint
- [ ] tmux_manager.py: Sessions auflisten, erstellen (mit `claude` CLI), beenden
- [ ] Projektordner-Discovery (scannt z.B. ~/Python/ nach Ordnern mit CLAUDE.md)
- [ ] Frontend: Session-Launcher mit Projekt-Dropdown + Modell-Dropdown + Start-Button
- [ ] Frontend: Aktive Sessions als Karten anzeigen
- [ ] Frontend: Session beenden Button
- [ ] start_mjolnir.sh Startskript
- [ ] README.md mit Doku für jeden Button

### Phase 2 — Remote Control Bridge (Patch 04–06)
- [ ] "Remote Control aktivieren" Button pro Session (sendet `/rc` via tmux send-keys)
- [ ] Deep-Link zu claude.ai/code nach RC-Aktivierung
- [ ] Berechtigungen-Toggle (bypass permissions Flag)
- [ ] Plan-Modus / Auto-Modus Toggle
- [ ] Quick-Link zu claude.ai/chat
- [ ] Angepinnte Sessions / Favoriten
- [ ] Zuletzt verwendete Projekte merken

### Phase 3 — Komfort & Polish (Patch 07+)
- [ ] Sidebar (ein/ausklappbar, Hamburger-Menü)
- [ ] Session-Templates (z.B. "Zerberus mit Opus 4.7, bypass, Plan-Modus")
- [ ] Claude-Männchen Animation (Sahnehäubchen)
- [ ] Datei-Upload ans Projekt (vom Handy → Ryzen-Projektordner)
- [ ] Notifications wenn Session idle wird
- [ ] Optional: WAL-SQLite für Session-History

### Phase 4 — Testing (Patch 10+)
- [ ] **Fenris** (Chaos-Tester): klickt wild durch, macht Unsinn, provoziert Fehler
- [ ] **Loki** (Plan-Tester): systematisch jeden Button, jeden Edge-Case, jede Kombination

## CLI-Befehle hinter den Knöpfen

Jeder Button in Mjölnir führt einen dieser Befehle aus. Diese Liste ist die Single Source of Truth.

```
# Neue Claude-Code-Session in tmux starten:
tmux new-session -d -s {name} "claude --model {model} --project {path} {flags}"

# Beispiel mit allen Optionen:
tmux new-session -d -s patch-85 "claude --model claude-opus-4-7-20260401 --dangerously-skip-permissions --plan /home/chris/Python/Zerberus"

# Remote Control in einer laufenden Session aktivieren:
tmux send-keys -t {name} "/rc" Enter

# Modell wechseln in laufender Session:
tmux send-keys -t {name} "/model {model_id}" Enter

# Plan-Modus umschalten:
# → Shift+Tab in der Session (oder /plan Slash-Befehl)
tmux send-keys -t {name} "/plan" Enter

# Session auflisten:
tmux list-sessions

# Session beenden:
tmux kill-session -t {name}

# Verfügbare Modelle (Stand April 2026):
# claude-opus-4-7-20260401          → Opus 4.7
# claude-opus-4-7-20260401 (1M)     → Opus 4.7 mit 1M Kontext
# claude-sonnet-4-6-20260205        → Sonnet 4.6
# claude-haiku-4-5-20251001         → Haiku 4.5
```

**WICHTIG:** Die Modell-IDs können sich ändern. Bei Updates die offiziellen Anthropic-Docs prüfen.

## Dokumentations-Framework

- **CLAUDE.md** (diese Datei): Anweisungen für Claude Code auf dem Ryzen. Scope, Architektur, Phasen.
- **SUPERVISOR.md**: Anweisungen für den Chat-Supervisor (Opus im Browser). Letzte 3 Patches, nächste 6 Schritte, Design-Entscheidungen, Prompt-Bau-Kontext.
- **CHANGELOG.md**: Append-only, ein Eintrag pro Patch.
- **README.md**: Lebendiges Handbuch — jeden Button erklärt.
- **BACKLOG.md**: Bug-Sammlung, Feature-Wünsche, "haben ist besser als brauchen"-Items. Wird periodisch konsolidiert.

## Sicherheitshinweise

- `send_keys` ist mächtig — erlaubt beliebige Befehle. Im MVP akzeptabel weil Tailscale-only. Für Phase 2+: Input-Validation und evtl. Allowlist.
- Keine Secrets in .env commiten falls das jemals in ein Repo geht.
- tmux-Sessions laufen als der User, der uvicorn startet. Keine Root-Rechte nötig oder erwünscht.

## Namensgebung

Nordisch. Das Projekt heißt Mjölnir, der Codename ist Hammerfall. Session-Templates können nordische Namen bekommen. Das Frontend darf einen subtilen Hammer-Icon haben. Nicht übertreiben — es ist ein Tool, kein Themenpark.
