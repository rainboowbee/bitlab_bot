'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  createdAt: string;
  updatedAt: string;
  files: any; // Consider a more specific type later, e.g., string[] if storing URLs
  answer: string | null;
  solution: string | null;
}

// Define an initial state for a new task
const initialNewTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  description: '',
  maxPoints: 0,
  files: null,
  answer: null,
  solution: null,
};

const AdminTasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null); // State to hold the task being edited (full task object)
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | null>(null); // State for form input values

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks');
      if (!res.ok) {
        if (res.status === 403) {
           setError('Доступ запрещен. У вас нет прав администратора.');
        } else {
          throw new Error(`Error fetching tasks: ${res.statusText}`);
        }
      }
      const data = await res.json();
      setTasks(data.data);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при загрузке заданий.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    // Initialize form data with the task's data for editing
    setFormData({
      title: task.title,
      description: task.description,
      maxPoints: task.maxPoints,
      files: task.files,
      answer: task.answer,
      solution: task.solution,
    });
  };

  const handleCreateClick = () => {
    setEditingTask(null);
    setFormData({...initialNewTask}); // Initialize form data with empty values for creation
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setFormData(null); // Hide the form
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData!,
      [name]: value,
    }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData!,
      [name]: parseInt(value, 10) || 0, // Parse as integer, default to 0 if invalid
    }));
  };

  const handleSave = async () => {
    if (!formData) return; // Should not happen if the form is visible

    setLoading(true);
    setError(null);

    const method = editingTask ? 'PUT' : 'POST';
    const url = editingTask ? `/api/admin/tasks?id=${editingTask.id}` : '/api/admin/tasks';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Error saving task: ${res.statusText}`);
      }

      // Assuming the API returns the saved task, or just a success status
      // const savedTask = await res.json();

      // Refetch tasks to update the list
      await fetchTasks();

      // Close the form
      handleCancelEdit();

    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при сохранении задания.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Загрузка заданий...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div>
      <h1>Список заданий</h1>
      <button onClick={handleCreateClick}>Создать новое задание</button>

      {
        tasks.length === 0 ? (
          <p>Нет доступных заданий.</p>
        ) : (
          <ul>
            {tasks.map((task) => (
              <li key={task.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
                <h2>{task.title}</h2>
                <p>{task.description}</p>
                <p>Макс. баллов: {task.maxPoints}</p>
                <button onClick={() => handleEditClick(task)}>Редактировать</button>
                {/* Add delete button later */}
              </li>
            ))}
          </ul>
        )
      }

      {formData !== null && (
        <div>
          <h2>{editingTask ? 'Редактировать задание' : 'Создать задание'}</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div>
              <label htmlFor="title">Название:</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div>
              <label htmlFor="description">Описание:</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required />
            </div>
            <div>
              <label htmlFor="maxPoints">Макс. баллов:</label>
              <input type="number" id="maxPoints" name="maxPoints" value={formData.maxPoints} onChange={handleNumberInputChange} required />
            </div>
            {/* Add fields for files, answer, solution later or handle differently */}
            {/* For now, just basic text inputs */}
            <div>
              <label htmlFor="files">Файлы (JSON string):</label>
              <input type="text" id="files" name="files" value={formData.files ? JSON.stringify(formData.files) : ''} onChange={(e) => {
                try {
                  setFormData(prevData => ({
                    ...prevData!,
                    files: e.target.value ? JSON.parse(e.target.value) : null
                  }));
                } catch (err) {
                  console.error('Invalid JSON for files', err);
                  // Optionally show a user-friendly error
                }
              }} />
            </div>
             <div>
              <label htmlFor="answer">Ответ:</label>
              <textarea id="answer" name="answer" value={formData.answer || ''} onChange={handleInputChange} />
            </div>
             <div>
              <label htmlFor="solution">Решение:</label>
              <textarea id="solution" name="solution" value={formData.solution || ''} onChange={handleInputChange} />
            </div>

            <button type="button" onClick={handleCancelEdit}>Отмена</button>
            <button type="submit">Сохранить</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminTasksPage; 