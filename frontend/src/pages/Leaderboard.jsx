import { useState, useEffect } from 'react';
import gamificationService from '../services/gamificationService';
import Icon from '../components/Icon';
import '../styles/main.css';

export default function Leaderboard() {
  const [period, setPeriod] = useState('all_time');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async (force = false) => {
    try {
      if (!leaderboardData || force) setIsLoading(true);
      setError(null);
      const data = await gamificationService.getLeaderboard(period, selectedCourseId || null, force);
      setLeaderboardData(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError("Failed to load leaderboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period, selectedCourseId]);

  const podium = leaderboardData?.podium || [];
  const leaderboard = leaderboardData?.leaderboard || [];
  const me = leaderboardData?.me;

  const firstPlace = podium.find(p => p.rank === 1);
  const secondPlace = podium.find(p => p.rank === 2);
  const thirdPlace = podium.find(p => p.rank === 3);

  const filteredRows = leaderboard.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header Title & Sync Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', boxShadow: '0 6px 16px rgba(245,158,11,0.3)' }}>
              🏆
            </div>
            <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
              Student Leaderboard
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '0.95rem' }}>
            Recognizing top performing trainees across XP, learning streaks, course completions, and earned badges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLeaderboard(true)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-dark)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <span>🔄 Synchronize Ranks</span>
        </button>
      </div>

      {/* Filter Controls & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', backgroundColor: 'var(--card-bg)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        {/* Period Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[
            { id: 'week', label: '⚡ This Week' },
            { id: 'month', label: '📅 This Month' },
            { id: 'all_time', label: '👑 All Time' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: period === p.id ? '1px solid #2563eb' : '1px solid transparent',
                backgroundColor: period === p.id ? '#2563eb' : 'var(--bg-main)',
                color: period === p.id ? '#ffffff' : 'var(--text-medium)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: period === p.id ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search & Course Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 14px 8px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-dark)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '180px'
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', opacity: 0.6 }}>
              🔍
            </span>
          </div>

          {/* Course Selector */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-dark)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Courses</option>
            <option value="1">Java Training</option>
            <option value="2">C# Training</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-medium)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
          <h3 style={{ margin: 0, fontWeight: 700 }}>Synchronizing leaderboard ranks...</h3>
        </div>
      ) : error ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--accent-red)' }}>
          <h3>{error}</h3>
          <button type="button" onClick={() => fetchLeaderboard(true)} style={{ marginTop: '12px', padding: '10px 20px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {podium.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '36px', alignItems: 'end' }}>
              {/* 2nd Place */}
              {secondPlace ? (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '2px solid rgba(148,163,184,0.5)', borderRadius: '20px', padding: '28px 20px 20px 20px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 24px rgba(0,0,0,0.04)', order: 1 }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #94a3b8, #64748b)', color: '#fff', padding: '4px 14px', borderRadius: '12px', fontSize: '0.775rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(148,163,184,0.3)' }}>
                    🥈 2nd Place
                  </div>
                  <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto 10px auto', fontSize: '1.6rem', fontWeight: 900, border: '3px solid #94a3b8', boxShadow: '0 6px 14px rgba(148,163,184,0.25)' }}>
                    {secondPlace.name.charAt(0)}
                  </div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{secondPlace.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)', display: 'block', marginBottom: '14px' }}>{secondPlace.email}</span>
                  
                  <div style={{ padding: '8px 14px', borderRadius: '12px', backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', display: 'inline-block' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb' }}>{secondPlace.xp} XP</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-medium)', marginTop: '8px' }}>Level {secondPlace.level} • 🏅 {secondPlace.badges_count} Badges</div>
                </div>
              ) : <div style={{ order: 1 }} />}

              {/* 1st Place (Center, Elevated) */}
              {firstPlace && (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '2px solid #f59e0b', borderRadius: '24px', padding: '36px 20px 24px 20px', textAlign: 'center', position: 'relative', boxShadow: '0 16px 36px rgba(245,158,11,0.2)', transform: 'translateY(-12px)', order: 2 }}>
                  <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', padding: '6px 18px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 900, boxShadow: '0 6px 16px rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👑 1st Champion</span>
                  </div>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 10px auto', fontSize: '2rem', fontWeight: 900, border: '4px solid #f59e0b', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                    {firstPlace.name.charAt(0)}
                  </div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)' }}>{firstPlace.name}</h3>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-medium)', display: 'block', marginBottom: '14px' }}>{firstPlace.email}</span>
                  
                  <div style={{ padding: '10px 18px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))', border: '1px solid rgba(245,158,11,0.4)', display: 'inline-block' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#d97706' }}>{firstPlace.xp} XP</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '8px' }}>Level {firstPlace.level} • 🏅 {firstPlace.badges_count} Badges</div>
                </div>
              )}

              {/* 3rd Place */}
              {thirdPlace ? (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '2px solid rgba(180,83,9,0.4)', borderRadius: '20px', padding: '28px 20px 20px 20px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 24px rgba(0,0,0,0.04)', order: 3 }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff', padding: '4px 14px', borderRadius: '12px', fontSize: '0.775rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(180,83,9,0.3)' }}>
                    🥉 3rd Place
                  </div>
                  <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffedd5, #fed7aa)', color: '#9a3412', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto 10px auto', fontSize: '1.6rem', fontWeight: 900, border: '3px solid #b45309', boxShadow: '0 6px 14px rgba(180,83,9,0.25)' }}>
                    {thirdPlace.name.charAt(0)}
                  </div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>{thirdPlace.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)', display: 'block', marginBottom: '14px' }}>{thirdPlace.email}</span>
                  
                  <div style={{ padding: '8px 14px', borderRadius: '12px', backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', display: 'inline-block' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb' }}>{thirdPlace.xp} XP</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-medium)', marginTop: '8px' }}>Level {thirdPlace.level} • 🏅 {thirdPlace.badges_count} Badges</div>
                </div>
              ) : <div style={{ order: 3 }} />}
            </div>
          )}

          {/* Current User Logged-in Summary Bar */}
          {me && (
            <div style={{ padding: '18px 24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(29,78,216,0.1))', border: '2px solid #2563eb', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 6px 18px rgba(37,99,235,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', backgroundColor: '#2563eb', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  #{me.rank}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {me.name} <span style={{ fontSize: '0.725rem', backgroundColor: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>YOUR RANK</span>
                  </h4>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-medium)' }}>{me.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-medium)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Level</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>Level {me.level}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-medium)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Total XP</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>{me.xp} XP</span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>XP</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Courses</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hours</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Badges</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isMe = row.is_current_user;
                  return (
                    <tr
                      key={row.user_id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isMe ? 'rgba(37,99,235,0.08)' : 'transparent',
                        fontWeight: isMe ? 700 : 500,
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '16px 20px', fontSize: '1.05rem', fontWeight: 900 }}>
                        {row.rank === 1 ? '🥇 1st' : row.rank === 2 ? '🥈 2nd' : row.rank === 3 ? '🥉 3rd' : `#${row.rank}`}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: isMe ? '#2563eb' : 'var(--bg-main)', color: isMe ? '#fff' : 'var(--text-dark)', border: isMe ? '2px solid #2563eb' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                            {row.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: isMe ? 800 : 700 }}>
                              {row.name} {isMe && <span style={{ fontSize: '0.7rem', backgroundColor: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px' }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '0.785rem', color: 'var(--text-medium)' }}>{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563eb' }}>
                          {row.xp} XP
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                        {row.courses_completed} Completed
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                        {row.learning_hours} hrs
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', fontWeight: 800, fontSize: '0.85rem' }}>
                          🏅 {row.badges_count}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
