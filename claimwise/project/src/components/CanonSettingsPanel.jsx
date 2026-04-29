import React, { useState, useEffect } from 'react';
import { Settings, Sliders, ToggleLeft, ToggleRight, RotateCcw, Save, X, Info } from 'lucide-react';
import confidencePolicyService, { DEFAULT_THRESHOLDS, BAND_META } from '../services/confidencePolicyService';

const THEME = {
  bg: '#1a1a2e',
  card: '#16213e',
  accent: '#e94560',
  text: '#eeeeee',
  textMuted: '#8892a4',
  border: '#2a2a4a',
  inputBg: '#0f1729',
};

const THRESHOLD_KEYS = ['red_block', 'amber_review', 'normal_review'];

export default function CanonSettingsPanel({ onClose }) {
  const [thresholds, setThresholds] = useState({ ...DEFAULT_THRESHOLDS });
  const [autoApply, setAutoApply] = useState(true);
  const [autoApplyMin, setAutoApplyMin] = useState(0.90);
  const [showExplanations, setShowExplanations] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await confidencePolicyService.getSettings();
        setThresholds({ ...settings.thresholds });
        setAutoApply(settings.autoApplyHighConfidence);
        setAutoApplyMin(settings.autoApplyMinConfidence);
        setShowExplanations(settings.showExplanations);
      } catch {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const validateThresholds = (t) => {
    if (t.red_block >= t.amber_review) {
      return 'Red Block threshold must be less than Amber Review';
    }
    if (t.amber_review >= t.normal_review) {
      return 'Amber Review threshold must be less than Normal Review';
    }
    for (const key of THRESHOLD_KEYS) {
      if (t[key] < 0 || t[key] > 1) {
        return 'All thresholds must be between 0 and 1';
      }
    }
    return null;
  };

  const handleThresholdChange = (key, value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const clamped = Math.round(Math.min(1, Math.max(0, num)) * 100) / 100;
    const next = { ...thresholds, [key]: clamped };
    setThresholds(next);
    const validationError = validateThresholds(next);
    setError(validationError);
  };

  const handleSave = async () => {
    const validationError = validateThresholds(thresholds);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await confidencePolicyService.updateSettings({
        thresholds: { ...thresholds },
        autoApplyHighConfidence: autoApply,
        autoApplyMinConfidence: autoApplyMin,
        showExplanations,
      });
      setSuccessMsg('Settings saved successfully');
    } catch (e) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    try {
      const defaults = await confidencePolicyService.resetToDefaults();
      setThresholds({ ...defaults.thresholds });
      setAutoApply(defaults.autoApplyHighConfidence);
      setAutoApplyMin(defaults.autoApplyMinConfidence);
      setShowExplanations(defaults.showExplanations);
      setError(null);
      setConfirmReset(false);
      setSuccessMsg('Settings reset to defaults');
    } catch {
      setError('Failed to reset settings');
    }
  };

  const classifyScore = (score) => {
    if (score < thresholds.red_block) return 'red_block';
    if (score < thresholds.amber_review) return 'amber_review';
    if (score < thresholds.normal_review) return 'normal_review';
    return 'high_confidence';
  };

  const pct = (v) => `${Math.round(v * 100)}%`;

  // --- Styles ---

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const panelStyle = {
    backgroundColor: THEME.bg,
    color: THEME.text,
    borderRadius: 12,
    width: 560,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: `1px solid ${THEME.border}`,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderBottom: `1px solid ${THEME.border}`,
  };

  const bodyStyle = {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  };

  const cardStyle = {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: 16,
    border: `1px solid ${THEME.border}`,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const sliderStyle = {
    width: '100%',
    accentColor: THEME.accent,
    cursor: 'pointer',
    height: 6,
  };

  const btnBase = {
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.15s',
  };

  const toggleBtnStyle = (active) => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: active ? '#22c55e' : THEME.textMuted,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 0,
  });

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...panelStyle, padding: 40, textAlign: 'center' }}>
          <Sliders size={32} style={{ color: THEME.accent, marginBottom: 12 }} />
          <div style={{ color: THEME.textMuted }}>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={20} style={{ color: THEME.accent }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Canon Confidence Settings</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.textMuted,
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div style={bodyStyle}>
          {/* Error / Success banners */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                border: '1px solid #ef4444',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13,
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}
          {successMsg && (
            <div
              style={{
                backgroundColor: 'rgba(34,197,94,0.15)',
                border: '1px solid #22c55e',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13,
                color: '#86efac',
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Threshold Sliders */}
          <div style={cardStyle}>
            <div style={{ ...labelStyle, marginBottom: 14, fontSize: 13 }}>
              <Sliders size={14} />
              Confidence Band Thresholds
            </div>

            {THRESHOLD_KEYS.map((key) => {
              const meta = BAND_META[key];
              return (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: meta.color,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pct(thresholds[key])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={thresholds[key]}
                    onChange={(e) => handleThresholdChange(key, e.target.value)}
                    style={{ ...sliderStyle, accentColor: meta.color }}
                  />
                  <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>
                    {meta.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Band Preview */}
          <div style={cardStyle}>
            <div style={{ ...labelStyle, marginBottom: 12, fontSize: 13 }}>
              <Info size={14} />
              Band Preview
            </div>
            <div
              style={{
                position: 'relative',
                height: 32,
                borderRadius: 6,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              {/* Red block: 0 -> red_block */}
              <div
                style={{
                  width: `${thresholds.red_block * 100}%`,
                  backgroundColor: BAND_META.red_block.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  minWidth: thresholds.red_block > 0.08 ? undefined : 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {thresholds.red_block >= 0.12 && 'Red'}
              </div>
              {/* Amber: red_block -> amber_review */}
              <div
                style={{
                  width: `${(thresholds.amber_review - thresholds.red_block) * 100}%`,
                  backgroundColor: BAND_META.amber_review.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {(thresholds.amber_review - thresholds.red_block) >= 0.12 && 'Amber'}
              </div>
              {/* Normal: amber_review -> normal_review */}
              <div
                style={{
                  width: `${(thresholds.normal_review - thresholds.amber_review) * 100}%`,
                  backgroundColor: BAND_META.normal_review.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {(thresholds.normal_review - thresholds.amber_review) >= 0.12 && 'Normal'}
              </div>
              {/* High confidence: normal_review -> 1.0 */}
              <div
                style={{
                  width: `${(1 - thresholds.normal_review) * 100}%`,
                  backgroundColor: BAND_META.high_confidence.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {(1 - thresholds.normal_review) >= 0.08 && 'High'}
              </div>
            </div>
            {/* Boundary markers */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: THEME.textMuted,
                marginTop: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>0%</span>
              <span>{pct(thresholds.red_block)}</span>
              <span>{pct(thresholds.amber_review)}</span>
              <span>{pct(thresholds.normal_review)}</span>
              <span>100%</span>
            </div>
          </div>

          {/* Auto-Apply Toggle */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ ...labelStyle, marginBottom: 2, fontSize: 13 }}>
                  Auto-Apply High Confidence
                </div>
                <div style={{ fontSize: 12, color: THEME.textMuted }}>
                  Automatically apply canon changes when confidence exceeds the minimum threshold
                </div>
              </div>
              <button
                onClick={() => setAutoApply(!autoApply)}
                style={toggleBtnStyle(autoApply)}
                aria-label="Toggle auto-apply"
              >
                {autoApply ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            {autoApply && (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <label style={{ fontSize: 12, color: THEME.textMuted }}>
                    Minimum confidence for auto-apply
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={autoApplyMin}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= 1) setAutoApplyMin(v);
                      }}
                      style={{
                        width: 72,
                        backgroundColor: THEME.inputBg,
                        color: THEME.text,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 4,
                        padding: '5px 8px',
                        fontSize: 13,
                        textAlign: 'center',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: BAND_META[classifyScore(autoApplyMin)].color,
                        fontWeight: 600,
                      }}
                    >
                      {pct(autoApplyMin)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Show Explanations Toggle */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ ...labelStyle, marginBottom: 2, fontSize: 13 }}>
                  <Info size={14} />
                  Show Explanations
                </div>
                <div style={{ fontSize: 12, color: THEME.textMuted }}>
                  Display confidence reasoning for each canon queue item
                </div>
              </div>
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                style={toggleBtnStyle(showExplanations)}
                aria-label="Toggle explanations"
              >
                {showExplanations ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 4,
            }}
          >
            <button
              onClick={handleReset}
              onBlur={() => setConfirmReset(false)}
              style={{
                ...btnBase,
                backgroundColor: confirmReset ? '#7f1d1d' : 'transparent',
                color: confirmReset ? '#fca5a5' : THEME.textMuted,
                border: `1px solid ${confirmReset ? '#ef4444' : THEME.border}`,
              }}
            >
              <RotateCcw size={14} />
              {confirmReset ? 'Click again to confirm' : 'Reset to Defaults'}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !!validateThresholds(thresholds)}
              style={{
                ...btnBase,
                backgroundColor:
                  saving || validateThresholds(thresholds) ? THEME.border : THEME.accent,
                color: saving || validateThresholds(thresholds) ? THEME.textMuted : '#fff',
                cursor:
                  saving || validateThresholds(thresholds) ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
