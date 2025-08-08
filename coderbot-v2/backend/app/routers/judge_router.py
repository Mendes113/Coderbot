from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx
import os
import logging

from app.config import settings  # .env com RAPIDAPI_KEY
from packaging.version import Version as SemVer

# Prefer local Judge0 if available, fallback to RapidAPI
LOCAL_JUDGE0_URL = os.getenv("LOCAL_JUDGE0_URL", "http://judge0:2358")
RAPIDAPI_JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true"

RAPIDAPI_HEADERS = {
    "X-RapidAPI-Key": getattr(settings, 'rapidapi_key', ''),
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    "Content-Type": "application/json",
}

LOCAL_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

router = APIRouter(prefix="/judge", tags=["Execução de Código"])
logger = logging.getLogger(__name__)

# Judge0 language ids (subset commonly used)
LANGUAGE_TO_ID = {
    "javascript": 63,
    "js": 63,
    "typescript": 74,
    "ts": 74,
    "python": 71,
    "py": 71,
    "java": 62,
    "c": 50,
    "cpp": 54,
    "cplusplus": 54,
    "csharp": 51,
    "cs": 51,
    "ruby": 72,
    "go": 60,
    "rust": 73,
    "php": 68,
    "kotlin": 78,
}

# Piston language names mapping
LANGUAGE_TO_PISTON = {
    "javascript": "javascript",
    "js": "javascript",
    "typescript": "typescript",
    "ts": "typescript",
    "python": "python",
    "py": "python",
    "java": "java",
    "c": "c",
    "cpp": "cpp",
    "cplusplus": "cpp",
    "ruby": "ruby",
    "go": "go",
    "rust": "rust",
    "php": "php",
    "kotlin": "kotlin",
}

PISTON_URL = os.getenv("PISTON_URL", "https://emkc.org/api/v2/piston")

class ExecRequest(BaseModel):
    language: str  # "javascript", "python", ...
    code: str

import base64

async def try_local_judge0(lang_id: int, source_code: str) -> dict:
    """Try to execute code using local Judge0 instance"""
    payload = {
        "language_id": lang_id,
        "source_code": source_code,  # Local Judge0 uses plain text
        "stdin": ""
    }
    
    submit_endpoint = f"{LOCAL_JUDGE0_URL}/submissions?base64_encoded=false&wait=true"
    logger.info(f"Trying local Judge0: {submit_endpoint}")
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(submit_endpoint, headers=LOCAL_HEADERS, json=payload, timeout=60)
            logger.info(f"Local Judge0 response: {r.status_code}")
            if r.is_error:
                logger.warning(f"Local Judge0 failed: {r.status_code} - {r.text}")
                raise Exception(f"Local Judge0 error: {r.status_code}")

            result = r.json()
            # If outputs are empty but we have a token, poll once or twice
            if not (result.get("stdout") or result.get("stderr") or result.get("compile_output")) and result.get("token"):
                token = result["token"]
                for _ in range(2):
                    poll = await client.get(f"{LOCAL_JUDGE0_URL}/submissions/{token}", headers=LOCAL_HEADERS, timeout=60)
                    if poll.is_error:
                        break
                    polled = poll.json()
                    if polled.get("stdout") or polled.get("stderr") or polled.get("compile_output"):
                        return polled
                # return original if still empty (frontend will show message/status)
                return result

            return result
            
        except Exception as e:
            logger.warning(f"Local Judge0 connection failed: {e}")
            raise e

