import { FastifyRequest, FastifyReply } from "fastify";

// Tipos de acesso definidos
type AccessLevel =
  | "gerente"
  | "supervisor" 
  | "funcionario"; 

interface JwtPayload {
  data: {
    id: string;
    nivel_acesso: AccessLevel;
  };
  iat: number;
}

export async function authenticateLevel(
  requiredLevel: AccessLevel[], // Níveis de acesso exigidos para a rota
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const user: JwtPayload = request.user as JwtPayload;

    // Verifica se o nível de acesso do usuário está na lista dos exigidos
    if (!requiredLevel.includes(user.data.nivel_acesso)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  } catch (error) {
    reply.status(401).send({ error: "Unauthorized Permission" });
    return;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.status(401).send({ error: "Unauthorized JWT" });
    return;
  }
}
