import Fastify from 'fastify';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Middleware de segurança: Checa Blacklist no Redis
fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.ip;
    const isBlocked = await redis.get(`block:${ip}`);

    if (isBlocked) {
        fastify.log.warn(`Bloqueio imediato: Requisição do IP ${ip} rejeitada.`);
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'GHOST-PROTOCOL: Seu IP foi banido por atividade suspeita.',
            code: 'GP_BANNED'
        });
    }
});

// Rota de Teste (Simula uma API Real)
fastify.all('/api/*', async (request, reply) => {
    const payload = JSON.stringify(request.body || {});
    const { ip, method, url } = request;

    try {
        // Enviar para o Brain analisar
        const brainResponse = await fetch(`http://brain:8000/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ip,
                method,
                path: url,
                payload
            })
        });

        const analysisResult: any = await brainResponse.json();

        if (analysisResult.status === 'blocked') {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'GHOST-PROTOCOL: Ameaça detectada pela IA.',
                analysis: analysisResult.analysis
            });
        }

        return { 
            status: 'secure', 
            message: 'Requisição validada pela IA.',
            data: request.body 
        };
    } catch (error) {
        fastify.log.error({ error }, 'Erro ao consultar o Brain:');
        // Em caso de erro no Brain, deixamos passar (fail-open) ou bloqueamos? 
        return { status: 'warning', message: 'Brain offline. Modo de segurança básica ativo.' };
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
        console.log(`🚀 Gateway rodando em http://0.0.0.0:${process.env.PORT || 4000}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
