import subprocess
import os
from dataclasses import dataclass, field


@dataclass
class Session:
    name: str
    windows: int
    created: str
    attached: bool
    project_path: str = ""
    model: str = ""


# In-memory session metadata — cleared on server restart (acceptable for MVP)
_session_meta: dict[str, dict] = {}

MODELS = [
    {"id": "claude-opus-4-7-20260401",   "label": "Opus 4.7"},
    {"id": "claude-opus-4-7-20260401",   "label": "Opus 4.7 (1M Kontext)", "extra_flags": ["--max-tokens", "1000000"]},
    {"id": "claude-sonnet-4-6-20260205", "label": "Sonnet 4.6"},
    {"id": "claude-haiku-4-5-20251001",  "label": "Haiku 4.5"},
]


def _run(cmd: list[str]) -> tuple[str, str, int]:
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    return result.stdout, result.stderr, result.returncode


def list_sessions() -> list[Session]:
    stdout, _, returncode = _run([
        "tmux", "list-sessions",
        "-F", "#{session_name}\t#{session_windows}\t#{session_created_string}\t#{session_attached}",
    ])
    if returncode != 0:
        return []
    sessions = []
    for line in stdout.strip().splitlines():
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) != 4:
            continue
        name = parts[0]
        meta = _session_meta.get(name, {})
        sessions.append(Session(
            name=name,
            windows=int(parts[1]),
            created=parts[2],
            attached=parts[3] == "1",
            project_path=meta.get("project_path", ""),
            model=meta.get("model_label", ""),
        ))
    return sessions


def _validate_name(name: str) -> str | None:
    if not name or not all(c.isalnum() or c in "-_." for c in name):
        return "Ungültiger Session-Name. Nur Buchstaben, Ziffern, Bindestriche, Unterstriche und Punkte erlaubt."
    return None


def create_claude_session(
    name: str,
    project_path: str,
    model_id: str,
    model_label: str,
    bypass_permissions: bool = False,
) -> tuple[bool, str]:
    err = _validate_name(name)
    if err:
        return False, err

    # Build the claude CLI command that runs inside tmux
    claude_cmd = ["claude", "--model", model_id]
    if bypass_permissions:
        claude_cmd.append("--dangerously-skip-permissions")
    if project_path:
        claude_cmd.extend(["--project", project_path])

    # Wrap in tmux new-session
    shell_cmd = " ".join(claude_cmd)
    _, stderr, returncode = _run(["tmux", "new-session", "-d", "-s", name, shell_cmd])
    if returncode != 0:
        return False, stderr.strip() or "Session konnte nicht erstellt werden."

    _session_meta[name] = {
        "project_path": project_path,
        "model_id": model_id,
        "model_label": model_label,
        "bypass_permissions": bypass_permissions,
    }
    return True, ""


def kill_session(name: str) -> tuple[bool, str]:
    _, stderr, returncode = _run(["tmux", "kill-session", "-t", name])
    if returncode != 0:
        return False, stderr.strip() or "Session konnte nicht beendet werden."
    _session_meta.pop(name, None)
    return True, ""


def enable_remote_control(name: str) -> tuple[bool, str]:
    _, stderr, returncode = _run(["tmux", "send-keys", "-t", name, "/rc", "Enter"])
    if returncode != 0:
        return False, stderr.strip() or "Remote Control konnte nicht aktiviert werden."
    return True, ""


def send_slash_command(name: str, command: str) -> tuple[bool, str]:
    _, stderr, returncode = _run(["tmux", "send-keys", "-t", name, command, "Enter"])
    if returncode != 0:
        return False, stderr.strip() or "Befehl konnte nicht gesendet werden."
    return True, ""


def list_projects(base_dir: str = "") -> list[dict]:
    if not base_dir:
        base_dir = os.path.expanduser("~/Python")
    projects = []
    try:
        for entry in sorted(os.scandir(base_dir), key=lambda e: e.name.lower()):
            if not entry.is_dir():
                continue
            claude_md = os.path.join(entry.path, "CLAUDE.md")
            if os.path.isfile(claude_md):
                projects.append({"name": entry.name, "path": entry.path})
    except (PermissionError, FileNotFoundError):
        pass
    return projects
