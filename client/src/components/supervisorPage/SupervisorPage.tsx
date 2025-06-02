'use client'
import { useEffect, useState } from 'react';
import { FiUserPlus, FiClipboard } from 'react-icons/fi';
import useBearerToken from "../../app/hooks/CookieJWT";
import { useAuth } from "@/components/authContext/AuthContext";
import { FiLogOut } from 'react-icons/fi';

interface Task {
    id: string
    titulo: string
    estado: string
    funcionario: string
}

interface Employee {
    id: string
    email: string
    nivel_acesso: string
}

export default function SupervisorPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [selectedEmail, setSelectedEmail] = useState<string | 'todos'>('todos')

    const [showModal, setShowModal] = useState(false)
    const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
    const [newEmployeePassword, setNewEmployeePassword] = useState('')
    const [taskEstado, setTaskEstado] = useState('pendente');
    const [taskDescription, setTaskDescription] = useState('')
    const [taskEmployeeEmail, setTaskEmployeeEmail] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const token = useBearerToken();
    const { logout } = useAuth();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, taskRes] = await Promise.all([
                    fetch('http://localhost:3001/users', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch('http://localhost:3001/tasks', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

                const empData = await empRes.json();
                const taskData = await taskRes.json();
                const filteredEmployees = Array.isArray(empData.users)
                    ? empData.users.filter((user: Employee) => user.nivel_acesso === 'funcionario')
                    : [];

                setEmployees(filteredEmployees);
                setTasks(Array.isArray(taskData) ? taskData : []);
                setFilteredTasks(Array.isArray(taskData) ? taskData : []);

            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);


    useEffect(() => {
        if (selectedEmail === 'todos') {
            setFilteredTasks(tasks)
        } else {
            setFilteredTasks(
                tasks.filter(task => task && typeof task.funcionario === 'string' && task.funcionario === selectedEmail)
            )
        }
    }, [selectedEmail, tasks])

    const handleAddEmployee = async () => {
        setIsLoading(true)
        setMessage('')

        try {
            const res = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    email: newEmployeeEmail,
                    senha: newEmployeePassword,
                    nivel_acesso: 'funcionario'
                }),
            })
            const data = await res.json()

            if (res.ok) {
                setEmployees([...employees, data.employee])
                setMessage('✅ Funcionário adicionado com sucesso!')
                setNewEmployeeEmail('')
                setNewEmployeePassword('')
            } else {
                setMessage(`❌ ${data.error || 'Erro ao adicionar funcionário'}`)
            }
        } catch (err) {
            setMessage('❌ Erro ao conectar com o servidor.')
        } finally {
            setIsLoading(false)
        }
    }


    const handleAddTask = async () => {
        setIsLoading(true)
        setMessage('')

        try {
            const res = await fetch('http://localhost:3001/create-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    titulo: taskDescription,
                    funcionario: taskEmployeeEmail,
                    estado: taskEstado,
                }),
            })

            const data = await res.json()

            if (res.ok) {
                // Atualiza localmente
                setTasks(prevTasks => [...prevTasks, data.task])
                setMessage('✅ Tarefa adicionada com sucesso!')
                setTaskDescription('')
                setTaskEmployeeEmail('')

                // Opcional: Recarregar todas as tarefas do backend para garantir sincronização
                const taskRes = await fetch('http://localhost:3001/tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const taskData = await taskRes.json();
                setTasks(Array.isArray(taskData) ? taskData : []);
            } else {
                setMessage(`❌ ${data.error || 'Erro ao adicionar tarefa'}`);
            }
        } catch (err) {
            setMessage('❌ Erro ao conectar com o servidor.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow space-y-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-3xl font-bold text-indigo-600">Painel do Supervisor</h3>
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


                {/* Mensagens */}
                {message && <div className="p-3 border rounded bg-gray-100">{message}</div>}

                {/* Botão para abrir o modal */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 hover:cursor-pointer"
                    >
                        <FiUserPlus size={18} />
                        Novo Funcionário
                    </button>
                </div>


                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex justify-center items-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl hover:cursor-pointer"
                            >
                                &times;
                            </button>
                            <h2 className="text-xl font-semibold mb-4">Cadastrar Funcionário</h2>
                            <div className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email do funcionário"
                                    className="w-full px-3 py-2 border rounded"
                                    value={newEmployeeEmail}
                                    onChange={(e) => setNewEmployeeEmail(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Senha"
                                    className="w-full px-3 py-2 border rounded"
                                    value={newEmployeePassword}
                                    onChange={(e) => setNewEmployeePassword(e.target.value)}
                                />
                                <button
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 hover:cursor-pointer flex items-center justify-center gap-2"
                                    onClick={async () => {
                                        await handleAddEmployee()
                                        setShowModal(false)
                                    }}
                                    disabled={isLoading}
                                >
                                    <FiUserPlus />
                                    Cadastrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulário para criar tarefa */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Criar Nova Tarefa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Descrição da tarefa"
                            className="px-3 py-2 border rounded"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                        />
                        <select
                            value={taskEstado}
                            onChange={(e) => setTaskEstado(e.target.value)}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="pendente">Pendente</option>
                            <option value="em andamento">Em andamento</option>
                            <option value="concluída">Concluída</option>
                        </select>
                        <select
                            value={taskEmployeeEmail}
                            onChange={(e) => setTaskEmployeeEmail(e.target.value)}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Selecione o funcionário</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.email}>
                                    {emp.email}
                                </option>
                            ))}
                        </select>

                    </div>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:cursor-pointer flex items-center justify-center gap-2"
                        onClick={handleAddTask}
                        disabled={isLoading}
                    >
                        <FiClipboard size={18} />
                        Criar Tarefa
                    </button>
                </div>

                {/* Filtro por funcionário */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Tarefas</h2>
                    <select
                        value={selectedEmail}
                        onChange={(e) => setSelectedEmail(e.target.value)}
                        className="px-3 py-2 border rounded mb-4"
                    >
                        <option value="todos">Todos os funcionários</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.email}>
                                {emp.email}
                            </option>
                        ))}
                    </select>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse border">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border px-4 py-2">Funcionário</th>
                                    <th className="border px-4 py-2">Tarefa</th>
                                    <th className="border px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.filter(Boolean).map((task) => (
                                    <tr key={task.id} className="bg-white">
                                        <td className="border px-4 py-2">{task.funcionario}</td>
                                        <td className="border px-4 py-2">{task.titulo}</td>
                                        <td className="border px-4 py-2">{task.estado}</td>
                                    </tr>
                                ))}

                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4 text-gray-500">
                                            Nenhuma tarefa encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
