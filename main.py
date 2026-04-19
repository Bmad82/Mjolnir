import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

import tmux_manager

load_dotenv()

app = FastAPI(title="Mjölnir", description="Claude Code Session Launcher")

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", include_in_schema=False)
async def root():
    return FileResponse("static/index.html")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mjolnir"}


@app.get("/api/models")
async def get_models():
    return tmux_manager.MODELS


@app.get("/api/projects")
async def get_projects():
    base = os.getenv("PROJECTS_DIR", "")
    return tmux_manager.list_projects(base)


@app.get("/api/sessions")
async def get_sessions():
    sessions = tmux_manager.list_sessions()
    return [
        {
            "name": s.name,
            "windows": s.windows,
            "created": s.created,
            "attached": s.attached,
            "project_path": s.project_path,
            "model": s.model,
        }
        for s in sessions
    ]


class CreateSessionRequest(BaseModel):
    name: str
    project_path: str = ""
    model_id: str = "claude-sonnet-4-6-20260205"
    model_label: str = "Sonnet 4.6"
    bypass_permissions: bool = False


@app.post("/api/sessions", status_code=201)
async def post_session(req: CreateSessionRequest):
    ok, err = tmux_manager.create_claude_session(
        name=req.name,
        project_path=req.project_path,
        model_id=req.model_id,
        model_label=req.model_label,
        bypass_permissions=req.bypass_permissions,
    )
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    return {"name": req.name, "created": True}


@app.delete("/api/sessions/{name}")
async def delete_session(name: str):
    ok, err = tmux_manager.kill_session(name)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    return {"name": name, "killed": True}


@app.post("/api/sessions/{name}/rc")
async def post_remote_control(name: str):
    ok, err = tmux_manager.enable_remote_control(name)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    return {"name": name, "rc_activated": True}


class SlashCommandRequest(BaseModel):
    command: str


@app.post("/api/sessions/{name}/command")
async def post_command(name: str, req: SlashCommandRequest):
    ok, err = tmux_manager.send_slash_command(name, req.command)
    if not ok:
        raise HTTPException(status_code=400, detail=err)
    return {"name": name, "sent": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8855)),
        reload=True,
    )
