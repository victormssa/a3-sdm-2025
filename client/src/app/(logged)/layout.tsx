"use client";
import { useState, useEffect } from "react";
import React from "react";
import { useParams } from "next/navigation";
import { useTokenFromCookie } from "@/app/hooks/TokenFromCookie";
import { usePathname } from "next/navigation";
import { notFound } from "next/navigation";
import { useAuth } from "@/components/authContext/AuthContext";
type AccessLevel =
    | "supervisor"
    | "funcionario"
    | "gerente";
const LoggedLayout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { logout } = useAuth();
    const params = useParams();
    const pathname = usePathname();
    const userId = params.userId as string;
    const [isComponentsAllowed, setAllowComponents] = useState(false);
    const decodedToken = useTokenFromCookie("session_info");
    const [isTokenLoaded, setTokenLoaded] = useState(false);
    const [storedUserId, setStoredUserId] = useState<string | null>(null);

    const routesByAccessLevel: Record<AccessLevel, string[]> = {
        // supervisor - Acesso Total
        supervisor: [
            "home",
        ],
        funcionario: [
            "home",
        ],
        gerente: [
            "home",
        ],
    };

    useEffect(() => {
        const checkCookie = () => {
            const cookieValue = document.cookie
                .split("; ")
                .find((row) => row.startsWith("session_info="));

            if (!cookieValue) {
                logout();
            }
        };

        checkCookie();
        const intervalId = setInterval(checkCookie, 5000);

        return () => clearInterval(intervalId);
    }, [logout]);

    useEffect(() => {
        if (decodedToken !== null) {
            setTokenLoaded(true);
            setStoredUserId(decodedToken.id);
        }
    }, [decodedToken]);

    useEffect(() => {
        if (!isTokenLoaded) return;

        const checkAccessLevel = () => {
            if (!decodedToken) {
                notFound();
            }

            if (!decodedToken.id || !decodedToken.nivel_acesso) {
                notFound();
            }

            // Verificação se o ID na URL é diferente do storedUserId para clientes
            if (decodedToken.nivel_acesso === "cliente") {
                const isHome =
                    pathname.startsWith("/home");
                if (isHome && userId !== storedUserId) {
                    notFound();
                }
            }

            if (storedUserId && storedUserId !== decodedToken.id) {
                logout();
            }

            const clientAcess = decodedToken.nivel_acesso;

            if (
                !routesByAccessLevel[clientAcess as AccessLevel]?.includes(
                    pathname.split("/")[1]
                )
            ) {
                notFound();
            } else {
                setAllowComponents(true);
            }
        };

        checkAccessLevel();
    }, [decodedToken, pathname, isTokenLoaded, storedUserId]);


    return (
        <main className="flex w-full h-fit">
            {isComponentsAllowed ? (
                <>
                    <div className="flex flex-col w-full overflow-hidden h-screen relative">
                        {children}
                    </div>
                </>
            ) : (
                <></>
            )}
        </main>
    );
};

export default LoggedLayout;
