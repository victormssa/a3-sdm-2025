import bcrypt from "bcrypt";
import { db } from "../database/db";

const loginUser = async (
  email: string,
  senha: string
): Promise<{ id: string; nivel_acesso: string } | null> => {
  try {
    const user = await db.oneOrNone(
      "SELECT id, senha, nivel_acesso FROM public.users WHERE email = $1",
      email
    );

    if (!user) {
      return null;
    }

    const senhaMatch = await bcrypt.compare(senha, user.senha);

    if (!senhaMatch) {
      return null;
    }

    return { id: user.id, nivel_acesso: user.nivel_acesso };
  } catch (error) {
    console.error("Erro ao logar no usuário:", error);
    throw error;
  }
};

export {
  loginUser,
};
