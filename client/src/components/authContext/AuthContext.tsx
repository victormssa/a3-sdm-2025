"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";
import Cookies from "js-cookie";
import useBearerToken from "@/app/hooks/CookieJWT";
interface AuthContextProps {
    isLoggedIn: boolean;
    login: (token: string, getRememberMe: boolean) => void;
    userId: string | null;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
    isLoggedIn: false,
    userId: null,
    login: () => { },
    logout: () => { },
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

const verifyToken = (token: string) => {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        return null;
    }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [decodedToken, setDecodedToken] = useState<any | null>(null);
    const router = useRouter();
    const token = useBearerToken();
    useEffect(() => {
        // Verifica se existe um token armazenado em cookies
        const storedSessionInfo = Cookies.get("session_info");

        if (storedSessionInfo) {
            try {
                const sessionInfo = JSON.parse(storedSessionInfo);

                // Verifica se o token 'tk' está presente e é válido
                if (sessionInfo && sessionInfo.tk) {
                    const decodedToken = verifyToken(sessionInfo.tk);

                    if (
                        decodedToken &&
                        typeof decodedToken === "object" &&
                        "data" in decodedToken &&
                        "id" in decodedToken.data
                    ) {
                        // Token válido, define o estado de isLoggedIn como true
                        setIsLoggedIn(true);
                        const userId = decodedToken.data.id;
                        setUserId(userId);
                    }
                }
            } catch (error) {
                console.error("Erro ao analisar o cookie session_info:", error);
            }
        }
    }, []);

    const login = (token: string, getRememberMe: boolean) => {
        const decodedToken = verifyToken(token);
        if (
            decodedToken &&
            typeof decodedToken === "object" &&
            "data" in decodedToken &&
            "id" in decodedToken.data
        ) {
            setIsLoggedIn(true);
            const userId = decodedToken.data.id;
            setUserId(userId);
            setDecodedToken(decodedToken.data);
            var existingCookies = Cookies.get();
            // Define o tempo de expiração dos cookies
            const expirationTime = getRememberMe ? 365 : 1; // Se rememberMe for true, será considerado 365 dias, caso contrário, 1 dia

            // Se Session_info existir
            if ("session_info" in existingCookies) {
                var sessionInfo = JSON.parse(existingCookies["session_info"]);
                sessionInfo.tk = token;
                Cookies.set("session_info", JSON.stringify(sessionInfo), {
                    expires: expirationTime,
                });
            }
            // Se não existir
            else {
                Cookies.set("session_info", JSON.stringify({ cc: true, tk: token }), {
                    expires: expirationTime,
                });
                localStorage.clear();
            }

            router.push(`/home`);
        } else {
            console.error(
                "Erro ao decodificar o token ou propriedade userId não encontrada."
            );
        }
    };

    const logout = async () => {
        // Remove o cookie de sessão e redireciona
        Cookies.remove("session_info");
        setIsLoggedIn(false);
        router.push(`/`);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, userId }}>
            {children}
        </AuthContext.Provider>
    );
};
