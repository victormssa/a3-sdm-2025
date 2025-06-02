import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  loginUser,
} from "../controllers/authQueries";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { db } from "../database/db";
import { authenticateLevel } from "../middleware/authMiddleware";

dotenv.config();

interface LoginPayload {
  email: string;
  senha: string;
}

const generateUniqueUserId = (): string => {
  return uuidv4();
};

const postAuthRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/register",
    {
      preHandler: async (request, reply) => {
        await authenticateLevel(["gerente", "supervisor"], request, reply);
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {
          email,
          senha,
          nivel_acesso,
        } = request.body as {
          email: string;
          senha: string;
          nivel_acesso: string;
        };

        // Verificação de campos obrigatórios
        if (
          !email ||
          !senha ||
          !nivel_acesso
        ) {
          return reply.status(400).send({ error: "Missing required fields" });
        }

        // Verificação do nível de acesso
        const niveisValidos = ["gerente", "supervisor", "funcionario"];
        if (!niveisValidos.includes(nivel_acesso)) {
          return reply.status(400).send({ error: "Invalid access level" });
        }

        // Verificação de e-mail duplicado
        const existingUser = await db.oneOrNone(
          "SELECT id FROM public.users WHERE email = $1",
          [email]
        );
        if (existingUser) {
          return reply.status(409).send({ error: "Email already exists" });
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        const userData = {
          email,
          senha: hashedPassword, // Usar a senha criptografada
          nivel_acesso,

        };

        const userId = generateUniqueUserId(); // Função para gerar um ID único para o usuário

        try {
          // Iniciar uma transação
          await db.tx(async (t) => {
            // Inserir o usuário na tabela users
            await t.none(
              "INSERT INTO public.users (id, email, senha, nivel_acesso) VALUES ($1, $2, $3, $4)",
              [
                userId,
                userData.email,
                userData.senha,
                userData.nivel_acesso,
              ]
            );
          });
        } catch (dbError) {
          console.error("Database error:", dbError);
          if (dbError instanceof Error && dbError.message.includes("23505")) {
            // Unique violation
            return reply.status(409).send({ error: "Email already exists" });
          }
          return reply.status(500).send({ error: "Database error" });
        }

        reply.status(200);
      } catch (error) {
        console.error("Internal server error:", error);

        if (error instanceof SyntaxError) {
          return reply.status(400).send({ error: "Invalid JSON payload" });
        }

        if (error instanceof Error) {
          if (error.message.includes("Missing required fields")) {
            return reply.status(400).send({ error: error.message });
          }
        }

        reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  // Rota para fazer Login
  fastify.post(
    "/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, senha }: LoginPayload = request.body as LoginPayload;
        const data = await loginUser(email, senha);

        if (!data) {
          reply.status(401).send({ err: "Email ou Senha Incorretos." });
          return;
        }

        // Tipo de assertiva com verificação de que o JWT_SECRET está configurado
        const jwtSecret = process.env.JWT_SECRET as string;
        if (!jwtSecret) {
          reply
            .status(500)
            .send({ err: "JWT_SECRET não configurado no ambiente." });
          return;
        }

        const token = fastify.jwt.sign({ data: data }, jwtSecret as any);

        reply.send({ token });
      } catch (error) {
        reply.status(500).send({ err: `Erro Interno do Servidor` });
      }
    }
  );

};

export default postAuthRoutes;
