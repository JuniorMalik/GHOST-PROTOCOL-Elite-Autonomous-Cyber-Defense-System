import os
import redis
import json
import google.generativeai as genai
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="GHOST-PROTOCOL: Security Brain")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Configurar Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-2.0-flash')

class ThreatAnalysisRequest(BaseModel):
    ip: str
    payload: str
    path: str
    method: str

from sqlalchemy import Column, String, DateTime, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# Configuração do DB
Base = declarative_base()
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class SecurityEvent(Base):
    __tablename__ = "security_events"
    id = Column(String, primary_key=True, index=True)
    ip = Column(String)
    method = Column(String)
    path = Column(String)
    payload = Column(Text)
    threat_level = Column(String)
    attack_type = Column(String)
    explanation = Column(Text)
    action = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

@app.post("/analyze")
async def analyze_threat(data: ThreatAnalysisRequest):
    analysis = None
    
    try:
        prompt = f"Analise em JSON: IP: {data.ip} | Método: {data.method} | Caminho: {data.path} | Payload: {data.payload}"
        response = model.generate_content(prompt)
        clean_response = response.text.replace("```json", "").replace("```", "").strip()
        analysis = json.loads(clean_response)
    except Exception as e:
        print(f"IA Offline/Quota Exceeded. Usando Análise Local: {e}")
        # Heurística de Fallback (Simula a IA)
        is_attack = any(p in data.payload.lower() for p in ["select", "union", "script", "alert", "--", "<script>"])
        analysis = {
            "is_threat": is_attack,
            "threat_level": "HIGH" if is_attack else "LOW",
            "attack_type": "SQLi/XSS" if is_attack else "None",
            "explanation": "Detecção via Padrão de Assinatura Local (AI Fallback Mode)",
            "action": "BLOCK" if is_attack else "ALLOW"
        }
    
    try:
        # Salvar no Banco
        db = SessionLocal()
        import uuid
        event = SecurityEvent(
            id=str(uuid.uuid4()),
            ip=data.ip,
            method=data.method,
            path=data.path,
            payload=data.payload,
            threat_level=analysis.get("threat_level", "LOW"),
            attack_type=analysis.get("attack_type", "None"),
            explanation=analysis.get("explanation", ""),
            action=analysis.get("action", "ALLOW")
        )
        db.add(event)
        db.commit()
        db.close()

        if analysis.get("action") == "BLOCK":
            r.setex(f"block:{data.ip}", 3600, "banned")
            return {"status": "blocked", "analysis": analysis}
            
        return {"status": "allowed", "analysis": analysis}
    except Exception as e:
        print(f"Erro no processamento: {e}")
        return {"error": "Processing failed", "details": str(e)}

@app.get("/events")
async def get_events():
    db = SessionLocal()
    events = db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(50).all()
    db.close()
    return events

@app.post("/reset")
async def reset_firewall():
    # Limpar todas as chaves 'block:*' no Redis
    keys = r.keys("block:*")
    if keys:
        r.delete(*keys)
    return {"status": "firewall_reset", "count": len(keys)}

@app.post("/simulate")
async def simulate_attack():
    # Dispara ataques contra o gateway (dentro da rede do docker)
    GATEWAY_URL = "http://gateway:4000/api/resource"
    attacks = [
        {"name": "Legítimo", "payload": {"user": "admin", "action": "login"}},
        {"name": "SQLi", "payload": {"user": "' OR 1=1 --", "pass": "123"}},
        {"name": "XSS", "payload": {"msg": "<script>alert(1)</script>"}}
    ]
    
    results = []
    async with httpx.AsyncClient() as client:
        for attack in attacks:
            try:
                resp = await client.post(GATEWAY_URL, json=attack["payload"])
                results.append({"name": attack["name"], "status": resp.status_code})
            except Exception as e:
                results.append({"name": attack["name"], "error": str(e)})
    
    return {"simulation": "triggered", "results": results}

@app.get("/health")
async def health():
    return {"status": "alive"}

