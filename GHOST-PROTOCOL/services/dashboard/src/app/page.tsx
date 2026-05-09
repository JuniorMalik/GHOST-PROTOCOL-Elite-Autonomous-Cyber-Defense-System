"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Terminal, Activity, Globe, Lock } from "lucide-react";

interface LogEntry {
  id: string;
  created_at: string;
  ip: string;
  method: string;
  path: string;
  action: "ALLOW" | "BLOCK";
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation?: string;
}

export default function WarRoom() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemStatus, setSystemStatus] = useState("SECURE");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8000/events');
        const data = await res.json();
        setLogs(data);
        
        // Se houver algum BLOCK recente, muda o status do sistema
        const hasRecentBlock = data.some((l: any) => l.action === 'BLOCK');
        setSystemStatus(hasRecentBlock ? "UNDER ATTACK" : "SECURE");
      } catch (e) {
        console.error("Dashboard link failed", e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerAttack = async () => {
    try {
      await fetch('http://localhost:8000/simulate', { method: 'POST' });
    } catch (e) {
      console.error("Simulation trigger failed", e);
    }
  };

  return (
    <main className="h-screen w-full p-6 flex flex-col gap-6 bg-black text-cyber-green">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-cyber-green/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-green/10 rounded-full">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter">GHOST-PROTOCOL v1.0</h1>
            <p className="text-xs opacity-60">AUTONOMOUS CYBER-DEFENSE SYSTEM</p>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-xs opacity-50 uppercase">Escudo Ativo</p>
            <p className="text-xl font-bold text-cyber-cyan">99.8%</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-50 uppercase">Uptime IA</p>
            <p className="text-xl font-bold text-cyber-cyan">12h 45m</p>
          </div>
        </div>
      </header>

      {/* Grid Central */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* Painel Esquerdo: Logs de Tráfego */}
        <section className="col-span-8 flex flex-col glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-cyber-green/20 flex items-center gap-2 bg-cyber-green/5">
            <Terminal className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase">Live Traffic Interception</h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-sm">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id}
                  className={`p-3 rounded border flex flex-col gap-2 ${
                    log.action === "BLOCK" ? "border-cyber-red/50 bg-cyber-red/5" : "border-cyber-green/20 bg-cyber-green/5"
                  } group cursor-pointer hover:bg-cyber-green/10 transition-colors`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <span className="opacity-40 text-[10px] font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                      <span className="font-bold text-cyber-cyan tracking-wider">{log.ip}</span>
                    </div>
                    <span className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest ${
                      log.action === "BLOCK" ? "bg-cyber-red text-white shadow-[0_0_10px_rgba(255,0,60,0.5)]" : "bg-cyber-green/20 text-cyber-green"
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  
                  {log.explanation && (
                    <div className="text-[10px] opacity-70 italic border-t border-cyber-green/10 pt-2">
                      {log.explanation}
                    </div>
                  )}

                  <div className="text-[9px] flex items-center justify-between opacity-50">
                    <div className="flex gap-2">
                      <span>LEVEL: <span className={log.threat_level === "CRITICAL" ? "text-cyber-red" : "text-cyber-cyan"}>{log.threat_level}</span></span>
                      <span>METHOD: {log.method}</span>
                    </div>
                    <span>PATH: {log.path}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Painel Direito: Status e Ações */}
        <section className="col-span-4 flex flex-col gap-6">
          
          {/* Status Geral */}
          <div className="p-6 glass rounded-xl flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyber-cyan animate-pulse" />
            <div className="p-4 bg-cyber-cyan/10 rounded-full border border-cyber-cyan/50">
              {systemStatus === "SECURE" ? <Lock className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12 text-cyber-red" />}
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-widest">SYSTEM {systemStatus}</h3>
              <p className="text-xs opacity-60 mt-1">AI AGENT IS MONITORING PACKETS</p>
            </div>
          </div>

          {/* Mini Gráfico / Atividade */}
          <div className="flex-1 glass rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Analysis Engine</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-6 p-4">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs uppercase opacity-60">
                    <span>Packet Inspection</span>
                    <span>Active</span>
                  </div>
                  <div className="h-1 w-full bg-cyber-green/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyber-green"
                      animate={{ width: ["20%", "80%", "40%", "90%"] }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs uppercase opacity-60">
                    <span>Neural Mitigation</span>
                    <span>Ready</span>
                  </div>
                  <div className="h-1 w-full bg-cyber-cyan/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyber-cyan"
                      animate={{ width: ["10%", "50%", "30%", "70%"] }}
                      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* Botões de Ação Simulação */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={triggerAttack}
              className="p-4 bg-cyber-red/10 border border-cyber-red/30 rounded-xl text-cyber-red text-xs font-bold uppercase hover:bg-cyber-red/20 transition-all flex flex-col items-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              Test Attack
            </button>
            <button 
              onClick={async () => {
                await fetch('http://localhost:8000/reset', { method: 'POST' });
                alert('Firewall Resetado! Seu IP foi perdoado.');
              }}
              className="p-4 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl text-cyber-cyan text-xs font-bold uppercase hover:bg-cyber-cyan/20 transition-all flex flex-col items-center gap-2"
            >
              <Globe className="w-5 h-5" />
              Reset Firewall
            </button>
          </div>

        </section>
      </div>

      {/* Footer / Status Bar */}
      <footer className="text-[10px] flex justify-between opacity-40 font-mono">
        <span>GHOST_PROTOCOL_SYS_v1.0.45</span>
        <span>LATENCY: 12ms | DB_SYNC: OK | REDIS_CLUSTER: CONNECTED</span>
        <span>LOCATION: DEV_PESSOAL_LAB_01</span>
      </footer>
    </main>
  );
}

