from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/format", tags=["Formatação de Código"])


class FormatRequest(BaseModel):
    language: str
    code: str


@router.post("")
async def format_code(req: FormatRequest):
    """Formata código para linguagens suportadas.

    - python: usa Black se disponível (modo string), senão retorna o original
    - outras linguagens: retorna original (frontend pode usar Prettier)
    """
    lang = (req.language or "").lower()
    code = req.code or ""

    if lang in ("python", "py"):
        try:
            try:
                import black  # type: ignore
            except Exception as e:
                logger.warning(f"Black indisponível: {e}")
                return {"language": lang, "formatted": code, "tool": None}

            mode = black.FileMode()  # padrão
            formatted = black.format_file_contents(code, fast=True, mode=mode)
            return {"language": lang, "formatted": formatted, "tool": "black"}
        except Exception as e:
            logger.warning(f"Black falhou: {e}")
            return {"language": lang, "formatted": code, "tool": None}

    # Não suportado aqui – frontend pode aplicar Prettier para JS/TS
    return {"language": lang, "formatted": code, "tool": None}

