from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx
import os
import logging
from packaging.version import Version as SemVer

router = APIRouter(prefix="/piston", tags=["Execução de Código"])
logger = logging.getLogger(__name__)

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
    "csharp": "c#",
    "cs": "c#",
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
    stdin: str | None = ""

async def execute_with_piston(language_name: str, source_code: str, stdin: str) -> dict:
    """Execute code using Piston API"""
    piston_lang = LANGUAGE_TO_PISTON.get(language_name)
    if not piston_lang:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Linguagem não suportada: {language_name}"
        )

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
            # Default versions as fallback
            defaults = {
                "python": "3.10.0",
                "javascript": "18.15.0",
                "typescript": "5.0.3",
                "java": "15.0.2",
                "c": "10.2.0",
                "cpp": "10.2.0",
                "c#": "6.12.0",
                "go": "1.16.2",
                "ruby": "3.0.1",
                "rust": "1.68.2",
                "php": "8.2.3",
                "kotlin": "1.8.20",
            }
            version = defaults.get(piston_lang)
        
        if not version:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Nenhuma versão encontrada para {piston_lang}"
            )

        # Determine file extension
        extensions = {
            "python": "py",
            "javascript": "js",
            "typescript": "ts",
            "java": "java",
            "c": "c",
            "cpp": "cpp",
            "c#": "cs",
            "go": "go",
            "ruby": "rb",
            "rust": "rs",
            "php": "php",
            "kotlin": "kt",
        }
        ext = extensions.get(piston_lang, "txt")

        payload = {
            "language": piston_lang,
            "version": str(version),
            "stdin": stdin or "",
            "files": [
                {"name": f"main.{ext}", "content": source_code}
            ]
        }
        
        logger.info(f"Executing code with Piston: lang={piston_lang} version={version}")
        
        try:
            r = await client.post(execute_url, json=payload)
            if r.is_error:
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY,
                    detail=f"Erro do Piston: {r.status_code}: {r.text}"
                )
            
            data = r.json() or {}
            run = data.get("run") or {}
            
            stdout = run.get("stdout") or ""
            stderr = run.get("stderr") or ""
            code = run.get("code")
            signal = run.get("signal")
            
            # Determine status
            if code == 0:
                status_desc = "Accepted"
                status_id = 3
            elif signal:
                status_desc = f"Runtime Error (Signal {signal})"
                status_id = 11
            elif code:
                status_desc = f"Runtime Error (Exit {code})"
                status_id = 11
            else:
                status_desc = "Finished"
                status_id = 0
            
            return {
                "stdout": stdout,
                "stderr": stderr,
                "compile_output": data.get("compile", {}).get("output"),
                "time": run.get("runtime"),
                "memory": None,
                "token": None,
                "message": None,
                "status": {"id": status_id, "description": status_desc}
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Piston execution error: {e}")
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro ao executar código: {str(e)}"
            )

@router.post("/executar")
async def executar(req: ExecRequest):
    """
    Executa código usando Piston API.
    
    Suporta: Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin
    """
    lang_name = (req.language or "").lower()
    
    logger.info(f"Executing {lang_name} code")
    
    try:
        result = await execute_with_piston(lang_name, req.code, req.stdin or "")
        logger.info(f"Executed successfully using Piston")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na execução: {str(e)}"
        )
