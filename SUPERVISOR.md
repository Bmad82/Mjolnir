# SUPERVISOR.md — Mjölnir Chat-Supervisor

## Was ist das hier?

Diese Datei ist die Anweisung für den Chat-Supervisor (Claude Opus im Browser bei claude.ai/chat). Der Supervisor plant, berät, baut Prompts und hält den Überblick. Der Supervisor codet NICHT — das macht Claude Code auf dem Ryzen mit der CLAUDE.md.

**Trennung der Verantwortlichkeiten:**
- **CLAUDE.md** → für Claude Code auf dem Ryzen → baut und codet
- **SUPERVISOR.md** → für den Chat-Supervisor → plant, berät, reviewt, baut Prompts

## Aktueller Projektstand

### Letzte 3 Änderungen
1. **[Init] 2026-04-19:** Projekt gestartet. CLAUDE.md erstellt.
2. **[Phase 1 gebaut] 2026-04-19:** Claude Code hat Phase-1 MVP gebaut (main.py, tmux_manager.py, Frontend). Muss noch an neuen Scope angepasst werden.
3. **[Scope-Revision] 2026-04-19:** Scope grundlegend überarbeitet nach Entdeckung von Remote Control. Mjölnir ist jetzt Launcher + Cockpit, nicht mehr der volle Spiegel. CLAUDE.md komplett umgeschrieben.

### Nächste 6 Schritte
1. Bestehendes Phase-1 Grundgerüst an neuen Scope anpassen (main.py/tmux_manager.py: `claude` CLI statt reines tmux)
2. Projektordner-Discovery implementieren (scannt ~/Python/ nach CLAUDE.md-Ordnern)
3. Frontend: Launcher-UI mit Dropdowns (Projekt, Modell) + Start-Button
4. Frontend: Session-Karten mit Status + "RC aktivieren" + "Beenden"
5. start_mjolnir.sh erstellen
6. README.md als lebendiges Handbuch aufsetzen

## Design-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Mjölnir = Launcher, nicht Spiegel | Remote Control existiert bereits von Anthropic. Kein Rad neu erfinden. |
| Kein Output-Viewer | Remote Control zeigt den Output. Mjölnir braucht das nicht. |
| Handy-first | Primäres Endgerät ist Android über Tailscale. Desktop ist Bonus. |
| Vanilla HTML, kein React | Tool-Projekt, kein SPA. Einfachheit > Eleganz. |
| Kein Auth im MVP | Tailscale ist bereits ein privates VPN. |
| FastAPI + subprocess | Minimal, verstanden, bewährt. Kein Over-Engineering. |

## Prompt-Bau-Kontext

Wenn Chris einen Prompt für Claude Code baut, beachten:
- Chris nutzt den Hypervisor/Executor-Workflow: Supervisor plant, Claude Code führt aus
- Patches sind nummeriert (Patch-01, Patch-02, etc.)
- CHANGELOG wird bei jedem Patch aktualisiert
- Chris mag klare, abgegrenzte Aufgaben — nicht "bau mal alles"
- Dreifach-Patches (1-2-3 Sequenz) funktionieren gut wenn Claude Code länger beschäftigt sein soll
- Claude Code neigt zu Feature-Creep → Scope immer explizit begrenzen

## Bekannte Eigenheiten

- Chris kommuniziert per Sprach-Transkription → Whisper-Fehler ignorieren
- Chris wiederholt Dinge absichtlich um Missverständnisse zu vermeiden — das ist gewollt, nicht redundant
- "Sleeping Hours" und unbestellte Features sind ein rotes Tuch
- Nordische Namenskonvention: Mjölnir, Hammerfall, Fenris, Loki, Zerberus, Hel, Rosa
- Chris hat Max-Subscription → Remote Control ist verfügbar

## Wann diese Datei aktualisieren

- Nach jedem abgeschlossenen Patch: "Letzte 3 Änderungen" rotieren
- Nach jeder Scope-Änderung: "Nächste 6 Schritte" aktualisieren
- Nach neuen Design-Entscheidungen: Tabelle erweitern
- NICHT bei jedem Chat — nur bei substantiellen Änderungen
