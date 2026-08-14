import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import trainerService from '../../services/trainerService';
import '../../styles/trainer/performance-reports.css';

export default function PerformanceReports() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [modules, setModules] = useState([]);
  const [strugglingModules, setStrugglingModules] = useState([]);
  const [isBatchesLoading, setIsBatchesLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsBatchesLoading(true);
        const result = await trainerService.getBatches();
        setBatches(result);
        if (result.length > 0) {
          setSelectedBatch(result[0].id);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Error loading batches');
      } finally {
        setIsBatchesLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Fetch modules and alerts when selectedBatch changes
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchAnalytics = async () => {
      try {
        setIsDataLoading(true);
        const [modData, alertData] = await Promise.all([
          trainerService.getModuleAnalytics(selectedBatch),
          trainerService.getAnalyticsAlerts(selectedBatch)
        ]);
        // Map backend response fields (e.g. name or module_name, average_score) to average score keys
        const mappedModules = (modData || []).map(m => ({
          id: m.id || m.module_id,
          name: m.name || m.module_name || 'Module',
          avgScore: m.avgScore !== undefined ? m.avgScore : (m.average_score !== undefined ? m.average_score : 0)
        }));

        const mappedAlerts = (alertData || []).map(m => ({
          id: m.id || m.module_id,
          name: m.name || m.module_name || 'Module',
          avgScore: m.avgScore !== undefined ? m.avgScore : (m.average_score !== undefined ? m.average_score : 0)
        }));

        setModules(mappedModules);
        setStrugglingModules(mappedAlerts);
      } catch (err) {
        console.error('Error loading module analytics:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedBatch]);

  // Compute average score of modules
  const totalAvg = modules.length > 0 
    ? Math.round(modules.reduce((sum, m) => sum + m.avgScore, 0) / modules.length)
    : 0;

  const getBarColorClass = (score) => {
    if (score >= 70) return 'bar-high';
    if (score >= 50) return 'bar-mid';
    return 'bar-low';
  };

  if (isBatchesLoading) {
    return (
      <div className="perf-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Loading batches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perf-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="perf-container" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No Batches Available</h2>
        <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>Performance analytics will become active once batches are assigned.</p>
      </div>
    );
  }

  return (
    <div className="perf-container">
      {/* 1. Page Header */}
      <div className="perf-banner">
        <div className="perf-banner-left">
          <h2>Performance Analytics</h2>
          <p>Analyze performance metrics across course modules and view batch diagnostic alerts.</p>
        </div>
        <div className="perf-banner-right">
          <div className="perf-summary-pill">
            <Icon name="bar-chart-2" style={{ width: '15px', height: '15px' }} />
            <span>Avg Batch Score: {totalAvg}%</span>
          </div>
        </div>
      </div>

      {/* 2. Split Layout */}
      <div className="perf-split-layout">
        {/* Left Side: Module Performance Bars */}
        <div className="perf-chart-card">
          <div className="perf-chart-header">
            <h3 className="perf-chart-title">Module Performance Average</h3>
            <select
              className="perf-chart-batch-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>
              ))}
            </select>
          </div>

          <div className="perf-chart-list">
            {isDataLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>
                Loading analytics data...
              </div>
            ) : modules.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
                No module evaluation logs found for this batch.
              </div>
            ) : (
              modules.map((module) => (
                <div key={module.id} className="perf-module-item">
                  <div className="perf-module-info">
                    <span className="perf-module-name">{module.name}</span>
                    <span className="perf-module-avg" style={{
                      color: module.avgScore >= 70 ? '#059669' : module.avgScore >= 50 ? '#d97706' : '#dc2626'
                    }}>
                      {module.avgScore}% Batch Avg
                    </span>
                  </div>
                  <div className="perf-bar-track">
                    <div
                      className={`perf-bar-fill ${getBarColorClass(module.avgScore)}`}
                      style={{ width: `${module.avgScore}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Alerts Panel */}
        <div className="perf-alerts-card">
          <div className="perf-alerts-header">
            <Icon name="alert-triangle" style={{ width: '20px', height: '20px', color: '#d97706' }} />
            <h3 className="perf-alerts-title">Diagnostic Alerts</h3>
          </div>

          <div className="perf-alerts-list">
            {isDataLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>
                Checking for alerts...
              </div>
            ) : strugglingModules.length === 0 ? (
              <div className="perf-alerts-empty">
                <Icon name="check-circle" className="perf-alerts-empty-icon" />
                <span className="perf-alerts-empty-title">All Modules On Track</span>
                <span className="perf-alerts-empty-desc">All average module scores are above 65%.</span>
              </div>
            ) : (
              strugglingModules.map((module) => (
                <div key={module.id} className="perf-alert-item">
                  <div className="perf-alert-icon-wrap">
                    <Icon name="trending-down" style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div className="perf-alert-content">
                    <span className="perf-alert-item-title">{module.name}</span>
                    <span className="perf-alert-desc">
                      Concept weakness identified. Average score fell below recommended 65% benchmark.
                    </span>
                    <div className="perf-alert-badge">
                      {module.avgScore}% Batch Average — Review Recommended
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
