import fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import autoload from "@fastify/autoload";
import fastifyMultipart from "@fastify/multipart";
import fastifyJwt from "@fastify/jwt";
import { db, runMigrations } from "./database/db";
import pino from "pino";

const isDevEnvironment = process.env.NODE_ENV !== "production";

let logger;

if (isDevEnvironment) {
  // Use pino-pretty in development environment
  logger = pino(
    pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: true,
      },
      worker: {
        stdout: true,
        stderr: true,
      },
    })
  );
} else {
  // Use default pino logger in production environment
  logger = pino();
}

const serverOptions: FastifyServerOptions = {
  logger: logger,
  bodyLimit: 5 * 1024 * 1024, // 5MB
};

const server: FastifyInstance = fastify(serverOptions);
// Configuração do CORS
const corsOptions = {
  origin: ["http://localhost:3000"], //"http://localhost:3000"
  credentials: true,
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Função de registro de plugins com tratamento de erros consolidado
const registerPlugin = async (plugin: any, options: any, message: string) => {
  try {
    await server.register(plugin, options);
    server.log.info(`${message} registered successfully`);
  } catch (err) {
    server.log.error(`Error registering ${message}: ${err}`);
    process.exit(1);
  }
};

const jwt = process.env.JWT_SECRET;
// Verifica se a variável de ambiente JWT_SECRET está definida
if (!jwt) {
  server.log.error("JWT_SECRET is missing in environment variables");
  process.exit(1);
}

// Função de configuração do servidor
async function setupServer(server: FastifyInstance) {
  // Registro dos plugins com tratamento de erros melhorado
  await registerPlugin(fastifyCors, corsOptions, "Cors plugin");
  await registerPlugin(
    fastifyJwt,
    {
      secret: jwt,
      algorithm: 'HS256',
      sign: {
        expiresIn: "7d",
      },
      verify: {
        algorithms: ['HS256'] // Explicitamente força a verificação do algoritmo
      }
    },
    `JWT Plugin`
  );
  await registerPlugin(fastifySensible, {}, "Sensible plugin");
  await registerPlugin(
    fastifyMultipart,
    {
      limits: {
        fileSize: 5 * 1024 * 1024, // Limite de 5MB para o tamanho dos arquivos
        fieldSize: 5 * 1024 * 1024, // Limite de 5MB para o tamanho dos campos
      },
    },
    "Multipart plugin"
  );
  await registerPlugin(
    autoload,
    {
      dir: `${__dirname}/routes`,
    },
    "Autoload plugin (routes)"
  );

  return server;
}

// Função para iniciar o servidor
const start = async () => {
  try {
    console.log("Conectando ao banco de dados...");
    await db.connect();
    console.log("Banco de dados conectado. | 200 OK");

    console.log("Executando migrações...");
    await runMigrations();
    console.log("Migrações finalizadas | 200 OK.");

    console.log("Configurando o servidor...");
    await setupServer(server);
    console.log("Servidor configurado. | 200 OK");

    console.log("Iniciando o servidor...");
    await server.listen({ port: 3001, host: "0.0.0.0" });

    const address = server.server.address();
    console.log("Endereço do servidor:", address); // Log adicional para verificar o endereço do servidor

    if (typeof address === "string") {
      server.log.info(`Servidor escutando em ${address}`);
    } else if (address && typeof address === "object") {
      server.log.info(
        `Servidor rodando em http://${address.address}:${address.port} | 200 OK`
      );
    } else {
      server.log.error("Incapaz de determinar endereço do servidor e porta.");
      process.exit(1);
    }
  } catch (err) {
    server.log.error(`Erro ao inicializar o servidor: ${err}`);
    process.exit(1);
  }
};

start();
