import { useState, useEffect } from 'react';
import gamificationService from '../services/gamificationService';
import Icon from '../components/Icon';
import '../styles/main.css';

export default function Badges() {
  const [badgeData, setBadgeData] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBadges = async (force = false) => {
    try {
      if (!badgeData || force) setIsLoading(true);
      setError(null);
      const data = await gamificationService.getBadges(force);
      setBadgeData(data);
    } catch (err) {
      console.error("Failed to load badges:", err);
      setError("Failed to load badges.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const totalBadges = badgeData?.total_badges || 0;
  const earnedBadges = badgeData?.earned_badges || 0;
  const totalXp = badgeData?.total_xp || 0;
  const level = badgeData?.level || 1;
  const streak = badgeData?.current_streak || 1;
  const badgesList = badgeData?.badges || [];

  const filteredBadges = badgesList.filter(b => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'earned') return b.is_earned;
    if (categoryFilter === 'locked') return !b.is_earned;
    return b.category === categoryFilter;
  });

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', boxShadow: '0 6px 16px rgba(16,185,129,0.3)' }}>
              🏅
            </div>
            <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
              Badges & Achievements
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '0.95rem' }}>
            Track your earned badges, unlock new achievements, and gain bonus XP as you master course topics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchBadges(true)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-dark)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          🔄 Synchronize Badges
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-medium)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
          <h3 style={{ margin: 0, fontWeight: 700 }}>Synchronizing badge achievements...</h3>
        </div>
      ) : error ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--accent-red)' }}>
          <h3>{error}</h3>
          <button type="button" onClick={() => fetchBadges(true)} style={{ marginTop: '12px', padding: '10px 20px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Header Stats Overview Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total XP</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{totalXp} XP</div>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Level</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>Level {level}</div>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Streak</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>🔥 {streak} Days</div>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Badges Unlocked</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{earnedBadges} / {totalBadges}</div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Badges (${totalBadges})` },
              { id: 'earned', label: `✓ Earned (${earnedBadges})` },
              { id: 'locked', label: `🔒 Locked (${totalBadges - earnedBadges})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: categoryFilter === tab.id ? '1px solid #10b981' : '1px solid var(--border-color)',
                  backgroundColor: categoryFilter === tab.id ? 'rgba(16,185,129,0.12)' : 'var(--card-bg)',
                  color: categoryFilter === tab.id ? '#059669' : 'var(--text-medium)',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '22px' }}>
            {filteredBadges.map((badge) => {
              const isEarned = badge.is_earned;
              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  style={{
                    padding: '26px 20px 20px 20px',
                    borderRadius: '20px',
                    backgroundColor: 'var(--card-bg)',
                    border: isEarned ? '2px solid rgba(16,185,129,0.45)' : '1px solid var(--border-color)',
                    boxShadow: isEarned ? '0 10px 24px rgba(16,185,129,0.12)' : '0 4px 12px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isEarned ? 1 : 0.65,
                    filter: isEarned ? 'none' : 'grayscale(60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  {!isEarned && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1rem', backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      🔒
                    </div>
                  )}

                  {/* Badge Icon Container */}
                  <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: isEarned ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))' : 'var(--bg-main)', border: isEarned ? '3px solid #10b981' : '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '14px', boxShadow: isEarned ? '0 8px 20px rgba(16,185,129,0.2)' : 'none' }}>
                    {badge.icon}
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    {badge.name}
                  </h3>

                  <p style={{ margin: '0 0 16px 0', fontSize: '0.835rem', color: 'var(--text-medium)', lineHeight: 1.45, minHeight: '40px', overflow: 'hidden' }}>
                    {badge.description}
                  </p>

                  <div style={{ marginTop: 'auto', width: '100%' }}>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                        backgroundColor: isEarned ? 'rgba(16,185,129,0.12)' : 'var(--bg-main)',
                        color: isEarned ? '#059669' : 'var(--text-medium)',
                        border: isEarned ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)',
                        display: 'inline-block'
                      }}
                    >
                      {isEarned ? '✓ Earned (+' + badge.xp_bonus + ' XP)' : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Badge Detail Popover Modal */}
      {selectedBadge && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '36px 30px', maxWidth: '460px', width: '100%', border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.25)', textAlign: 'center', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              style={{ position: 'absolute', top: '18px', right: '18px', border: 'none', backgroundColor: 'var(--bg-main)', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', cursor: 'pointer', color: 'var(--text-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: selectedBadge.is_earned ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))' : 'var(--bg-main)', border: selectedBadge.is_earned ? '4px solid #10b981' : '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.8rem', margin: '0 auto 18px auto', boxShadow: selectedBadge.is_earned ? '0 10px 24px rgba(16,185,129,0.25)' : 'none' }}>
              {selectedBadge.icon}
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              {selectedBadge.name}
            </h3>

            <span style={{ fontSize: '0.775rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', padding: '4px 12px', borderRadius: '10px', display: 'inline-block', marginBottom: '18px' }}>
              {selectedBadge.category}
            </span>

            <p style={{ margin: '0 0 24px 0', fontSize: '0.925rem', color: 'var(--text-medium)', lineHeight: 1.55 }}>
              {selectedBadge.description}
            </p>

            <div style={{ backgroundColor: 'var(--bg-main)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '22px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-medium)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Requirement Status
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                {selectedBadge.is_earned ? '✓ Completed 100%' : '🔒 Locked - Complete required course lessons'}
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${selectedBadge.progress_percentage}%`, backgroundColor: selectedBadge.is_earned ? '#10b981' : '#cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-medium)', fontWeight: 600 }}>
              <span>Bonus XP Reward: <strong style={{ color: '#2563eb' }}>+{selectedBadge.xp_bonus} XP</strong></span>
              <span>{selectedBadge.is_earned ? `Earned: ${selectedBadge.earned_at?.split('T')[0]}` : 'Locked'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
