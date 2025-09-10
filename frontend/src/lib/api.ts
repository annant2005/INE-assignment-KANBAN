const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'same-origin',
    ...init,
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      window.location.reload();
    }
    throw new Error(await res.text());
  }
  return res.json();
}

export const Boards = {
  list: () => api('/boards'),
  create: (data: { title: string }) => api('/boards', { method: 'POST', body: JSON.stringify(data) }),
  get: (boardId: string) => api(`/boards/${boardId}`),
  joinByCode: (joinCode: string) => api(`/boards/join/${joinCode}`, { method: 'POST' }),
  update: (boardId: string, data: { title: string }) => api(`/boards/${boardId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (boardId: string) => api(`/boards/${boardId}`, { method: 'DELETE' }),
  addColumn: (boardId: string, data: { title: string; position: number }) => api(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify(data) }),
  updateColumn: (boardId: string, columnId: string, data: Partial<{ title: string; position: number }>) => api(`/boards/${boardId}/columns/${columnId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeColumn: (boardId: string, columnId: string) => api(`/boards/${boardId}/columns/${columnId}`, { method: 'DELETE' }),
};

export const Cards = {
  list: (q: { boardId?: string; columnId?: string }) => api(`/cards?${new URLSearchParams(q as any).toString()}`),
  create: (data: any) => api('/cards', { method: 'POST', body: JSON.stringify(data) }),
  update: (cardId: string, data: any) => api(`/cards/${cardId}`, { method: 'PUT', body: JSON.stringify(data) }),
  move: (cardId: string, data: { toColumnId: string; toPosition: number }) => api(`/cards/${cardId}/move`, { method: 'POST', body: JSON.stringify(data) }),
  remove: (cardId: string) => api(`/cards/${cardId}`, { method: 'DELETE' }),
};
