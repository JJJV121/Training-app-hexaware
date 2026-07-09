import React, { useState } from 'react';
import Icon from '../Icon';
import { PERFORMANCE_DATA } from '../../data/trainerMockData';
import '../../styles/trainer/performance-reports.css';

export default function PerformanceReports() {
  const [selectedBatch, setSelectedBatch] = useState('java');

  const modules = selectedBatch === 'java' ? PERFORMANCE_DATA.modules : PERFORMANCE_DATA.cloudModules;
  const batchLabel = selectedBatch === 'java' ? PERFORMANCE_DATA.batchLabel : 'Batch 2026 — Cloud Architecture';

  // Struggling concepts are those with average score below 65%
  const strugglingModules = modules.filter((m) => m.avgScore < 65);

  const getBarColorClass = (score) => {
    if (score >= 70) return 'bar-high';
    if (score >= 50) return 'bar-mid';
    return 'bar-low';
  };

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
            <span>Avg Batch Score: 68%</span>
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
              <option value="java">Batch 2026 — Java Full-Stack</option>
              <option value="cloud">Batch 2026 — Cloud Architecture</option>
            </select>
          </div>

          <div className="perf-chart-list">
            {modules.map((module) => (
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
            ))}
          </div>
        </div>

        {/* Right Side: Alerts Panel */}
        <div className="perf-alerts-card">
          <div className="perf-alerts-header">
            <Icon name="alert-triangle" style={{ width: '20px', height: '20px', color: '#d97706' }} />
            <h3 className="perf-alerts-title">Diagnostic Alerts</h3>
          </div>

          <div className="perf-alerts-list">
            {strugglingModules.length === 0 ? (
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
