import { db } from "../database/db";

interface Users {
  id: string;
  email?: string;
  senha?: string;
  nivel_acesso?: string;
}

const getAllUsers = async (): Promise<Users[]> => {
  try {
    return await db.any("SELECT * FROM users");
  } catch (error) {
    console.error("Erro ao buscar todos os usuários:", error);
    throw error;
  }
};
const getUserById = async (id: string): Promise<Users | null> => {
  try {
    return await db.oneOrNone('SELECT * FROM public.users WHERE id = $1', [id]);
  } catch (error) {
    console.error(`Erro ao buscar usuário com ID ${id}:`, error);
    throw error;
  }
};
 const getAllSupervisors = async (): Promise<Users[]> => {
  return db.any('SELECT * FROM public.users WHERE nivel_acesso = $1', ['supervisor']);
};


export {
  getAllUsers,
  getUserById,
  getAllSupervisors
};
