// Shared contracts kept minimal initially; will expand with features
export type EntityId = string;

export interface User {
  id: EntityId;
  email: string;
  displayName: string;
}

export interface Board {
  id: EntityId;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: EntityId;
  boardId: EntityId;
  title: string;
  position: number;
}

export interface Card {
  id: EntityId;
  boardId: EntityId;
  columnId: EntityId;
  title: string;
  description?: string;
  assigneeId?: EntityId;
  labels?: string[];
  dueDate?: string;
  updatedAt: string;
  version: number;
}

export type WsServerEvent =
  | { type: 'welcome' }
  | { type: 'notify'; message: string };
