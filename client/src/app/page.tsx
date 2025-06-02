'use client'
import { useState } from 'react'
import { FaLock, FaUser } from 'react-icons/fa'
import { useAuth } from "../components/authContext/AuthContext";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaSignInAlt } from "react-icons/fa";

interface Credentials {
  email: string;
  senha: string;
}

export default function LoginPage() {
  const [isSending, setWait] = useState(false);
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<Credentials>({
    email: "",
    senha: "",
  });
  const [errorLogin, setErrorLogin] = useState<string | undefined>();
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prevCredentials) => ({
      ...prevCredentials,
      [name]: value,
    }));
  };

  const tryLogging = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWait(true);

    try {
      const response = await fetch(`http://localhost:3001/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.token, rememberMe);
      } else {
        try {
          const errorData = await response.json();
          const errorText = errorData.err || "Email ou Senha incorretos.";
          setErrorLogin(errorText);
        } catch {
          setErrorLogin("Erro desconhecido");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Erro:", error.message);
      } else {
        console.error("Erro desconhecido:", error);
      }
      setErrorLogin("Erro ao processar a solicitação");
    } finally {
      setWait(false);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animated-bg">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full relative z-10">
        <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-8 tracking-tight">
          Painel de Login
        </h2>

        {errorLogin && (
          <div className="mb-5 text-sm text-red-700 bg-red-100 border border-red-300 p-3 rounded-md text-center font-medium select-none">
            {errorLogin}
          </div>
        )}

        <form onSubmit={tryLogging} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow duration-300 bg-gray-50">
              <span className="px-4 text-indigo-500 text-lg">
                <FaUser />
              </span>
              <input
                type="email"
                name="email"
                id="email"
                className="w-full bg-transparent px-3 py-3 text-gray-900 placeholder-gray-400 outline-none rounded-r-lg font-medium transition-colors duration-200"
                placeholder="Digite seu email"
                onChange={handleInputChange}
                required
                autoComplete="email"
                disabled={isSending}
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow duration-300 bg-gray-50">
              <span className="px-4 text-indigo-500 text-lg">
                <FaLock />
              </span>
              <input
                type='password'
                name="senha"
                id="senha"
                className="w-full bg-transparent px-3 py-3 text-gray-900 placeholder-gray-400 outline-none rounded-r-lg font-medium transition-colors duration-200"
                placeholder="Digite sua senha"
                onChange={handleInputChange}
                required
                autoComplete="current-password"
                disabled={isSending}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              className="accent-indigo-600 w-5 h-5 cursor-pointer rounded-md transition-colors duration-200 hover:accent-indigo-700 focus:ring-2 focus:ring-indigo-400"
              onChange={handleCheckboxChange}
              disabled={isSending}
            />
            <label
              htmlFor="rememberMe"
              className="text-gray-600 font-medium cursor-pointer select-none"
            >
              Mantenha-me conectado
            </label>
          </div>

          <button
            type="submit"
            className={`w-auto mt-3 text-white font-semibold rounded-lg tracking-wide flex items-center justify-center gap-3
    transition-colors duration-300 transform cursor-pointer p-2
    ${isSending
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
              }`}
            disabled={isSending}
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
                Carregando...
              </span>
            ) : (
              <>
                Entrar <FaSignInAlt className="text-xl" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400 select-none">
          Emails válidos: <br />
          <span className="font-mono">funcionario@gmail.com</span>,{" "}
          <span className="font-mono">supervisor@gmail.com</span>,{" "}
          <span className="font-mono">gerente@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
