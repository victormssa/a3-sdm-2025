'use client';
import { useState, useEffect } from 'react';
import SupervisorPage from '../../../components/supervisorPage/SupervisorPage';
import FuncionarioPage from '../../../components/funcionarioPage/FuncionarioPage';
import GerentePage from '../../../components/gerentePage/GerentePage';
import useBearerToken from "../../hooks/CookieJWT";
import { jwtDecode } from 'jwt-decode';
import { useAuth } from "@/components/authContext/AuthContext";
interface DecodedToken {
    data: {
        nivel_acesso: string;
    };
}

export default function HomePage() {
    const token = useBearerToken();
    const [nivelAcesso, setNivelAcesso] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [verificado, setVerificado] = useState(false);
    const { logout } = useAuth();
    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);
                if (decoded && 'data' in decoded && decoded.data?.nivel_acesso) {
                    setNivelAcesso(decoded.data.nivel_acesso);
                } else {
                    setNivelAcesso(null);
                }
            } catch (err) {
                setNivelAcesso(null);
            } finally {
                setLoading(false);
                setVerificado(true);
            }
        }
    }, [token]);

    useEffect(() => {

        if (verificado && !nivelAcesso) {

            logout();
        }
    }, [loading, nivelAcesso, verificado, logout]);

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (nivelAcesso === 'supervisor') {
        return <SupervisorPage />;
    }

    if (nivelAcesso === 'funcionario') {
        return <FuncionarioPage />;
    }

    if (nivelAcesso === 'gerente') {
        return <GerentePage />;
    }

    return <div>Acesso não autorizado</div>;
}

