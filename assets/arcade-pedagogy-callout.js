/**
 * arcade-pedagogy-callout.js
 * Mr. Mac's Review Arcade — "📚 Why this matters" callout chip
 *
 * Renders a subtle context strip above/alongside a scholar question showing
 * which skill, standard, and unit the question targets.
 *
 * Usage:
 *   window.MrMacsPedagogy.renderCallout(containerEl, questionObj);
 *   const meta = window.MrMacsPedagogy.describeQuestion(questionObj);
 *
 * Idempotent guard: second <script> load is silently ignored.
 */

;(function (global) {
  'use strict';

  // ── Idempotent guard ────────────────────────────────────────────────────────
  if (global.MrMacsPedagogy) return;

  // ── Inject scoped CSS (once) ────────────────────────────────────────────────
  (function injectStyles() {
    const ID = 'mped-styles';
    if (document.getElementById(ID)) return;
    const style = document.createElement('style');
    style.id = ID;
    style.textContent = [
      '.mped-chip {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  font-size: 11px;',
      '  line-height: 1.4;',
      '  color: var(--muted, #aaa);',
      '  background: rgba(255,255,255,.04);',
      '  border: 1px solid rgba(255,255,255,.07);',
      '  border-radius: 4px;',
      '  padding: 4px 10px;',
      '  margin-bottom: 8px;',
      '  user-select: none;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  max-width: 100%;',
      '  box-sizing: border-box;',
      '}',
      '.mped-chip-icon {',
      '  flex-shrink: 0;',
      '  font-style: normal;',
      '}',
      '.mped-chip-text {',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '}',
      /* Suppress animation entirely if user prefers reduced motion */
      '@media (prefers-reduced-motion: no-preference) {',
      '  .mped-chip-enter {',
      '    animation: mped-fadein .15s ease both;',
      '  }',
      '  @keyframes mped-fadein {',
      '    from { opacity: 0; transform: translateY(-3px); }',
      '    to   { opacity: 1; transform: translateY(0); }',
      '  }',
      '}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
  })();

  // ── Standards tables ────────────────────────────────────────────────────────

  /**
   * NYS Global History Regents standard codes → human labels.
   * Keys follow the common "unit.subtopic" numbering teachers use on materials.
   */
  const NYS_GLOBAL = {
    '9.1':  'The World in 1750',
    '9.2':  'Enlightenment and Revolution',
    '9.3':  'Industrial Revolution',
    '9.4':  'Imperialism',
    '9.5':  'World War I',
    '9.6':  'Between the Wars',
    '9.7':  'World War II',
    '9.8':  'Cold War',
    '9.9':  'Decolonization',
    '9.10': 'Globalization',
    '10.1': 'The World in 1750',
    '10.2': 'Enlightenment and Revolution',
    '10.3': 'Industrialization and Imperialism',
    '10.4': 'World War I and Revolution',
    '10.5': 'Between the Wars',
    '10.6': 'World War II and Holocaust',
    '10.7': 'Cold War Era',
    '10.8': 'Decolonization and Independence',
    '10.9': 'Globalization and the Digital Age',
    '10.10':'Contemporary Issues',
  };

  /** NYS US History Regents standard codes → human labels. */
  const NYS_US = {
    '8.1':  'The Constitution',
    '8.2':  'New Nation (1783–1800)',
    '8.3':  'Expansion and Reform',
    '8.4':  'Civil War and Reconstruction',
    '8.5':  'Industrialization and Immigration',
    '8.6':  'Progressive Era',
    '8.7':  'World War I Era',
    '8.8':  'Prosperity and Depression',
    '8.8c': 'Civil Rights Movement',
    '8.9':  'World War II Era',
    '8.10': 'Post-War America',
    '8.11': 'Civil Rights and Reform',
    '8.12': 'Contemporary America',
    '11.1': 'Reconstruction',
    '11.2': 'Gilded Age',
    '11.3': 'Progressive Era',
    '11.4': 'World War I',
    '11.5': 'Prosperity and Depression',
    '11.6': 'World War II',
    '11.7': 'Cold War',
    '11.8': 'Post-War Social Change',
    '11.9': 'Civil Rights Movement',
    '11.10':'Conservative Era',
    '11.11':'Contemporary America',
  };

  /** AP Psychology units (2024–25 CED redesign: 5 units). */
  const AP_PSYCH = {
    '1':  'Biological Bases of Behavior',
    '2':  'Cognition',
    '3':  'Development and Learning',
    '4':  'Social, Emotional, and Personality',
    '5':  'Mental and Physical Health',
    /* Legacy 9-unit keys kept for older question sets */
    '1a': 'History and Approaches',
    '2a': 'Biological Bases of Behavior',
    '3a': 'Sensation and Perception',
    '4a': 'States of Consciousness',
    '5a': 'Learning',
    '6a': 'Cognition',
    '7a': 'Motivation, Emotion, Personality',
    '8a': 'Clinical Psychology',
    '9a': 'Social Psychology',
  };

  /** AP World History periods. */
  const AP_WORLD = {
    '1': 'Period 1 · c. 1200–1450',
    '2': 'Period 2 · c. 1450–1750',
    '3': 'Period 3 · c. 1750–1900',
    '4': 'Period 4 · c. 1900–Present',
    /* Older 6-period framework */
    '1a': 'Period 1 · Technological and Environmental Transformations (to c. 600 BCE)',
    '2a': 'Period 2 · Organization and Reorganization (c. 600 BCE–600 CE)',
    '3a': 'Period 3 · Regional and Interregional Interactions (c. 600–1450)',
    '4a': 'Period 4 · Global Interactions (c. 1450–1750)',
    '5a': 'Period 5 · Industrialization and Global Integration (c. 1750–1900)',
    '6a': 'Period 6 · Accelerating Global Change (c. 1900–Present)',
  };

  /** AP United States Government and Politics units. */
  const AP_GOV = {
    '1': 'Foundations of American Democracy',
    '2': 'Interactions Among Branches of Government',
    '3': 'Civil Liberties and Civil Rights',
    '4': 'American Political Ideologies and Beliefs',
    '5': 'Political Participation',
  };

  /**
   * Exported lookup map keyed by canonical course identifier strings.
   * Values are the per-course standard-code → label objects above.
   */
  const STANDARDS = {
    /* NYS Global History variants */
    'nys-global':           NYS_GLOBAL,
    'global':               NYS_GLOBAL,
    'global10':             NYS_GLOBAL,
    'global9':              NYS_GLOBAL,
    'nys_global':           NYS_GLOBAL,
    /* NYS US History variants */
    'nys-us':               NYS_US,
    'us-history':           NYS_US,
    'ushistory':            NYS_US,
    'nys_us':               NYS_US,
    /* AP courses */
    'ap-psych':             AP_PSYCH,
    'ap_psych':             AP_PSYCH,
    'ap-psychology':        AP_PSYCH,
    'ap-world':             AP_WORLD,
    'ap_world':             AP_WORLD,
    'ap-world-history':     AP_WORLD,
    'ap-gov':               AP_GOV,
    'ap_gov':               AP_GOV,
    'ap-government':        AP_GOV,
    'ap-us-government':     AP_GOV,
  };

  // ── Skill descriptors ───────────────────────────────────────────────────────

  /**
   * Tag/skill token → friendly label.
   * Keys are lowercase; matching is case-insensitive substring-aware.
   */
  const SKILLS = {
    'source-based':   'Source-based reading',
    'sourcing':       'Source-based reading',
    'primary-source': 'Source-based reading',
    'primary source': 'Source-based reading',
    'context':        'Historical context',
    'contextualization': 'Historical context',
    'compare':        'Compare and contrast',
    'comparison':     'Compare and contrast',
    'causation':      'Cause and effect',
    'cause-effect':   'Cause and effect',
    'cause and effect': 'Cause and effect',
    'argument':       'Argument from evidence',
    'argumentation':  'Argument from evidence',
    'crq':            'Constructed Response',
    'dbq':            'Document-Based Question',
    'mcq':            'Multiple Choice',
    'recall':         'Recall',
    'vocabulary':     'Vocabulary',
    'vocab':          'Vocabulary',
    'analysis':       'Analysis',
    'continuity':     'Continuity and Change',
    'change':         'Continuity and Change',
    'periodization':  'Periodization',
  };

  // ── Event emitter (minimal) ─────────────────────────────────────────────────

  const _handlers = Object.create(null);

  function _on(event, handler) {
    if (typeof handler !== 'function') return;
    if (!_handlers[event]) _handlers[event] = [];
    _handlers[event].push(handler);
  }

  function _off(event, handler) {
    if (!_handlers[event]) return;
    _handlers[event] = _handlers[event].filter(function (h) { return h !== handler; });
  }

  function _emit(event, detail) {
    var list = _handlers[event];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      try { list[i](detail); } catch (e) { /* absorb handler errors */ }
    }
  }

  // ── Core logic ──────────────────────────────────────────────────────────────

  /**
   * Normalize a course identifier to a consistent lowercase key.
   * @param {string|undefined} raw
   * @returns {string}
   */
  function _normalizeCourse(raw) {
    if (!raw) return '';
    return String(raw).toLowerCase().replace(/[\s_]+/g, '-').trim();
  }

  /**
   * Resolve a human-readable course name from the question object.
   * @param {object} q
   * @returns {string}
   */
  function _resolveCourseLabel(q) {
    var courseKey = _normalizeCourse(q.course);

    // Explicit overrides for display names
    var displayMap = {
      'nys-global':       'NYS Regents Global',
      'global':           'NYS Regents Global',
      'global10':         'NYS Regents Global 10',
      'global9':          'NYS Regents Global 9',
      'nys_global':       'NYS Regents Global',
      'nys-us':           'NYS Regents US History',
      'us-history':       'NYS Regents US History',
      'ushistory':        'NYS Regents US History',
      'nys_us':           'NYS Regents US History',
      'ap-psych':         'AP Psychology',
      'ap_psych':         'AP Psychology',
      'ap-psychology':    'AP Psychology',
      'ap-world':         'AP World History',
      'ap_world':         'AP World History',
      'ap-world-history': 'AP World History',
      'ap-gov':           'AP Government',
      'ap_gov':           'AP Government',
      'ap-government':    'AP Government',
      'ap-us-government': 'AP US Gov & Politics',
    };

    return displayMap[courseKey] || (q.course ? String(q.course) : '');
  }

  /**
   * Resolve a human-readable standard label from the question object.
   * Checks q.standard, q.set, then q.unit as fallbacks.
   * @param {object} q
   * @returns {string}
   */
  function _resolveStandardLabel(q) {
    var courseKey = _normalizeCourse(q.course);
    var table = STANDARDS[courseKey] || null;

    // Try explicit standard field first
    var code = q.standard || q.set || '';
    if (code && table) {
      var label = table[String(code)];
      if (label) return label;
    }

    // Try unit number against the same table
    if (q.unit !== undefined && q.unit !== null && table) {
      var unitKey = String(q.unit);
      var unitLabel = table[unitKey];
      if (unitLabel) return unitLabel;
    }

    // Fall back to raw values
    if (code) return String(code);
    return '';
  }

  /**
   * Resolve a human-readable skill label from the question object.
   * Checks q.skill first, then iterates q.tags array.
   * @param {object} q
   * @returns {string}
   */
  function _resolveSkillLabel(q) {
    // Direct skill field
    if (q.skill) {
      var skillKey = String(q.skill).toLowerCase();
      if (SKILLS[skillKey]) return SKILLS[skillKey];
      // Substring match
      for (var k in SKILLS) {
        if (skillKey.indexOf(k) !== -1 || k.indexOf(skillKey) !== -1) {
          return SKILLS[k];
        }
      }
      // Return as-is (capitalized)
      return String(q.skill).charAt(0).toUpperCase() + String(q.skill).slice(1);
    }

    // Scan tags array
    if (Array.isArray(q.tags)) {
      for (var i = 0; i < q.tags.length; i++) {
        var tag = String(q.tags[i]).toLowerCase();
        if (SKILLS[tag]) return SKILLS[tag];
        for (var tk in SKILLS) {
          if (tag.indexOf(tk) !== -1) return SKILLS[tk];
        }
      }
    }

    return '';
  }

  /**
   * Resolve a unit/era string for display.
   * @param {object} q
   * @returns {string}
   */
  function _resolveEra(q) {
    if (q.era) return String(q.era);
    if (q.period) return 'Period ' + q.period;
    if (q.unit !== undefined && q.unit !== null) return 'Unit ' + q.unit;
    if (q.day !== undefined && q.day !== null) return 'Day ' + q.day;
    return '';
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Describe a question object, returning structured metadata.
   *
   * @param {object} q  — question object with any combination of:
   *   course, set, day, unit, tags, skill, standard, era, period
   * @returns {{ skill: string, standard: string, unit: string, era: string }}
   */
  function describeQuestion(q) {
    if (!q || typeof q !== 'object') {
      return { skill: '', standard: '', unit: '', era: '' };
    }
    return {
      skill:    _resolveSkillLabel(q),
      standard: _resolveStandardLabel(q),
      unit:     _resolveEra(q),
      era:      q.era ? String(q.era) : '',
    };
  }

  /**
   * Build the display text string shown inside the chip.
   * Format: "📚 Tests: <course> · <standard> · <skill>"
   * Omits any empty segments gracefully.
   *
   * @param {object} q
   * @returns {string}
   */
  function _buildChipText(q) {
    var meta    = describeQuestion(q);
    var course  = _resolveCourseLabel(q);

    var parts = [];
    if (course)         parts.push(course);
    if (meta.standard)  parts.push(meta.standard);
    else if (meta.unit) parts.push(meta.unit);
    if (meta.skill)     parts.push(meta.skill);

    if (parts.length === 0) return '📚 Review question';
    return '📚 Tests: ' + parts.join(' · ');
  }

  /**
   * Render a callout chip into a DOM container.
   * Idempotent: removes any existing chip first.
   *
   * @param {Element} container  — DOM element to prepend the chip into
   * @param {object}  q          — question metadata object
   * @param {object}  [opts]     — optional overrides
   * @param {string}  [opts.position='prepend'] — 'prepend' | 'append'
   * @param {boolean} [opts.animate=true]
   */
  function renderCallout(container, q, opts) {
    if (!container || !(container instanceof Element)) return;

    opts = opts || {};
    var position = opts.position === 'append' ? 'append' : 'prepend';
    var animate  = opts.animate !== false;

    // Remove any pre-existing chip to stay idempotent
    var existing = container.querySelector('.mped-chip');
    if (existing) existing.parentNode.removeChild(existing);

    var text = _buildChipText(q || {});

    var chip = document.createElement('div');
    chip.className = 'mped-chip' + (animate ? ' mped-chip-enter' : '');
    chip.setAttribute('aria-label', text);
    chip.setAttribute('role', 'note');

    var icon = document.createElement('span');
    icon.className = 'mped-chip-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '📚';

    var label = document.createElement('span');
    label.className = 'mped-chip-text';
    // Strip the emoji from the label since it's in the icon span
    label.textContent = text.replace(/^📚\s*/, '');

    chip.appendChild(icon);
    chip.appendChild(label);

    if (position === 'append') {
      container.appendChild(chip);
    } else {
      container.insertBefore(chip, container.firstChild);
    }

    _emit('callout:rendered', { container: container, q: q, text: text });
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  global.MrMacsPedagogy = {
    renderCallout:   renderCallout,
    describeQuestion: describeQuestion,
    STANDARDS:       STANDARDS,
    SKILLS:          SKILLS,
    on:              _on,
    off:             _off,
  };

}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this));
