import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Boards, Cards } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import axios from 'axios';
import './App.css';

type Board = {
  id: string;
  title: string;
  ownerId: string;
  joinCode: string;
  createdAt: string;
  updatedAt: string;
};

type Column = { id: string; boardId: string; title: string; position: number };

type Card = {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  version: number;
};

type Notification = { id: string; type: string; payload: any; createdAt: string; readAt?: string | null };

type Audit = { id: string; type: string; payload: any; createdAt: string };

function getUserId() {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('userId', id);
  }
  return id;
}

export const App: React.FC = () => {
  const { user, token, logout, loading: authLoading } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [active, setActive] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [presence, setPresence] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user && token) {
      Boards.list().then(setBoards).catch(console.error);
    }
  }, [user, token]);

  const connectWs = (boardId: string) => {
    if (!user) return;
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/ws`);
    ws.onopen = () => ws.send(JSON.stringify({ 
      type: 'join', 
      userId: user.id, 
      boardId,
      userName: user.displayName 
    }));
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'presence') {
          setPresence(msg.users || []);
          if (msg.userJoined) {
            console.log(`${msg.userJoined.userName} joined the board`);
          }
          if (msg.userLeft) {
            console.log(`${msg.userLeft.userName} left the board`);
          }
        }
        if (msg.type === 'notify') {
          alert(`${msg.from}: ${msg.message}`);
        }
        if (msg.type === 'typing') {
          // could show typing indicator per-card
        }
        if (msg.type === 'card_update') {
          // Handle real-time card updates
          if (msg.cardId && msg.updates) {
            setCards(prev => prev.map(card => 
              card.id === msg.cardId ? { ...card, ...msg.updates } : card
            ));
          }
        }
        if (msg.type === 'column_update') {
          // Handle real-time column updates
          if (msg.columnId && msg.updates) {
            setColumns(prev => prev.map(col => 
              col.id === msg.columnId ? { ...col, ...msg.updates } : col
            ));
          }
        }
        if (msg.type === 'board_update') {
          // Handle real-time board updates
          if (msg.updates) {
            setActive(prev => prev ? { ...prev, ...msg.updates } : null);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    wsRef.current = ws;
    return ws;
  };

  async function loadNotifications() {
    if (!user || !token) return;
    const res = await fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setNotifications(await res.json());
  }

  async function loadAudit(boardId: string) {
    if (!token) return;
    const res = await fetch(`/api/audit?boardId=${encodeURIComponent(boardId)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setAudit(await res.json());
  }

  const loadBoard = async (boardId: string) => {
    setLoading(true);
    try {
      const { board, columns } = await Boards.get(boardId);
      setActive(board);
      setColumns(columns);
      const loadedCards = await Cards.list({ boardId });
      setCards(loadedCards);
      connectWs(boardId);
      await Promise.all([loadNotifications(), loadAudit(boardId)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => wsRef.current?.close(), []);

  const onCreateBoard = async () => {
    if (!user) return;
    const title = prompt('Board title?');
    if (!title) return;
    const b = await Boards.create({ title });
    setBoards((prev) => [b, ...prev]);
  };

  const onAddColumn = async () => {
    if (!active) return;
    const title = prompt('Column title?');
    if (!title) return;
    const column = await Boards.addColumn(active.id, { title, position: columns.length });
    setColumns((prev) => [...prev, column]);
  };

  const onAddCard = async (columnId: string) => {
    if (!active) return;
    const title = prompt('Card title?');
    if (!title) return;
    const optimistic: Card = {
      id: `tmp-${Math.random().toString(36).slice(2)}`,
      boardId: active.id,
      columnId,
      title,
      version: 1,
    };
    setCards((prev) => [optimistic, ...prev]);
    try {
      const created = await Cards.create({ boardId: active.id, columnId, title });
      setCards((prev) => [created, ...prev.filter((c) => c.id !== optimistic.id)]);
      loadAudit(active.id);
    } catch (e) {
      setCards((prev) => prev.filter((c) => c.id !== optimistic.id));
      alert('Failed to create card');
    }
  };

  const onMoveCard = async (card: Card, toColumnId: string) => {
    if (!active) return;
    const prev = cards;
    const updated = cards.map((c) => (c.id === card.id ? { ...c, columnId: toColumnId, version: c.version + 1 } : c));
    setCards(updated);
    try {
      const res = await Cards.move(card.id, { toColumnId, toPosition: 0 });
      setCards((cur) => cur.map((c) => (c.id === res.id ? res : c)));
      loadAudit(active.id);
      
      // Broadcast card movement via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'card_moved',
          cardId: card.id,
          fromColumnId: card.columnId,
          toColumnId: toColumnId,
          toPosition: 0
        }));
      }
    } catch (e) {
      setCards(prev);
      alert('Move failed');
    }
  };

  const onJoinBoard = async () => {
    if (!joinCode.trim()) return;
    try {
      const { board, columns } = await Boards.joinByCode(joinCode.trim().toUpperCase());
      setActive(board);
      setColumns(columns);
      const loadedCards = await Cards.list({ boardId: board.id });
      setCards(loadedCards);
      connectWs(board.id);
      await Promise.all([loadNotifications(), loadAudit(board.id)]);
      setShowJoinModal(false);
      setJoinCode('');
    } catch (error) {
      alert('Invalid join code or board not found');
    }
  };

  const cardsByColumn = useMemo(() => {
    const m = new Map<string, Card[]>();
    for (const column of columns) m.set(column.id, []);
    for (const c of cards) {
      if (!m.has(c.columnId)) m.set(c.columnId, []);
      m.get(c.columnId)!.push(c);
    }
    return m;
  }, [columns, cards]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not logged in
  if (!user) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-icon">📋</span>
              Collaborative Kanban
            </h1>
          </div>
        </header>
        <main className="app-main">
          <div className="auth-container">
            {showRegister ? (
              <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">📋</span>
            Collaborative Kanban
          </h1>
          <div className="header-actions">
            {active && (
              <div className="presence-indicator">
                <span className="presence-dot"></span>
                <span className="presence-text">
                  {presence.length} user{presence.length !== 1 ? 's' : ''} online
                </span>
              </div>
            )}
            <div className="user-menu">
              <span className="user-name">Welcome, {user.displayName}</span>
              <button className="btn btn-small btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {!active && (
          <div className="boards-view">
            <div className="boards-header">
              <h2>Your Boards</h2>
              <div className="board-actions">
                <button className="btn btn-secondary" onClick={() => setShowJoinModal(true)}>
                  <span className="btn-icon">🔗</span>
                  Join Board
                </button>
                <button className="btn btn-primary" onClick={onCreateBoard}>
                  <span className="btn-icon">+</span>
                  Create Board
                </button>
              </div>
            </div>
            
            {boards.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No boards yet</h3>
                <p>Create your first board to get started with collaborative project management.</p>
                <button className="btn btn-primary btn-large" onClick={onCreateBoard}>
                  <span className="btn-icon">+</span>
                  Create Your First Board
                </button>
              </div>
            ) : (
              <div className="boards-grid">
                {boards.map((b: Board) => (
                  <div key={b.id} className="board-card" onClick={() => loadBoard(b.id)}>
                    <div className="board-card-header">
                      <h3 className="board-title">{b.title}</h3>
                      <span className="board-date">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="board-card-footer">
                      <span className="board-owner">Created by you</span>
                      <div className="board-join-code">
                        <span className="join-code-label">Code:</span>
                        <span className="join-code-value">{b.joinCode}</span>
                      </div>
                      <span className="board-arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {active && (
          <div className="board-view">
            <div className="board-header">
              <div className="board-nav">
                <button className="btn btn-secondary" onClick={() => (wsRef.current?.close(), setActive(null))}>
                  <span className="btn-icon">←</span>
                  Back to Boards
                </button>
                <h2 className="board-title">{active.title}</h2>
                <div className="board-join-info">
                  <span className="join-code-label">Join Code:</span>
                  <span className="join-code-value">{active.joinCode}</span>
                </div>
              </div>
              <div className="board-actions">
                <button className="btn btn-primary" onClick={onAddColumn}>
                  <span className="btn-icon">+</span>
                  Add Column
                </button>
              </div>
            </div>

            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading board...</p>
              </div>
            )}

            <div className="board-content">
              <div className="columns-container">
                {columns
                  .sort((a, b) => a.position - b.position)
                  .map((col) => (
                    <div key={col.id} className="column">
                      <div className="column-header">
                        <h3 className="column-title">{col.title}</h3>
                        <button 
                          className="btn btn-small btn-ghost" 
                          onClick={() => onAddCard(col.id)}
                          title="Add card"
                        >
                          <span className="btn-icon">+</span>
                        </button>
                      </div>
                      <div className="column-content">
                        {(cardsByColumn.get(col.id) || []).map((card) => (
                          <div key={card.id} className="card">
                            <div className="card-content">
                              <h4 className="card-title">{card.title}</h4>
                            </div>
                            <div className="card-actions">
                              <select 
                                className="card-move-select"
                                value={card.columnId} 
                                onChange={(e) => onMoveCard(card, e.target.value)}
                                title="Move to column"
                              >
                                {columns
                                  .sort((a, b) => a.position - b.position)
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>
                                      Move to {c.title}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        ))}
                        {(cardsByColumn.get(col.id) || []).length === 0 && (
                          <div className="empty-column">
                            <p>No cards yet</p>
                            <button 
                              className="btn btn-small btn-ghost" 
                              onClick={() => onAddCard(col.id)}
                            >
                              Add first card
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="sidebar">
                <div className="sidebar-section">
                  <h3 className="sidebar-title">
                    <span className="sidebar-icon">🔔</span>
                    Notifications
                  </h3>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="notification-item">
                          <div className="notification-type">{n.type}</div>
                          <div className="notification-payload">
                            {JSON.stringify(n.payload, null, 2)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="sidebar-section">
                  <h3 className="sidebar-title">
                    <span className="sidebar-icon">📊</span>
                    Activity Log
                  </h3>
                  <div className="audit-list">
                    {audit.length === 0 ? (
                      <div className="empty-audit">
                        <p>No activity yet</p>
                      </div>
                    ) : (
                      audit.map((a) => (
                        <div key={a.id} className="audit-item">
                          <div className="audit-type">{a.type}</div>
                          <div className="audit-payload">
                            {JSON.stringify(a.payload, null, 2)}
                          </div>
                          <div className="audit-time">
                            {new Date(a.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Join Board Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Join Board</h3>
              <button className="btn btn-ghost" onClick={() => setShowJoinModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Enter the board join code to collaborate with others:</p>
              <input
                type="text"
                className="join-code-input"
                placeholder="Enter join code (e.g., ABC12345)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                onKeyPress={(e) => e.key === 'Enter' && onJoinBoard()}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onJoinBoard} disabled={!joinCode.trim()}>
                Join Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
