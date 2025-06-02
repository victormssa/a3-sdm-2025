import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getAllUsers, getUserById, getAllSupervisors
} from "../controllers/userQueries";
import { authenticateLevel } from "../middleware/authMiddleware";
const userGetRoutes = async (fastify: FastifyInstance) => {
  // Obter todos os usuários
  fastify.get(
    "/users",
    {
      preHandler: (request, reply) =>
        authenticateLevel(
          ["gerente", "supervisor"],
          request,
          reply
        )

    },

    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await getAllUsers();
        reply.send({ users });
      } catch (error) {
        console.error("Error fetching all users:", error);
        if (error instanceof Error) {
          reply.status(500).send({ error: "Internal Server Error" });
        } else {
          reply.status(500).send({ error: "Unknown error" });
        }
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/users/:id",
    {
      preHandler: (request, reply) =>
        authenticateLevel(["gerente", "supervisor", "funcionario"], request, reply),
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const user = await getUserById(id); // Essa função precisa existir no seu controller

        if (!user) {
          reply.status(404).send({ error: "Usuário não encontrado" });
          return;
        }

        reply.send({ user });
      } catch (error) {
        console.error("Erro ao buscar usuário por ID:", error);
        if (error instanceof Error) {
          reply.status(500).send({ error: "Erro interno no servidor" });
        } else {
          reply.status(500).send({ error: "Erro desconhecido" });
        }
      }
    }
  );
  fastify.get(
    "/supervisores",
    {
      preHandler: (request, reply) =>
        authenticateLevel(["gerente"], request, reply), // apenas gerente pode ver supervisores
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const supervisores = await getAllSupervisors();
        reply.send(supervisores);
      } catch (error) {
        console.error("Erro ao buscar supervisores:", error);
        if (error instanceof Error) {
          reply.status(500).send({ error: "Erro interno do servidor" });
        } else {
          reply.status(500).send({ error: "Erro desconhecido" });
        }
      }
    }
  );
};

export default userGetRoutes;
