"use client"
import { useState, useEffect } from 'react';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
    nivel_acesso: string; // Corrigido para nivel_acesso
    iat: number;
}

export function useTokenFromCookie(cookieName: string): TokenPayload | null {
    const [decodedToken, setDecodedToken] = useState<TokenPayload | null>(null);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const cookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith(`${cookieName}=`));
            if (cookie) {
                const cookieValue = decodeURIComponent(cookie.split('=')[1]);
                try {
                    const jsonValue = JSON.parse(cookieValue);
                    const token = jsonValue['tk'];

                    // Verifica se o token JWT está presente e é uma string
                    if (token && typeof token === 'string') {
                        const decodedToken: any = jwt.decode(token);
                        setDecodedToken({
                            id: decodedToken.data.id,
                            iat: decodedToken.iat,
                            nivel_acesso: decodedToken.data.nivel_acesso // Usando nivel_acesso
                        });
                    } else {
                        console.error('Token JWT ausente ou inválido.');
                        setDecodedToken(null);
                    }
                } catch (error) {
                    console.error('Erro ao decodificar o token:', error);
                    setDecodedToken(null);
                }
            } else {
                console.error(`Cookie '${cookieName}' não encontrado.`);
                setDecodedToken(null);
            }
        }
    }, [cookieName]);

    return decodedToken;
}
