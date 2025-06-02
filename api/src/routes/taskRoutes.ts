import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as dotenv from "dotenv";
import { db } from "../database/db";
import { authenticateLevel } from "../middleware/authMiddleware";

dotenv.config();

const taskRoutes = async (fastify: FastifyInstance) => {
  // Criar tarefa
 fastify.post(
  "/create-task",
  {
    preHandler: async (request, reply) => {
      // Middleware que autentica e decodifica o token
      await authenticateLevel(["supervisor"], request, reply);
    },
  },
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { titulo, estado, funcionario } = request.body as {
        titulo: string;
        estado: string;
        funcionario: string;
      };

      // Validar campos obrigatórios
      if (!titulo || !estado || !funcionario) {
        return reply.status(400).send({ error: "Todos os campos são obrigatórios" });
      }

      // Pegar o ID do usuário autenticado via token decodificado
      const userId = (request.user as any)?.data?.id;

      if (!userId) {
        return reply.status(401).send({ error: "Usuário não autenticado" });
      }

      // Buscar o e-mail do criador da tarefa
      const user = await db.oneOrNone('SELECT email FROM public.users WHERE id = $1', [userId]);

      if (!user) {
        return reply.status(404).send({ error: "Usuário criador não encontrado" });
      }

      const criado_por = user.email;

      // Inserir a tarefa
      await db.none(
        `INSERT INTO public.tasks (titulo, estado, funcionario, criado_por)
         VALUES ($1, $2, $3, $4)`,
        [titulo, estado, funcionario, criado_por]
      );

      return reply.status(201).send({ message: "Tarefa criada com sucesso" });
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      return reply.status(500).send({ error: "Erro interno ao criar tarefa" });
    }
  }
);


  // GET Geral - Todas as tarefas
  fastify.get("/tasks", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tasks = await db.any("SELECT * FROM public.tasks ORDER BY titulo");
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas" });
    }
  });

  // GET Geral - Tarefas não realizadas
  fastify.get("/tasks/pending", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tasks = await db.any("SELECT * FROM public.tasks WHERE estado != 'realizada' ORDER BY titulo");
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas pendentes:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas pendentes" });
    }
  });

  // GET Geral - Tarefas realizadas
  fastify.get("/tasks/done", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tasks = await db.any("SELECT * FROM public.tasks WHERE estado = 'realizada' ORDER BY titulo");
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas realizadas:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas realizadas" });
    }
  });

  // GET Específico - Todas as tarefas de um usuário
  fastify.get("/tasks/user/:funcionario", async (request: FastifyRequest<{ Params: { funcionario: string } }>, reply: FastifyReply) => {
    try {
      const { funcionario } = request.params;
      const tasks = await db.any("SELECT * FROM public.tasks WHERE funcionario = $1 ORDER BY titulo", [funcionario]);
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas do usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas do usuário" });
    }
  });

  // GET Específico - Tarefas não realizadas de um usuário
  fastify.get("/tasks/user/:funcionario/pending", async (request: FastifyRequest<{ Params: { funcionario: string } }>, reply: FastifyReply) => {
    try {
      const { funcionario } = request.params;
      const tasks = await db.any(
        "SELECT * FROM public.tasks WHERE funcionario = $1 AND estado != 'realizada' ORDER BY titulo",
        [funcionario]
      );
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas pendentes do usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas pendentes do usuário" });
    }
  });

  // GET Específico - Tarefas realizadas de um usuário
  fastify.get("/tasks/user/:funcionario/done", async (request: FastifyRequest<{ Params: { funcionario: string } }>, reply: FastifyReply) => {
    try {
      const { funcionario } = request.params;
      const tasks = await db.any(
        "SELECT * FROM public.tasks WHERE funcionario = $1 AND estado = 'realizada' ORDER BY titulo",
        [funcionario]
      );
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas realizadas do usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas realizadas do usuário" });
    }
  });

  // GET - Tarefas criadas por uma pessoa
  fastify.get(
    "/tasks/created-by/:criadoPor",
    async (
      request: FastifyRequest<{ Params: { criadoPor: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { criadoPor } = request.params;
        const tasks = await db.any(
          "SELECT * FROM public.tasks WHERE criado_por = $1 ORDER BY titulo",
          [criadoPor]
        );
        reply.send(tasks);
      } catch (error) {
        console.error("Erro ao buscar tarefas criadas por usuário:", error);
        reply.status(500).send({ error: "Erro ao buscar tarefas criadas por esse usuário" });
      }
    }
  );
  fastify.patch<{ Params: { id: string }; Body: { estado: string } }>(
  "/tasks/:id",
  {
    preHandler: async (request, reply) => {
      // Middleware para autenticar o usuário com nível supervisor (pode ajustar conforme necessidade)
      await authenticateLevel(["supervisor", "funcionario"], request, reply);
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    const { estado } = request.body;

    if (!estado) {
      return reply.status(400).send({ error: "O campo 'estado' é obrigatório." });
    }

    try {
      // Atualizar o estado da tarefa no banco
      const result = await db.result(
        `UPDATE public.tasks SET estado = $1 WHERE id = $2`,
        [estado, id]
      );

      if (result.rowCount === 0) {
        return reply.status(404).send({ error: "Tarefa não encontrada." });
      }

      return reply.send({ message: "Tarefa atualizada com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      return reply.status(500).send({ error: "Erro interno ao atualizar tarefa." });
    }
  }
);
 fastify.get('/tasks/employees-without-pending', async (request, reply) => {
  try {
    const result = await db.any(`
      SELECT 
        u.id, 
        u.email,
        COUNT(t.id) FILTER (WHERE LOWER(t.estado) = 'concluída') AS tarefas_concluidas
      FROM public.users u
      LEFT JOIN public.tasks t ON u.email = t.funcionario
      WHERE u.nivel_acesso = 'funcionario'
        AND u.email NOT IN (
          SELECT funcionario 
          FROM public.tasks 
          WHERE estado IN ('pendente', 'em andamento')
        )
      GROUP BY u.id, u.email
    `);

    reply.send(result);
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    reply.status(500).send({ error: 'Erro ao buscar funcionários sem tarefas pendentes.' });
  }
});


};

export default taskRoutes;
