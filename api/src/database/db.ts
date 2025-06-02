import pgPromise from "pg-promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const pgp = pgPromise();
const db = pgp({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

const runMigrations = async () => {
  try {
    // Verificar se a tabela 'users' existe

    const tableExists = await db.oneOrNone(
      "SELECT to_regclass('public.users') AS table_exists"
    );

    if (!tableExists.table_exists) {
      // Criar a tabela de usuários
      await db.none(`
        CREATE TABLE public.users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          senha VARCHAR(255) NOT NULL,
          nivel_acesso VARCHAR(255)
        );
      `);

      const users = [
        [
          "funcionario@gmail.com",
          "1234",
          "funcionario",
        ],

        [
          "gerente@gmail.com",
          "1234",
          "gerente",
        ],

        [
          "supervisor1@gmail.com",
          "1234",
          "supervisor",
        ],
        [
          "supervisor2@gmail.com",
          "1234",
          "supervisor",
        ],
        [
          "supervisor3@gmail.com",
          "1234",
          "supervisor",
        ],
      ];

      // Formatar os dados para a inserção
      const formattedUsers = await Promise.all(
        users.map(async (user) => {
          if (typeof user[1] === "string") {
            const hashedPassword = await bcrypt.hash(user[1], 10);
            return `('${user[0]}', '${hashedPassword}', '${user[2]}')`;
          } else {
            throw new Error("Invalid password format");
          }
        })
      );

      // Executar a inserção dos usuários
      await db.query(`
        INSERT INTO public.users (email, senha, nivel_acesso)
        VALUES ${formattedUsers.join(", ")}
        RETURNING id;
      `);

      console.log("Migrações de Users completada.");
    } else {
      console.log('Tabela "Users" já existe. Migrações não necessárias.');
    }
    // Verificar se a tabela 'tasks' existe
    const tasksTableExists = await db.oneOrNone(
      "SELECT to_regclass('public.tasks') AS table_exists"
    );

    if (!tasksTableExists.table_exists) {
      await db.none(`
    CREATE TABLE public.tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      estado VARCHAR(50) NOT NULL,
      funcionario VARCHAR(255) NOT NULL,
      criado_por VARCHAR(255) NOT NULL
    );
  `);

      console.log("Tabela 'tasks' criada com sucesso.");
    } else {
      console.log('Tabela "tasks" já existe. Migrações não necessárias.');
    }
  } catch (err) {
    console.error("Erro na execução das migrações:", err);
  }
};

export { db, runMigrations };
