import apiClient from './apiClient';

const _cache = {};
const CACHE_TTL_MS = 15000; // 15 seconds fast in-memory cache

export const gamificationService = {
  async getLeaderboard(period = 'all_time', courseId = null, forceRefresh = false) {
    const cacheKey = `leaderboard_${period}_${courseId || 'all'}`;
    const now = Date.now();

    if (!forceRefresh && _cache[cacheKey] && (now - _cache[cacheKey].timestamp < CACHE_TTL_MS)) {
      return _cache[cacheKey].data;
    }

    const params = { period };
    if (courseId) params.course_id = courseId;

    const response = await apiClient.get('/api/leaderboard', { params });
    _cache[cacheKey] = { data: response.data, timestamp: now };
    return response.data;
  },

  async getMyLeaderboardRank() {
    const response = await apiClient.get('/api/leaderboard/me');
    return response.data;
  },

  async getBadges(forceRefresh = false) {
    const cacheKey = 'badges_all';
    const now = Date.now();

    if (!forceRefresh && _cache[cacheKey] && (now - _cache[cacheKey].timestamp < CACHE_TTL_MS)) {
      return _cache[cacheKey].data;
    }

    const response = await apiClient.get('/api/badges');
    _cache[cacheKey] = { data: response.data, timestamp: now };
    return response.data;
  },

  async getMyBadges() {
    const response = await apiClient.get('/api/badges/me');
    return response.data;
  },

  async getGamificationOverview() {
    const response = await apiClient.get('/api/gamification/me');
    return response.data;
  },

  clearCache() {
    Object.keys(_cache).forEach(k => delete _cache[k]);
  }
};

export default gamificationService;
