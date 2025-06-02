'use client'
import { useEffect, useState } from 'react';
import useBearerToken from '../../app/hooks/CookieJWT';
import { useAuth } from '@/components/authContext/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { FiLogOut } from 'react-icons/fi';

interface Task {
    id: string;
    titulo: string;
    estado: string;
    funcionario: string;
}

interface User {
    id: string;
    email: string;
    nivel_acesso: string;
}

interface DecodedToken {
    data: {
        id: string | null;
    };
}

export default function FuncionarioPage() {
    const token = useBearerToken();
    const { logout } = useAuth();

    const [userEmail, setUserEmail] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Novo estado local para armazenar os estados temporários das tarefas (map id->estado)
    const [taskEstados, setTaskEstados] = useState<Record<string, string>>({});

    useEffect(() => {
        if (token !== null) {
            const id = jwtDecode<DecodedToken>(token).data.id;

            const fetchUserEmail = async () => {
                try {
                    const res = await fetch(`http://localhost:3001/users/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        setMessage('Erro ao buscar dados do usuário.');
                        return;
                    }

                    const data = await res.json();
                    setUserEmail(data.user.email);
                } catch (error) {
                    console.error('Erro ao buscar usuário:', error);
                    setMessage('Erro ao buscar dados do usuário.');
                }
            };

            fetchUserEmail();
        }
    }, [token]);

    useEffect(() => {
        if (!userEmail || !token) return;

        const fetchTasks = async () => {
            try {
                const res = await fetch('http://localhost:3001/tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    setMessage('Erro ao buscar tarefas.');
                    return;
                }

                const data = await res.json();
                const userTasks = data.filter((task: Task) => task.funcionario === userEmail);
                setTasks(userTasks);

                // Inicializa os estados temporários
                const estadosInit: Record<string, string> = {};
                userTasks.forEach((t: Task) => {
                    estadosInit[t.id] = t.estado;
                });

                setTaskEstados(estadosInit);
            } catch (error) {
                console.error('Erro ao buscar tarefas:', error);
                setMessage('Erro ao buscar tarefas.');
            }
        };

        fetchTasks();
    }, [userEmail, token]);

    const handleChangeEstado = (taskId: string, newEstado: string) => {
        setTaskEstados(prev => ({ ...prev, [taskId]: newEstado }));
    };

    const handleSaveEstado = async (taskId: string) => {
        const newEstado = taskEstados[taskId];
        if (!newEstado) return;
        setIsLoading(true);
        setMessage('');
        try {
            const res = await fetch(`http://localhost:3001/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estado: newEstado }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(`Erro ao atualizar tarefa: ${data.error || 'Erro desconhecido'}`);
            } else {
                setTasks(tasks.map(task =>
                    task.id === taskId ? { ...task, estado: newEstado } : task
                ));
                setMessage('Tarefa atualizada com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            setMessage('Erro ao atualizar tarefa.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-3xl font-bold text-indigo-600">Painel do Funcionário</h3>
                    <button
                        onClick={() => logout()}
                        className="
    flex items-center gap-2
    bg-red-600 
    text-white 
    px-6 
    py-3 
    rounded-lg 
    font-semibold 
    shadow-lg 
    transition 
    duration-300 
    ease-in-out 
    transform 
    hover:bg-red-700 
    hover:scale-105 
    hover:shadow-xl 
    focus:outline-none 
    focus:ring-4 
    focus:ring-red-400
    cursor-pointer
  "
                    >
                        <FiLogOut size={20} />
                        Sair
                    </button>
                </div>

                {message && <div className="p-3 border rounded bg-gray-100">{message}</div>}

                <div>
                    <h2 className="text-xl font-semibold mb-4">Minhas Tarefas</h2>
                    {tasks.length === 0 && <p className="text-gray-500">Nenhuma tarefa atribuída.</p>}

                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse border">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border px-4 py-2">Tarefa</th>
                                    <th className="border px-4 py-2">Status Atual</th>
                                    <th className="border px-4 py-2">Novo Status</th>
                                    <th className="border px-4 py-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task: Task) => (
                                    <tr key={task.id} className="bg-white">
                                        <td className="border px-4 py-2">{task.titulo}</td>
                                        <td className="border px-4 py-2">{task.estado}</td>
                                        <td className="border px-4 py-2">
                                            <select
                                                value={taskEstados[task.id] || task.estado}
                                                onChange={(e) => handleChangeEstado(task.id, e.target.value)}
                                                disabled={isLoading}
                                                className="border rounded px-2 py-1"
                                            >
                                                <option value="pendente">Pendente</option>
                                                <option value="em andamento">Em andamento</option>
                                                <option value="concluída">Concluída</option>
                                            </select>
                                        </td>
                                        <td className="border px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleSaveEstado(task.id)}
                                                disabled={isLoading || taskEstados[task.id] === task.estado}
                                                className={`
                                                    px-4 py-2 rounded text-white
                                                    ${taskEstados[task.id] === task.estado
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}
                                                `}
                                            >
                                                Salvar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
