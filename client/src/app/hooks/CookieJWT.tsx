import { useEffect, useState } from "react";
import Cookies from "js-cookie";

/**
 * Pegar o token de autenticação armazenado no cookie 'session_info'.
 * 
 * @returns {string | null} O token de autenticação armazenado no cookie, ou null se não encontrado.
 * 
 * @example
 * const token = useBarierToken();
 * console.log(token); // Exibe o token armazenado ou null.
 */
const  useBearerToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedSessionInfo = Cookies.get("session_info");

    if (storedSessionInfo) {
      const sessionInfo = JSON.parse(storedSessionInfo);
      setToken(sessionInfo.tk); 
    }
  }, []);

  return token;
};

export default useBearerToken;

