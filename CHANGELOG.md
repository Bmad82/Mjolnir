# CHANGELOG — Mjölnir (Hammerfall)

## [Patch-02] — 2026-04-19

- CLAUDE.md grundlegend überarbeitet: Scope auf "Claude Code Launcher" eingeschränkt (kein Output-Viewer — das macht Remote Control).
- `tmux_manager.py`: `create_claude_session` startet `claude` CLI mit Modell/Projekt/Flags; `read_output` entfernt; `enable_remote_control` und `send_slash_command` neu; `list_projects` scannt `~/Python/` nach Ordnern mit CLAUDE.md.
- `main.py`: neue Endpoints `/api/models`, `/api/projects`, `/api/sessions/{name}/rc`, `/api/sessions/{name}/command`; Output-Endpoint entfernt.
- Frontend komplett überarbeitet: Session-Launcher mit Projekt-Dropdown, Modell-Dropdown, Bypass-Permissions-Toggle, großem Start-Button; Session-Karten mit RC-Button; kein Output-Viewer.
- Design: 48px Touch-Targets (war 44px), 16px Body-Font, Handy-first.
- `start_mjolnir.sh` Startskript hinzugefügt.
- `.env`: `PROJECTS_DIR` ergänzt.

## [Patch-01] — 2026-04-19

- FastAPI-Grundgerüst mit Health-Endpoint (`/api/health`).
- `tmux_manager.py`: `list_sessions`, `create_session`, `kill_session`, `read_output`, `send_keys`.
- Alle API-Endpoints implementiert (GET/POST/DELETE sessions, output, send).
- Frontend: Session-Liste mit Auto-Refresh (4s Polling), Neue-Session-Modal, Session-beenden mit Bestätigung.
- Design: Dunkel/nordisch, Eisblau + Bernstein, mobile-first (44px Touch-Targets).

## [Init] — 2026-04-19

- Projektstart. CLAUDE.md erstellt.
- Vision: Web-UI für tmux/Claude-Code Session-Management.
- Tech-Stack definiert: FastAPI + Vanilla Frontend.
- Drei Entwicklungsphasen geplant (MVP → Interaktion → Komfort).