async def try_piston(language_name: str, source_code: str) -> dict:
    """Fallback to Piston API (no key) for minimal execution"""
    piston_lang = LANGUAGE_TO_PISTON.get(language_name)
    if not piston_lang:
        raise Exception(f"Piston: language not supported: {language_name}")

    runtimes_url = f"{PISTON_URL}/runtimes"
    execute_url = f"{PISTON_URL}/execute"

    async with httpx.AsyncClient(timeout=30) as client:
        # Fetch runtimes to determine a valid version
        try:
            rts = await client.get(runtimes_url)
            rts.raise_for_status()
            runtimes = rts.json() or []
            logger.info(f"Piston runtimes status={rts.status_code} count={len(runtimes)}")
        except Exception as e:
            logger.warning(f"Piston runtimes check failed: {e}")
            runtimes = []

        # Pick latest version for the language
        version: str | None = None
        if isinstance(runtimes, list):
            matching = [rt for rt in runtimes if (rt.get("language") == piston_lang and isinstance(rt.get("version"), str))]
            if matching:
                try:
                    latest = max(matching, key=lambda x: SemVer(x.get("version")))
                    version = latest.get("version")
                except Exception:
                    version = matching[0].get("version")
        if not version:
            # As a fallback, try a common default
            defaults = {
                "python": "3.10.0",
                "javascript": "16.3.0",
                "typescript": "5.0.3",
                "java": "15.0.2",
                "c": "10.2.0",
                "cpp": "10.2.0",
                "go": "1.16.2",
                "ruby": "3.0.1",
                "rust": "1.68.2",
                "php": "8.2.3",
                "kotlin": "1.8.0",
            }
            version = defaults.get(piston_lang)
        if not version:
            raise Exception(f"Piston: no runtime version found for {piston_lang}")

        payload = {
            "language": piston_lang,
            "version": str(version),
            "stdin": "",
            "files": [
                {"name": f"main.{ 'py' if piston_lang=='python' else 'txt' }", "content": source_code}
            ]
        }
        logger.info(f"Trying Piston execution: url={execute_url} lang={piston_lang} version={version}")
        r = await client.post(execute_url, json=payload)
        if r.is_error:
            raise Exception(f"Piston error: {r.status_code}: {r.text}")
        data = r.json() or {}
        run = data.get("run") or {}
        stdout = run.get("stdout")
        stderr = run.get("stderr")
        code = run.get("code")
        status_desc = "Accepted" if (stdout and code == 0) else ("Runtime Error" if code not in (None, 0) else "Finished")
        return {
            "stdout": stdout,
            "stderr": stderr,
            "compile_output": None,
            "time": None,
            "memory": None,
            "token": None,
            "message": None,
            "status": {"id": 0 if code == 0 else 1, "description": status_desc}
        }

async def try_rapidapi_judge0(lang_id: int, source_code: str) -> dict:
    """Fallback to RapidAPI Judge0"""
    payload = {
        "language_id": lang_id,
        "source_code": base64.b64encode(source_code.encode()).decode(),  # RapidAPI uses base64
        "stdin": ""
    }
    
    logger.info("Falling back to RapidAPI Judge0")
    
    async with httpx.AsyncClient() as client:
        r = await client.post(RAPIDAPI_JUDGE0_URL, headers=RAPIDAPI_HEADERS, json=payload, timeout=60)
        
        if r.is_error:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                detail=f"Judge0 {r.status_code}: {r.text}"
            )
        
        result = r.json()
        
        # Decode base64 outputs from RapidAPI
        for field in ("stdout", "stderr", "compile_output"):
            if result.get(field):
                result[field] = base64.b64decode(result[field]).decode()
        
        return result

@router.post("/executar")
async def executar(req: ExecRequest):
    lang_name = (req.language or "").lower()
    lang_id = LANGUAGE_TO_ID.get(lang_name)

    logger.info(f"Executing {lang_name} code (lang_id: {lang_id})")

    # PRIMARY: Piston (no key, reliable for minimal execution)
    try:
        piston = await try_piston(lang_name, req.code)
        logger.info("Executed using Piston (primary)")
        return piston
    except Exception as piston_error:
        logger.warning(f"Piston primary failed: {piston_error}")

    # SECONDARY (optional): RapidAPI Judge0 if key present and lang_id mapped
    if lang_id is not None and getattr(settings, 'rapidapi_key', ''):
        try:
            rapid = await try_rapidapi_judge0(lang_id, req.code)
            logger.info("Executed using RapidAPI Judge0 (secondary)")
            return rapid
        except Exception as rapidapi_error:
            logger.warning(f"RapidAPI Judge0 failed: {rapidapi_error}")

    # TERTIARY (disabled by default): Local Judge0 - currently unreliable without worker
    # Intentionally skipping local Judge0 to avoid `/box/script.py` internal error.

    raise HTTPException(
        status.HTTP_502_BAD_GATEWAY,
        detail="Execution failed. Executors unavailable (Piston, RapidAPI)."
    )

