import Redis from 'ioredis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const presence = {
  async setOnline(userId: string, boardId: string, userName?: string) {
    try {
      await redis.sadd(`presence:board:${boardId}`, userId);
      await redis.set(`presence:user:${userId}`, JSON.stringify({
        boardId,
        userName,
        lastSeen: Date.now()
      }), 'EX', 60 * 5);
    } catch (error) {
      console.error('Redis presence error:', error);
    }
  },
  
  async setOffline(userId: string, boardId: string) {
    try {
      await redis.srem(`presence:board:${boardId}`, userId);
    } catch (error) {
      console.error('Redis presence error:', error);
    }
  },
  
  async getBoardUsers(boardId: string): Promise<Array<{userId: string, userName?: string, lastSeen: number}>> {
    try {
      const userIds = await redis.smembers(`presence:board:${boardId}`);
      const users = [];
      
      for (const userId of userIds) {
        const userData = await redis.get(`presence:user:${userId}`);
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.boardId === boardId) {
            users.push({ userId, ...parsed });
          }
        }
      }
      
      return users;
    } catch (error) {
      console.error('Redis presence error:', error);
      return [];
    }
  },

  async getOnlineUsers(): Promise<Array<{userId: string, userName?: string, boardId: string}>> {
    try {
      const keys = await redis.keys('presence:user:*');
      const users = [];
      
      for (const key of keys) {
        const userData = await redis.get(key);
        if (userData) {
          const parsed = JSON.parse(userData);
          users.push({ userId: key.replace('presence:user:', ''), ...parsed });
        }
      }
      
      return users;
    } catch (error) {
      console.error('Redis presence error:', error);
      return [];
    }
  }
};
