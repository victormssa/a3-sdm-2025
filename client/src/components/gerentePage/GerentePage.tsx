'use client'
import { useState } from 'react';
import useBearerToken from '../../app/hooks/CookieJWT';
import { useAuth } from '@/components/authContext/AuthContext';
import { FiLogOut } from 'react-icons/fi';

interface Task {
    id: string;
    titulo: string;
    estado: string;
    funcionario: string;
}

interface Employee {
    id: string;
    email: string;
    tarefas_concluidas: string;
}

export default function GerentePage() {
    const token = useBearerToken();
    const { logout } = useAuth();

    const [reportData, setReportData] = useState<Task[] | Employee[] | null>(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [supervisores, setSupervisores] = useState<Employee[]>([]);
    const [supervisorSelecionado, setSupervisorSelecionado] = useState('');
    const [mostrarSelecao, setMostrarSelecao] = useState(false);

    const fetchReport = async (endpoint: string) => {
        setMostrarSelecao(false);
        if (!token) {
            setMessage('Token inválido ou não autenticado.');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setReportData(null);

        try {
            const res = await fetch(`http://localhost:3001/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errorData = await res.json();
                setMessage(errorData.message || 'Erro ao buscar relatório.');
                return;
            }

            const data = await res.json();

            if (!data || (Array.isArray(data) && data.length === 0)) {
                setMessage('Nenhum dado encontrado para este relatório.');
            } else {
                setReportData(data);
            }
        } catch (error) {
            console.error('Erro ao buscar relatório:', error);
            setMessage('Erro ao buscar relatório.');
        } finally {
            setIsLoading(false);
        }
    };

    const buscarSupervisores = async () => {
        if (!token) {
            setMessage('Token inválido ou não autenticado.');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/supervisores', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                setMessage('Erro ao buscar supervisores.');
                return;
            }

            const data = await res.json();
            setSupervisores(data);
            setMostrarSelecao(true);
        } catch (error) {
            console.error('Erro ao buscar supervisores:', error);
            setMessage('Erro ao buscar supervisores.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-3xl font-bold text-indigo-600">Painel do Gerente</h3>
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

                <div className="space-x-4">
                    <button
                        onClick={buscarSupervisores}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Tarefas do Supervisor
                    </button>
                    <button
                        onClick={() => fetchReport('tasks/pending')}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Tarefas Pendentes
                    </button>
                    <button
                        onClick={() => fetchReport('tasks/employees-without-pending')}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Funcionários sem Tarefas Pendentes
                    </button>
                </div>

                {mostrarSelecao && (
                    <div className="mt-4 space-y-2">
                        <label className="block font-medium">Selecione um Supervisor:</label>
                        <select
                            className="border p-2 rounded w-full"
                            onChange={(e) => setSupervisorSelecionado(e.target.value)}
                            value={supervisorSelecionado}
                        >
                            <option value="">-- Escolha um supervisor --</option>
                            {supervisores.map((sup) => (
                                <option key={sup.email} value={sup.email}>
                                    {sup.email}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                if (supervisorSelecionado) {
                                    fetchReport(`tasks/created-by/${supervisorSelecionado}`);
                                    setMostrarSelecao(false);
                                } else {
                                    setMessage('Por favor, selecione um supervisor.');
                                }
                            }}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Ver Tarefas
                        </button>
                    </div>
                )}

                {isLoading && <p>Carregando relatório...</p>}

                {message && (
                    <div className="p-3 border rounded bg-gray-100 text-red-600">{message}</div>
                )}

                {reportData && Array.isArray(reportData) && reportData.length > 0 && (
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full table-auto border-collapse border">
                            <thead className="bg-gray-200">
                                <tr>
                                    {'funcionario' in reportData[0] ? (
                                        <>
                                            <th className="border px-4 py-2">Título</th>
                                            <th className="border px-4 py-2">Estado</th>
                                            <th className="border px-4 py-2">Funcionário</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="border px-4 py-2">Email</th>
                                            <th className="border px-4 py-2">Tarefas Concluídas</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((item) => (
                                    <tr key={(item as any).id} className="bg-white">
                                        {'funcionario' in item ? (
                                            <>
                                                <td className="border px-4 py-2">{(item as Task).titulo}</td>
                                                <td className="border px-4 py-2">{(item as Task).estado}</td>
                                                <td className="border px-4 py-2">{(item as Task).funcionario}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="border px-4 py-2">{(item as Employee).email}</td>
                                                <td className="border px-4 py-2">{(item as Employee).tarefas_concluidas} Tarefas Concluídas</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
