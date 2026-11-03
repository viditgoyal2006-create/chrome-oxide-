/**
 * Laboratory Engine for Determination of Chromium Oxide (% Cr2O3) in Leather
 * Conforming to ISO 5398-1:2007 (IULTCS/IUC 8-1) / ASTM D2807 / IS 582 (Method L:2)
 * High-Realism Apparatus & Step-by-Step Animated Pouring / Weighing Simulation
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentSlide: 1,
    maxUnlockedSlide: 1,
    specimenId: 'bovine-upper',

    // Step 1: Specimen Sampling & Weighing
    step1: {
      balanceTared: false,
      specimenWeighed: false,
      isTransferring: false,
      measuredWeight: 1.5240
    },

    // Step 2: Acid Addition
    step2: {
      hno3Added: false,
      hclo4Added: false,
      isPouringHNO3: false,
      isPouringHClO4: false
    },

    // Step 3: Digestion & Wet Oxidation
    step3: {
      isHeating: false,
      digestionProgress: 0,
      oxidationDone: false,
      temp: 24.5
    },

    // Step 4: Cooling, Dilution & Chlorine Expulsion
    step4: {
      diluted: false,
      isPouringH2O: false,
      chlorineExpelled: false
    },

    // Step 5: Potassium Iodide & Dwell
    step5: {
      kiAdded: false,
      isPouringKI: false,
      darkDwellDone: false
    },

    // Step 6: Burette Setup & Titrant Calibration
    step6: {
      buretteFilled: false,
      stirrerActive: false
    },

    // Step 7: Titration & Starch Endpoint
    step7: {
      titrantVolume: 0.00,
      isTitrating: false,
      titrationMode: 'stop',
      starchAdded: false,
      endpointReached: false
    },

    // Step 8: Calculation & Verification
    step8: {
      reviewed: true,
      customW: null,
      customV1: null,
      customV0: 0.15,
      customN: 0.1000,
      customM: null
    }
  };

  let heatTimer = null;
  let titrateTimer = null;

  const $ = (id) => document.getElementById(id);

  function getSpecimen() {
    return window.LAB_STANDARDS.specimens.find(s => s.id === state.specimenId) || window.LAB_STANDARDS.specimens[0];
  }

  function renderApparatusChecklist(stepNum) {
    const listEl = $('apparatus-checklist-content');
    if (!listEl) return;
    const items = window.LAB_STANDARDS.stepApparatusDirectory[stepNum] || [];
    let html = '';
    items.forEach(item => {
      let liveValHtml = '';
      if (item.name.includes('Balance')) {
        const valStr = state.step1.specimenWeighed
          ? state.step1.measuredWeight.toFixed(4) + ' g'
          : (state.step1.balanceTared ? '0.0000 g' : '14.8520 g');
        liveValHtml = `<span class="checklist-live-reading" id="checklist-balance-val">Live: <strong>${valStr}</strong></span>`;
      }
      html += `
        <li class="checklist-item ${item.image ? 'checklist-item-has-thumb' : ''}">
          ${item.image 
            ? `<div class="checklist-thumb-box"><img src="${item.image}" alt="${item.name}" class="checklist-thumb-img" /></div>` 
            : `<span class="checklist-bullet">&bull;</span>`}
          <div class="checklist-text-wrap">
            <div class="checklist-item-title-row">
              <strong>${item.name}</strong>
              ${liveValHtml}
            </div>
            <span class="item-spec-note">${item.spec}</span>
          </div>
        </li>
      `;
    });
    listEl.innerHTML = html;
  }

  function renderGuidePanes(stepNum) {
    const guide = window.LAB_STANDARDS.studentPracticalGuide[stepNum];
    if (!guide) return;
    const howEl = $('guide-how-content');
    if (howEl) howEl.innerHTML = guide.how;
  }

  function isStepCompleted(stepNum) {
    switch (stepNum) {
      case 1:
        return state.step1.balanceTared && state.step1.specimenWeighed;
      case 2:
        return state.step2.hno3Added && state.step2.hclo4Added;
      case 3:
        return state.step3.oxidationDone;
      case 4:
        return state.step4.diluted && state.step4.chlorineExpelled;
      case 5:
        return state.step5.kiAdded && state.step5.darkDwellDone;
      case 6:
        return state.step6.buretteFilled && state.step6.stirrerActive;
      case 7:
        return state.step7.endpointReached;
      case 8:
        return true;
      default:
        return false;
    }
  }

  function updateStepLockState() {
    const completed = isStepCompleted(state.currentSlide);
    const badge = $('step-completion-badge');
    const actionBanner = $('sop-action-content');
    const nextBtn = $('btn-slide-next');
    const prevBtn = $('btn-slide-prev');

    if (completed) {
      if (state.currentSlide >= state.maxUnlockedSlide && state.maxUnlockedSlide < 8) {
        state.maxUnlockedSlide = state.currentSlide + 1;
      }
      if (badge) {
        badge.textContent = "STEP COMPLETED";
        badge.className = "step-status-tag unlocked";
      }
      if (actionBanner) {
        actionBanner.className = "directed-action-banner completed";
      }
      if (nextBtn) {
        nextBtn.disabled = (state.currentSlide >= 8);
      }
    } else {
      if (badge) {
        badge.textContent = "STEP INCOMPLETE";
        badge.className = "step-status-tag locked";
      }
      if (actionBanner) {
        actionBanner.className = "directed-action-banner pending";
      }
      if (nextBtn) {
        nextBtn.disabled = true;
      }
    }

    if (prevBtn) {
      prevBtn.disabled = (state.currentSlide <= 1);
    }

    document.querySelectorAll('.progress-step').forEach(stepEl => {
      const stepIdx = parseInt(stepEl.getAttribute('data-step'), 10);
      stepEl.classList.remove('active', 'completed', 'disabled');

      if (stepIdx === state.currentSlide) {
        stepEl.classList.add('active');
      } else if (stepIdx <= state.maxUnlockedSlide && isStepCompleted(stepIdx)) {
        stepEl.classList.add('completed');
      } else if (stepIdx > state.maxUnlockedSlide) {
        stepEl.classList.add('disabled');
      }
    });

    const counter = $('slide-progress-counter');
    if (counter) {
      counter.textContent = `Step ${state.currentSlide} of 8`;
    }
  }

  function updateTelemetry(label, unit, value, status) {
    if ($('telemetry-label')) $('telemetry-label').textContent = label;
    if ($('telemetry-unit')) $('telemetry-unit').textContent = unit;
    if ($('telemetry-value-display')) $('telemetry-value-display').textContent = value;
    if ($('telemetry-status-display')) $('telemetry-status-display').textContent = status;
  }

  function goToSlide(slideNum) {
    if (slideNum < 1 || slideNum > 8) return;
    if (slideNum > state.maxUnlockedSlide) return;

    clearInterval(heatTimer);
    clearInterval(titrateTimer);
    state.step3.isHeating = false;
    state.step7.isTitrating = false;

    state.currentSlide = slideNum;

    if ($('slide-number-display')) $('slide-number-display').textContent = `Slide ${slideNum} of 8`;

    renderGuidePanes(slideNum);
    renderApparatusChecklist(slideNum);

    switch (slideNum) {
      case 1: renderSlide1(); break;
      case 2: renderSlide2(); break;
      case 3: renderSlide3(); break;
      case 4: renderSlide4(); break;
      case 5: renderSlide5(); break;
      case 6: renderSlide6(); break;
      case 7: renderSlide7(); break;
      case 8: renderSlide8(); break;
    }

    updateStepLockState();
  }

  // ==========================================
  // SLIDE 1: Sampling & Specimen Weighing (With Animated Transfer)
  // ==========================================
  function renderSlide1() {
    const spec = getSpecimen();
    state.step1.measuredWeight = spec.nominalWeight;

    if ($('slide-title-display')) $('slide-title-display').textContent = "Leather Specimen Sampling & Analytical Weighing";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Sampling per ISO 2418 and 4-decimal precision mass determination per ISO 5398-1";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.1";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Sample the leather specimen according to <strong>ISO 2418</strong> from the official sampling position (butt/back edge).
      Finely dice into <strong>2 mm × 2 mm squares</strong> to guarantee complete acid penetration.
      Accurately weigh approximately <strong>1.5000 g</strong> to the nearest 0.0001 g on a calibrated Class I analytical balance.
    `;

    sopAction.textContent = (state.step1.balanceTared && state.step1.specimenWeighed)
      ? "Step Complete: Specimen accurately weighed. Proceed to Step 2 using 'Next Step'."
      : (state.step1.balanceTared ? "Required Action: Click 'Transfer Leather Specimen' to watch mechanical spatula transfer onto balance pan." : "Required Action: Click 'Tare Balance' to zero the balance pan.");

    const liveValStr = state.step1.specimenWeighed 
      ? state.step1.measuredWeight.toFixed(4) + ' g' 
      : (state.step1.balanceTared ? '0.0000 g' : '14.8520 g');

    bench.innerHTML = `
      <div class="weighing-rig-complete">
        <!-- Leather Dish Sample Stage -->
        <div class="leather-dish-sample" id="dish-source" title="Prepared Chrome-Tanned Leather Specimen">
          <div class="leather-chips-cluster" id="source-chips">
            <div class="leather-chip"></div>
            <div class="leather-chip" style="transform: rotate(15deg);"></div>
            <div class="leather-chip" style="transform: rotate(-10deg);"></div>
            <div class="leather-chip" style="transform: rotate(45deg);"></div>
            <div class="leather-chip" style="transform: rotate(30deg);"></div>
            <div class="leather-chip" style="transform: rotate(-25deg);"></div>
          </div>
          <!-- Transfer Particle Animation Element -->
          <div id="flying-chip" class="flying-chip-anim" style="display:none;"></div>
        </div>

        <!-- Realistic Analytical Balance Station with Clean Transparent Apparatus -->
        <div class="realistic-balance-station" id="balance-station-wrapper">
          <!-- Authentic Balance Instrument Image with Transparent Background -->
          <img src="assets/analytical_balance_screen.png" alt="Digital Analytical Balance" class="balance-instrument-img" draggable="false" />

          <!-- Inside Draft Enclosure: Watch Glass Resting on the Weighing Pan -->
          <div class="balance-pan-target-zone">
            <div class="weighing-boat-realistic" title="Borosilicate Watch Glass">
              <div id="boat-sample-chips" style="display:${state.step1.specimenWeighed ? 'flex' : 'none'}; gap:3px;">
                <span class="leather-chip" style="width:10px; height:10px;"></span>
                <span class="leather-chip" style="width:11px; height:9px; transform:rotate(20deg);"></span>
                <span class="leather-chip" style="width:9px; height:10px; transform:rotate(-15deg);"></span>
                <span class="leather-chip" style="width:10px; height:8px;"></span>
              </div>
            </div>
          </div>

          <!-- Animated Laboratory Spatula -->
          <div id="spatula-element" class="lab-spatula-visual" style="display:${state.step1.isTransferring ? 'block' : 'none'};">
            <div class="spatula-powder-tip"></div>
          </div>

          <!-- Falling Granules Stream into Watch Glass -->
          <div id="falling-grains-stream" class="falling-grains-stream" style="display:none;"></div>

          <!-- Red 7-Segment LED Digital Display Screen -->
          <div class="balance-display-overlay" title="Instrument Digital Readout">
            <div class="balance-vfd-digits" id="balance-live-digits">${liveValStr}</div>
          </div>
        </div>
      </div>
    `;

    controls.innerHTML = `
      <button id="btn-tare-balance" class="btn-step-action ${state.step1.balanceTared ? 'success' : 'primary'}">
        ⚖️ ${state.step1.balanceTared ? '✓ Balance Tared (0.0000 g)' : 'Tare Balance'}
      </button>
      <button id="btn-add-leather" class="btn-step-action ${state.step1.specimenWeighed ? 'success' : ''}" ${state.step1.balanceTared && !state.step1.isTransferring ? '' : 'disabled'}>
        📦 ${state.step1.specimenWeighed ? '✓ Specimen Weighed (' + state.step1.measuredWeight.toFixed(4) + ' g)' : 'Transfer Leather Specimen (~1.5 g)'}
      </button>
    `;

    updateTelemetry("Specimen Mass (W)", "grams", state.step1.specimenWeighed ? state.step1.measuredWeight.toFixed(4) + " g" : (state.step1.balanceTared ? "0.0000 g" : "--.---- g"), state.step1.specimenWeighed ? "Sample Mass Verified" : "Awaiting Transfer");

    $('btn-tare-balance').onclick = () => {
      state.step1.balanceTared = true;
      renderSlide1();
      renderApparatusChecklist(1);
      updateStepLockState();
    };

    $('btn-add-leather').onclick = () => {
      if (state.step1.isTransferring || state.step1.specimenWeighed) return;
      state.step1.isTransferring = true;
      const flyingChip = $('flying-chip');
      const spatula = $('spatula-element');
      const stream = $('falling-grains-stream');

      if (flyingChip) flyingChip.style.display = 'block';
      if (spatula) spatula.style.display = 'block';

      setTimeout(() => {
        if (spatula) spatula.classList.add('spatula-pouring-anim');
        if (stream) stream.style.display = 'block';
      }, 350);

      // Simulate digital readout ramp-up
      let currentVal = 0.0000;
      const targetVal = state.step1.measuredWeight;
      const digitsEl = $('balance-live-digits');

      const rampTimer = setInterval(() => {
        currentVal += 0.1800;
        const displayVal = (currentVal >= targetVal ? targetVal : currentVal).toFixed(4) + ' g';
        if (digitsEl) digitsEl.textContent = displayVal;
        const checkValEl = $('checklist-balance-val');
        if (checkValEl) checkValEl.innerHTML = `Live: <strong>${displayVal}</strong>`;
        if (currentVal >= targetVal) {
          clearInterval(rampTimer);
        }
      }, 70);

      setTimeout(() => {
        state.step1.specimenWeighed = true;
        state.step1.isTransferring = false;
        renderSlide1();
        renderApparatusChecklist(1);
        updateStepLockState();
      }, 1300);
    };
  }

  // ==========================================
  // SLIDE 2: Acid Reagents (With Tilt & Liquid Stream Pouring)
  // ==========================================
  function renderSlide2() {
    if ($('slide-title-display')) $('slide-title-display').textContent = "Acid Digestion Mixture Addition (HNO₃ + HClO₄)";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Quantitative transfer and chemical pouring under specialized perchloric fume cupboard";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.2";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Transfer the weighed specimen (<em>W</em> = <strong>${state.step1.measuredWeight.toFixed(4)} g</strong>) into a clean 500 mL Erlenmeyer conical flask.
      Inside an active perchloric fume cupboard, add:
      <br>&bull; <strong>15 mL concentrated Nitric Acid (HNO₃, 68–70%)</strong>
      <br>&bull; <strong>10 mL Perchloric Acid (HClO₄, 70%)</strong>
      <br><span style="color:#b45309; font-weight:bold;">⚠️ Safety Protocol:</span> Always pour concentrated Nitric acid first to pre-oxidize proteins before adding perchloric acid.
    `;

    sopAction.textContent = (state.step2.hno3Added && state.step2.hclo4Added)
      ? "Step Complete: Acids charged into flask. Proceed to Step 3 using 'Next Step'."
      : (!state.step2.hno3Added ? "Required Action: Click 'Pour 15 mL Conc. HNO₃' to simulate acid addition." : "Required Action: Click 'Pour 10 mL 70% HClO₄' to add perchloric acid.");

    bench.innerHTML = `
      <div class="pour-simulation-rig">
        
        <!-- Reagent Bottle 1: HNO3 Conc -->
        <div class="interactive-reagent-station">
          <div id="bottle-hno3" class="reagent-bottle-realistic ${state.step2.isPouringHNO3 ? 'tilt-pour-anim' : ''}">
            <div class="bottle-stopper" style="display:${state.step2.isPouringHNO3 ? 'none' : 'block'};"></div>
            <div class="bottle-chem-label">
              HNO₃ CONC<br>15 mL<br>ISO 5398
            </div>
            <!-- Dynamic Liquid Stream -->
            <div id="stream-hno3" class="liquid-pour-stream acid-stream" style="display:${state.step2.isPouringHNO3 ? 'block' : 'none'};"></div>
          </div>
          <span style="font-size:0.68rem; font-weight:700; color:#475569; margin-top:8px;">Conc. HNO₃</span>
        </div>

        <!-- 500 mL Erlenmeyer Flask with Reflux Funnel -->
        <div class="digestion-rig-complete">
          <div class="flask-funnel-top"></div>
          <div class="erlenmeyer-flask-body">
            <img src="assets/conical_flask_500ml.png" alt="500 mL Erlenmeyer Conical Flask" class="flask-image-realistic" draggable="false" />
            <div class="flask-conical">
              <div id="flask-acid-liquid" class="flask-liquid-contents ${state.step2.isPouringHNO3 || state.step2.isPouringHClO4 ? 'pouring-active' : ''} ${state.step2.hno3Added ? 'liquid-green-cr3' : ''}" style="height:${state.step2.hclo4Added ? '92px' : (state.step2.hno3Added ? '65px' : '26px')};">
                <span style="font-size:0.62rem; font-family:var(--font-mono); font-weight:700; color:#fff; background:rgba(0,0,0,0.45); padding:2px 6px; border-radius:3px;">
                  ${state.step2.hclo4Added ? 'HNO₃ + HClO₄ Acid Mix (25 mL)' : (state.step2.hno3Added ? '15 mL HNO₃ + Specimen' : 'Specimen Chips Only')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reagent Bottle 2: HClO4 70% -->
        <div class="interactive-reagent-station">
          <div id="bottle-hclo4" class="reagent-bottle-realistic clear-glass ${state.step2.isPouringHClO4 ? 'tilt-pour-right-anim' : ''}">
            <div class="bottle-stopper" style="background:#475569; display:${state.step2.isPouringHClO4 ? 'none' : 'block'};"></div>
            <div class="bottle-chem-label" style="background:#fff; border-color:#94a3b8;">
              HClO₄ 70%<br>10 mL<br>ISO 5398
            </div>
            <!-- Dynamic Liquid Stream -->
            <div id="stream-hclo4" class="liquid-pour-stream acid-stream" style="display:${state.step2.isPouringHClO4 ? 'block' : 'none'};"></div>
          </div>
          <span style="font-size:0.68rem; font-weight:700; color:#475569; margin-top:8px;">70% HClO₄</span>
        </div>

      </div>
    `;

    controls.innerHTML = `
      <button id="btn-pour-hno3" class="btn-step-action ${state.step2.hno3Added ? 'success' : 'primary'}" ${state.step2.isPouringHNO3 ? 'disabled' : ''}>
        🧪 ${state.step2.hno3Added ? '✓ 15 mL Conc. HNO₃ Added' : 'Pour 15 mL Conc. HNO₃'}
      </button>
      <button id="btn-pour-hclo4" class="btn-step-action ${state.step2.hclo4Added ? 'success' : ''}" ${state.step2.hno3Added && !state.step2.isPouringHClO4 ? '' : 'disabled'}>
        🧪 ${state.step2.hclo4Added ? '✓ 10 mL 70% HClO₄ Added' : 'Pour 10 mL 70% HClO₄'}
      </button>
    `;

    updateTelemetry("Acid Digestion Charge", "Volume Added", state.step2.hclo4Added ? "25 mL Total Acid" : (state.step2.hno3Added ? "15 mL HNO₃" : "0 mL"), "Fume Hood Active (0.55 m/s)");

    $('btn-pour-hno3').onclick = () => {
      if (state.step2.isPouringHNO3 || state.step2.hno3Added) return;
      state.step2.isPouringHNO3 = true;
      renderSlide2();

      setTimeout(() => {
        state.step2.hno3Added = true;
        state.step2.isPouringHNO3 = false;
        renderSlide2();
        updateStepLockState();
      }, 2200);
    };

    $('btn-pour-hclo4').onclick = () => {
      if (state.step2.isPouringHClO4 || state.step2.hclo4Added) return;
      state.step2.isPouringHClO4 = true;
      renderSlide2();

      setTimeout(() => {
        state.step2.hclo4Added = true;
        state.step2.isPouringHClO4 = false;
        renderSlide2();
        updateStepLockState();
      }, 2200);
    };
  }

  // ==========================================
  // SLIDE 3: Digestion & Wet Oxidation (With Animated Boiling Bubbles & Fumes)
  // ==========================================
  function renderSlide3() {
    if ($('slide-title-display')) $('slide-title-display').textContent = "Heating, Digestion & Wet Oxidation (Cr³⁺ ➔ Cr₂O₇²⁻)";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Controlled boiling in perchloric fume hood until conversion to sparkling ruby-orange";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.3";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Place the flask on an electric heating mantle inside the certified perchloric fume cupboard.
      Heat gently to boiling (<strong>110 – 130 °C</strong>). Dense red-brown nitrogen dioxide (NO₂) fumes will evolve as collagen proteins digest.
      Continue heating until perchloric acid boils, white dense fumes appear, and the solution shifts dramatically from dark muddy green (Cr³⁺) to a brilliant <strong>sparkling ruby-orange (Cr₂O₇²⁻, dichromate)</strong>.
      Maintain a gentle boil for exactly 1 to 2 minutes after the color change to ensure quantitative oxidation.
    `;

    sopAction.textContent = state.step3.oxidationDone
      ? "Step Complete: Wet oxidation to Cr(VI) dichromate achieved. Proceed to Step 4."
      : (state.step3.isHeating ? "Oxidation in Progress: Observe thermal boiling, brown NO₂ fuming, and orange color shift." : "Required Action: Click 'Turn ON Heating Mantle' to initiate wet digestion.");

    bench.innerHTML = `
      <div class="digestion-rig-complete">
        <!-- Evolving Fumes Animation -->
        <div class="fume-cloud-box">
          ${state.step3.isHeating ? `
            <div class="fume-cloud" style="width:36px; height:36px; background:${state.step3.digestionProgress > 60 ? 'rgba(255,255,255,0.7)' : 'rgba(180,83,9,0.55)'};"></div>
            <div class="fume-cloud" style="width:28px; height:28px; background:${state.step3.digestionProgress > 60 ? 'rgba(241,245,249,0.8)' : 'rgba(146,64,14,0.65)'}; animation-delay:0.4s;"></div>
            <div class="fume-cloud" style="width:32px; height:32px; background:${state.step3.digestionProgress > 60 ? 'rgba(226,232,240,0.6)' : 'rgba(120,53,15,0.5)'}; animation-delay:0.8s;"></div>
          ` : ''}
        </div>

        <!-- Conical Flask on Mantle -->
        <div class="flask-funnel-top"></div>
        <div class="erlenmeyer-flask-body">
          <img src="assets/conical_flask_500ml.png" alt="500 mL Erlenmeyer Conical Flask" class="flask-image-realistic" draggable="false" />
          <div class="flask-conical">
            <div class="flask-liquid-contents ${state.step3.oxidationDone ? 'liquid-orange-cr6' : (state.step3.digestionProgress > 50 ? 'liquid-orange-cr6' : 'liquid-green-cr3')}" style="height:92px;">
              <!-- Dynamic Boiling Bubbles -->
              ${state.step3.isHeating ? `
                <div class="bubble-particle" style="left:20px; bottom:6px; width:7px; height:7px;"></div>
                <div class="bubble-particle" style="left:55px; bottom:8px; width:9px; height:9px; animation-delay:0.3s;"></div>
                <div class="bubble-particle" style="left:95px; bottom:5px; width:6px; height:6px; animation-delay:0.6s;"></div>
                <div class="bubble-particle" style="left:120px; bottom:7px; width:8px; height:8px; animation-delay:0.2s;"></div>
              ` : ''}
              <span style="font-size:0.65rem; font-family:var(--font-mono); font-weight:700; color:#fff; background:rgba(0,0,0,0.45); padding:2px 8px; border-radius:3px; z-index:2;">
                ${state.step3.oxidationDone ? 'Cr₂O₇²⁻ (Ruby Orange)' : (state.step3.isHeating ? 'Oxidizing (' + state.step3.digestionProgress + '%)' : 'Cr³⁺ (Green)')}
              </span>
            </div>
          </div>
        </div>

        <!-- Electric Heating Mantle -->
        <div class="heating-mantle-base">
          <div class="mantle-coil-glow ${state.step3.isHeating ? 'active' : ''}"></div>
          <div class="mantle-control-row">
            <span>HEATER: ${state.step3.isHeating ? '125 °C (BOIL)' : 'STANDBY'}</span>
            <span>DIGESTION: ${state.step3.digestionProgress}%</span>
          </div>
        </div>
      </div>
    `;

    controls.innerHTML = `
      <button id="btn-toggle-heater" class="btn-step-action ${state.step3.isHeating ? 'danger' : (state.step3.oxidationDone ? 'success' : 'primary')}">
        ${state.step3.oxidationDone ? '✓ Oxidation Complete (CrVI Dichromate)' : (state.step3.isHeating ? '⏹ Stop Heating' : '🔥 Turn ON Heating Mantle (125 °C)')}
      </button>
    `;

    updateTelemetry("Oxidation State", "Temp / %", state.step3.oxidationDone ? "Cr₂O₇²⁻ (100%)" : `${state.step3.temp.toFixed(1)} °C (${state.step3.digestionProgress}%)`, state.step3.oxidationDone ? "Quantitative Oxidation" : (state.step3.isHeating ? "Boiling / Digesting" : "Ready to Heat"));

    $('btn-toggle-heater').onclick = () => {
      if (state.step3.oxidationDone) return;
      state.step3.isHeating = !state.step3.isHeating;
      if (state.step3.isHeating) {
        heatTimer = setInterval(() => {
          if (state.step3.digestionProgress < 100) {
            state.step3.digestionProgress += 10;
            state.step3.temp = 25 + state.step3.digestionProgress * 1.0;
            renderSlide3();
          } else {
            clearInterval(heatTimer);
            state.step3.isHeating = false;
            state.step3.oxidationDone = true;
            renderSlide3();
            updateStepLockState();
          }
        }, 400);
      } else {
        clearInterval(heatTimer);
      }
      renderSlide3();
    };
  }

  // ==========================================
  // SLIDE 4: Cooling, Dilution & Chlorine Expulsion (With Animated Water Pouring)
  // ==========================================
  function renderSlide4() {
    if ($('slide-title-display')) $('slide-title-display').textContent = "Cooling, Dilution & Free Chlorine Expulsion";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Adding 150 mL distilled H₂O and gentle boiling to prevent chlorine interference";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.4";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Immediately remove the flask from the heating mantle and cool in air for 2 minutes, then in a cold water bath until cool to the touch (<strong>&lt; 25 °C</strong>).
      Carefully add <strong>150 mL of grade 3 distilled water</strong> to dissolve all oxidized chromium salts.
      Add 2 to 3 clean glass boiling beads and boil gently for 5 minutes.
      <br><span style="color:#0369a1; font-weight:bold;">Why boil?</span> Perchloric oxidation produces trace dissolved chlorine gas (Cl₂). If not expelled, free Cl₂ will prematurely oxidize potassium iodide to iodine!
      Cool the flask thoroughly to room temperature (<strong>&lt; 25 °C</strong>).
    `;

    sopAction.textContent = (state.step4.diluted && state.step4.chlorineExpelled)
      ? "Step Complete: Solution diluted, free Cl₂ expelled, and flask cooled. Proceed to Step 5."
      : (!state.step4.diluted ? "Required Action: Click 'Pour 150 mL Distilled H₂O' to simulate dilution." : "Required Action: Click 'Boil 5 min to Expel Cl₂' to eliminate chlorine gas.");

    bench.innerHTML = `
      <div class="pour-simulation-rig">
        
        <!-- Distilled Water Dispenser Wash Bottle with Real Transparent Apparatus -->
        <div class="interactive-reagent-station" style="width:130px;">
          <div id="bottle-wash" class="washbottle-container ${state.step4.isPouringH2O ? 'tilt-squeeze-anim' : ''}">
            <img src="assets/wash_bottle.png" alt="Distilled Water Wash Bottle" class="washbottle-img" draggable="false" />
            <div class="washbottle-label-badge">
              DISTILLED H₂O<br>150 mL (ISO 3696)
            </div>
            <!-- Dynamic Water Jet from Swan-Neck Spout -->
            <div id="stream-water" class="liquid-pour-stream water-stream" style="display:${state.step4.isPouringH2O ? 'block' : 'none'};"></div>
          </div>
          <span style="font-size:0.68rem; font-weight:700; color:#0369a1; margin-top:8px;">Wash Bottle (H₂O)</span>
        </div>

        <!-- Conical Flask with Diluted Solution -->
        <div class="digestion-rig-complete">
          <div class="erlenmeyer-flask-body">
            <img src="assets/conical_flask_500ml.png" alt="500 mL Erlenmeyer Conical Flask" class="flask-image-realistic" draggable="false" />
            <div class="flask-conical">
              <div class="flask-liquid-contents ${state.step4.isPouringH2O ? 'pouring-active' : ''} liquid-orange-cr6" style="height:${state.step4.diluted ? '128px' : '65px'};">
                <span style="font-size:0.62rem; font-family:var(--font-mono); font-weight:700; color:#fff; background:rgba(0,0,0,0.45); padding:2px 8px; border-radius:3px;">
                  ${state.step4.chlorineExpelled ? 'Diluted Cr₂O₇²⁻ (Cl₂ Free, < 25 °C)' : (state.step4.diluted ? 'Diluted Cr₂O₇²⁻ (150 mL H₂O)' : 'Concentrated Cr₂O₇²⁻')}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    controls.innerHTML = `
      <button id="btn-dilute-h2o" class="btn-step-action ${state.step4.diluted ? 'success' : 'primary'}" ${state.step4.isPouringH2O ? 'disabled' : ''}>
        💧 ${state.step4.diluted ? '✓ 150 mL Distilled H₂O Added' : 'Pour 150 mL Distilled H₂O'}
      </button>
      <button id="btn-expel-cl2" class="btn-step-action ${state.step4.chlorineExpelled ? 'success' : ''}" ${state.step4.diluted ? '' : 'disabled'}>
        ♨️ ${state.step4.chlorineExpelled ? '✓ Dissolved Cl₂ Gas Expelled' : 'Boil 5 min to Expel Cl₂ & Cool'}
      </button>
    `;

    updateTelemetry("Interference Removal", "Chlorine", state.step4.chlorineExpelled ? "Cl₂ Expelled (Zero)" : (state.step4.diluted ? "Boiling Needed" : "Concentrated"), state.step4.chlorineExpelled ? "Temp: 22.0 °C (Cooled)" : "Temp: Elevated");

    $('btn-dilute-h2o').onclick = () => {
      if (state.step4.isPouringH2O || state.step4.diluted) return;
      state.step4.isPouringH2O = true;
      renderSlide4();

      setTimeout(() => {
        state.step4.diluted = true;
        state.step4.isPouringH2O = false;
        renderSlide4();
        updateStepLockState();
      }, 2500);
    };

    $('btn-expel-cl2').onclick = () => {
      state.step4.chlorineExpelled = true;
      renderSlide4();
      updateStepLockState();
    };
  }

  // ==========================================
  // SLIDE 5: Potassium Iodide Reaction (With Animated KI Pouring & Color Shift)
  // ==========================================
  function renderSlide5() {
    if ($('slide-title-display')) $('slide-title-display').textContent = "Potassium Iodide Reaction (Cr₂O₇²⁻ ➔ Free I₂)";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Quantitative redox reduction of dichromate and liberation of elemental iodine";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.5";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Ensure the flask is completely cooled to below <strong>25 °C</strong> to prevent evaporation of volatile elemental iodine.
      Add <strong>10 mL dilute Hydrochloric acid (HCl, 1:1)</strong> and <strong>10 mL of 10% (m/v) Potassium Iodide (KI)</strong>.
      <br>Stoichiometric reduction occurs immediately:
      <div style="font-family:var(--font-mono); font-size:0.68rem; color:#0369a1; background:#f1f5f9; padding:4px 6px; border-radius:3px; margin:4px 0;">
        Cr₂O₇²⁻ + 6 I⁻ + 14 H⁺ ⟶ 2 Cr³⁺ + 3 I₂ (Free Iodine) + 7 H₂O
      </div>
      Observe the instant color transformation from clear orange to deep reddish-brown.
      Stopper the flask and leave in the dark for <strong>10 minutes</strong> to ensure quantitative conversion.
    `;

    sopAction.textContent = (state.step5.kiAdded && state.step5.darkDwellDone)
      ? "Step Complete: Quantitative iodine liberation achieved. Proceed to Step 6."
      : (!state.step5.kiAdded ? "Required Action: Click 'Pour 10 mL 10% KI + HCl' to simulate reagent addition." : "Required Action: Click 'Incubate in Dark (10 min)' to complete reduction.");

    bench.innerHTML = `
      <div class="pour-simulation-rig">
        
        <!-- 10% KI Amber Bottle -->
        <div class="interactive-reagent-station">
          <div id="bottle-ki" class="reagent-bottle-realistic ${state.step5.isPouringKI ? 'tilt-pour-anim' : ''}">
            <div class="bottle-stopper" style="display:${state.step5.isPouringKI ? 'none' : 'block'};"></div>
            <div class="bottle-chem-label">
              10% KI + HCl<br>POTASSIUM IODIDE<br>10 mL + 10 mL
            </div>
            <!-- Dynamic KI Stream -->
            <div id="stream-ki" class="liquid-pour-stream ki-stream" style="display:${state.step5.isPouringKI ? 'block' : 'none'};"></div>
          </div>
          <span style="font-size:0.68rem; font-weight:700; color:#b45309; margin-top:8px;">10% KI + Dilute HCl</span>
        </div>

        <!-- Conical Flask with Dynamic Iodine Color Shift -->
        <div class="digestion-rig-complete">
          <div class="erlenmeyer-flask-body">
            <img src="assets/conical_flask_500ml.png" alt="500 mL Erlenmeyer Conical Flask" class="flask-image-realistic" draggable="false" />
            <div class="flask-conical">
              <div class="flask-liquid-contents ${state.step5.isPouringKI ? 'pouring-active' : ''} ${state.step5.kiAdded ? 'liquid-brown-iodine' : 'liquid-orange-cr6'}" style="height:128px;">
                <span style="font-size:0.62rem; font-family:var(--font-mono); font-weight:700; color:#fff; background:rgba(0,0,0,0.55); padding:2px 8px; border-radius:3px;">
                  ${state.step5.kiAdded ? 'Free Iodine I₂ Liberated (Dark Brown)' : 'Cr₂O₇²⁻ Solution (Orange)'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    controls.innerHTML = `
      <button id="btn-add-ki" class="btn-step-action ${state.step5.kiAdded ? 'success' : 'primary'}" ${state.step5.isPouringKI ? 'disabled' : ''}>
        🧪 ${state.step5.kiAdded ? '✓ 10 mL KI + HCl Added (I₂ Liberated)' : 'Pour 10 mL 10% KI + HCl'}
      </button>
      <button id="btn-dwell-dark" class="btn-step-action ${state.step5.darkDwellDone ? 'success' : ''}" ${state.step5.kiAdded ? '' : 'disabled'}>
        ⏳ ${state.step5.darkDwellDone ? '✓ 10-Min Dark Incubation Complete' : 'Incubate in Dark (10 min)'}
      </button>
    `;

    updateTelemetry("Liberated Iodine (I₂)", "Equivalence", state.step5.darkDwellDone ? "Complete (3 moles I₂ / Cr₂O₇²⁻)" : (state.step5.kiAdded ? "Reacting in Dark" : "None"), state.step5.darkDwellDone ? "Ready for Titration" : "Awaiting KI");

    $('btn-add-ki').onclick = () => {
      if (state.step5.isPouringKI || state.step5.kiAdded) return;
      state.step5.isPouringKI = true;
      renderSlide5();

      setTimeout(() => {
        state.step5.kiAdded = true;
        state.step5.isPouringKI = false;
        renderSlide5();
        updateStepLockState();
      }, 2200);
    };

    $('btn-dwell-dark').onclick = () => {
      state.step5.darkDwellDone = true;
      renderSlide5();
      updateStepLockState();
    };
  }

  // ==========================================
  // SLIDE 6: Burette Setup & Titrant Calibration
  // ==========================================
  function renderSlide6() {
    if ($('slide-title-display')) $('slide-title-display').textContent = "Class-A Burette Setup & Titrant Standardization";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Zeroing 50 mL burette with 0.1000 N Na₂S₂O₃ and setting up magnetic stirring";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.6";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Clamp a clean, calibrated <strong>Class-A 50 mL glass burette</strong> to the retort stand.
      Rinse and fill with standardized <strong>0.1000 N Sodium Thiosulfate ($Na_2S_2O_3$)</strong> solution.
      Adjust the meniscus to exactly 0.00 mL, checking that no air bubbles are trapped inside the delivery tip.
      Place a white ceramic contrast tile on the magnetic stirrer base to provide optimal optical contrast for endpoint detection.
      Insert a Teflon-coated magnetic stirring bar into the dark brown sample flask and adjust to smooth vortex stirring.
    `;

    sopAction.textContent = (state.step6.buretteFilled && state.step6.stirrerActive)
      ? "Step Complete: Titration station calibrated. Proceed to Step 7 to perform titration."
      : "Required Action: Click 'Fill Burette with 0.1 N Na₂S₂O₃', then click 'Start Magnetic Stirrer'.";

    bench.innerHTML = `
      <div class="titration-rig-complete">
        <div class="retort-burette-assembly">
          <div class="retort-stand-rod"></div>
          <div class="retort-clamp-arm"></div>

          <!-- Glass Burette -->
          <div class="glass-burette-column">
            <div class="burette-liquid-fill" style="height:${state.step6.buretteFilled ? '190px' : '20px'};"></div>
            <div class="burette-grad-ticks">
              <span>0 mL</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50 mL</span>
            </div>
          </div>
          <div class="burette-stopcock-valve">
            <div class="stopcock-handle"></div>
          </div>
          <div class="burette-delivery-tip"></div>

          <!-- Conical Flask on Stirrer -->
          <div class="erlenmeyer-flask-body titration-flask">
            <img src="assets/conical_flask_500ml.png" alt="500 mL Erlenmeyer Conical Flask" class="flask-image-realistic" draggable="false" />
            <div class="flask-conical">
              <div class="flask-liquid-contents liquid-brown-iodine" style="height:115px;">
                <div class="stirrer-bar" style="display:${state.step6.stirrerActive ? 'block' : 'none'};"></div>
              </div>
            </div>
            <div class="magnetic-stirrer-plate"></div>
          </div>
        </div>
      </div>
    `;

    controls.innerHTML = `
      <button id="btn-fill-burette" class="btn-step-action ${state.step6.buretteFilled ? 'success' : 'primary'}">
        🧪 ${state.step6.buretteFilled ? '✓ Burette Filled & Zeroed (0.00 mL)' : 'Fill Burette with 0.1 N Na₂S₂O₃'}
      </button>
      <button id="btn-start-stirrer" class="btn-step-action ${state.step6.stirrerActive ? 'success' : ''}" ${state.step6.buretteFilled ? '' : 'disabled'}>
        🌀 ${state.step6.stirrerActive ? '✓ Magnetic Stirrer Active' : 'Place Stir Bar & Start Stirrer'}
      </button>
    `;

    updateTelemetry("Titrant Level", "Burette Reading", state.step6.buretteFilled ? "0.00 mL (0.1000 N)" : "-- mL", state.step6.stirrerActive ? "Stirrer: 350 rpm" : "Stirrer: Off");

    $('btn-fill-burette').onclick = () => {
      state.step6.buretteFilled = true;
      renderSlide6();
      updateStepLockState();
    };

    $('btn-start-stirrer').onclick = () => {
      state.step6.stirrerActive = true;
      renderSlide6();
      updateStepLockState();
    };
  }

  // ==========================================
  // SLIDE 7: Titration & Starch Endpoint (With Real-Time Dropwise & Vortex Mechanics)
  // ==========================================
  function getFlaskHueClass() {
    const v = state.step7.titrantVolume;
    const target = getSpecimen().expectedTitre;
    if (v >= target) return 'liquid-endpoint-green';
    if (state.step7.starchAdded) return 'liquid-blue-starch';
    if (v >= 18.0) return 'liquid-straw-yellow';
    return 'liquid-brown-iodine';
  }

  function getFlaskHueDescription() {
    const v = state.step7.titrantVolume;
    const target = getSpecimen().expectedTitre;
    if (v >= target) return "Light Bottle-Green (Cr³⁺ Endpoint)";
    if (state.step7.starchAdded) return "Deep Inky Blue-Black (Starch Complex)";
    if (v >= 18.0) return "Pale Straw Yellow (Add Starch Now)";
    return "Dark Reddish Brown (Free I₂)";
  }

  function renderSlide7() {
    const spec = getSpecimen();
    const targetTitre = spec.expectedTitre;

    if ($('slide-title-display')) $('slide-title-display').textContent = "Iodometric Titration with 0.1 N Na₂S₂O₃ to Green Endpoint";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Starch indicator addition at straw yellow and dropwise equivalence detection";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 6.7";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    sopText.innerHTML = `
      Titrate the dark brown iodine solution with standard <strong>0.1000 N Na₂S₂O₃</strong> under continuous magnetic swirling until the brown color fades to a <strong>pale straw yellow</strong> (~18–19 mL).
      Add <strong>2 mL of fresh 1.0% Starch Indicator</strong>. The solution turns intensely <strong>inky blue-black</strong>.
      Continue the titration <strong>dropwise (0.05 mL increments)</strong> until the blue color suddenly discharges completely, flashing to a pristine <strong>light bottle-green hue (Cr³⁺ ions)</strong>.
      Record the exact final burette reading (<em>V</em>₁).
    `;

    sopAction.textContent = state.step7.endpointReached
      ? `Step Complete: Sharp endpoint attained at ${state.step7.titrantVolume.toFixed(2)} mL. Proceed to Step 8 for calculations.`
      : (state.step7.starchAdded ? "Starch Added: Titrate dropwise until the blue color sharply turns light green." : "Required Action: Titrate until solution turns straw yellow, add starch indicator, then proceed to endpoint.");

    const meniscusHeight = Math.max(10, 190 - (state.step7.titrantVolume / 50.0) * 160);

    bench.innerHTML = `
      <div class="titration-rig-complete">
        <div class="retort-burette-assembly">
          <div class="retort-stand-rod"></div>
          <div class="retort-clamp-arm"></div>

          <div class="glass-burette-column">
            <div class="burette-liquid-fill" style="height:${meniscusHeight}px;"></div>
            <div class="burette-grad-ticks">
              <span>0 mL</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50 mL</span>
            </div>
          </div>
          <div class="burette-stopcock-valve">
            <div class="stopcock-handle ${state.step7.isTitrating ? 'open' : ''}"></div>
          </div>
          <div class="burette-delivery-tip">
            ${state.step7.isTitrating ? '<div class="titration-droplet"></div>' : ''}
          </div>

          <div class="erlenmeyer-flask-body titration-flask">
            <img src="assets/conical_flask_500ml.png" alt="500 mL Erlenmeyer Conical Flask" class="flask-image-realistic" draggable="false" />
            <div class="flask-conical">
              <div class="flask-liquid-contents ${getFlaskHueClass()}" style="height:115px;">
                <div class="stirrer-bar"></div>
              </div>
            </div>
            <div class="magnetic-stirrer-plate"></div>
          </div>
        </div>
      </div>
    `;

    controls.innerHTML = `
      <div style="display:flex; gap:0.5rem; width:100%;">
        <button id="btn-titrate-fast" class="btn-step-action ${state.step7.titrationMode === 'fast' ? 'primary' : ''}" style="flex:1;">
          ⏩ Continuous
        </button>
        <button id="btn-titrate-drop" class="btn-step-action ${state.step7.titrationMode === 'drop' ? 'primary' : ''}" style="flex:1;">
          💧 Dropwise
        </button>
        <button id="btn-titrate-stop" class="btn-step-action danger" style="flex:1;">
          ⏹ Close Valve
        </button>
      </div>

      <button id="btn-add-starch" class="btn-step-action ${state.step7.starchAdded ? 'success' : 'primary'}" style="margin-top:0.4rem;">
        🧪 ${state.step7.starchAdded ? '✓ Starch Indicator Added (Blue-Black)' : 'Add 2 mL Starch (at Straw Yellow)'}
      </button>
    `;

    updateTelemetry("Burette Reading (V₁)", "mL", `${state.step7.titrantVolume.toFixed(2)} mL`, getFlaskHueDescription());

    $('btn-titrate-fast').onclick = () => startTitration('fast');
    $('btn-titrate-drop').onclick = () => startTitration('drop');
    $('btn-titrate-stop').onclick = () => stopTitration();

    $('btn-add-starch').onclick = () => {
      if (!state.step7.starchAdded) {
        state.step7.starchAdded = true;
        // If titrant is already at or near endpoint, ensure smooth transition
        const spec = getSpecimen();
        if (state.step7.titrantVolume >= spec.expectedTitre) {
          state.step7.endpointReached = true;
          stopTitration();
          updateStepLockState();
        }
        renderSlide7();
      }
    };
  }

  function startTitration(mode) {
    if (state.step7.endpointReached) return;
    state.step7.isTitrating = true;
    state.step7.titrationMode = mode;
    clearInterval(titrateTimer);

    const spec = getSpecimen();
    const target = spec.expectedTitre;
    const increment = (mode === 'fast') ? 0.35 : 0.05;
    const speedMs = (mode === 'fast') ? 140 : 220;

    titrateTimer = setInterval(() => {
      if (state.step7.titrantVolume < target) {
        state.step7.titrantVolume = parseFloat((state.step7.titrantVolume + increment).toFixed(2));
        
        // If starch has been added and volume reaches/exceeds target -> endpoint!
        if (state.step7.titrantVolume >= target && state.step7.starchAdded) {
          state.step7.titrantVolume = target;
          state.step7.endpointReached = true;
          stopTitration();
          updateStepLockState();
        } else if (state.step7.titrantVolume >= target && !state.step7.starchAdded) {
          // Pause and prompt student to add starch indicator!
          state.step7.titrantVolume = target - 0.20;
          stopTitration();
        }
        renderSlide7();
      } else {
        if (state.step7.starchAdded) {
          state.step7.titrantVolume = target;
          state.step7.endpointReached = true;
          stopTitration();
          updateStepLockState();
        } else {
          stopTitration();
        }
        renderSlide7();
      }
    }, speedMs);

    renderSlide7();
  }

  function stopTitration() {
    clearInterval(titrateTimer);
    state.step7.isTitrating = false;
    state.step7.titrationMode = 'stop';
    renderSlide7();
  }

  // ==========================================
  // SLIDE 8: Calculations, Test Certificate & Compliance
  // ==========================================
  function renderSlide8() {
    const spec = getSpecimen();

    if ($('slide-title-display')) $('slide-title-display').textContent = "Stoichiometric Calculations, Test Certificate & Footwear Compliance";
    if ($('slide-subtitle-display')) $('slide-subtitle-display').textContent = "Quantification of % Cr₂O₃ on as-received and zero-moisture bases per ISO 5398-1";
    if ($('slide-standard-display')) $('slide-standard-display').textContent = "Standard: ISO 5398-1 Clause 7.1 / 7.2";

    const bench = $('workbench-render-area');
    const sopText = $('sop-text-content');
    const sopAction = $('sop-action-content');
    const controls = $('step-controls-area');

    const W = state.step8.customW || state.step1.measuredWeight || spec.nominalWeight;
    const V1 = state.step8.customV1 || (state.step7.titrantVolume > 0 ? state.step7.titrantVolume : spec.expectedTitre);
    const V0 = state.step8.customV0;
    const N = state.step8.customN;
    const M = state.step8.customM || spec.moisturePercent;

    const netTitre = Math.max(0, V1 - V0);
    const cr2o3AsIs = (netTitre * N * 0.025333 * 100) / W;
    const cr2o3Dry = (cr2o3AsIs * 100) / Math.max(1, (100 - M));

    const isCompliant = cr2o3Dry >= spec.minRequirementDry;

    sopText.innerHTML = `
      Review the consolidated analytical data, mathematical formula derivation, and official laboratory test certificate.
      <br><strong>Stoichiometric Equivalence Basis:</strong> 1 mL of 0.1000 N Na₂S₂O₃ &equiv; 0.0025333 g of Cr₂O₃.
      <br>Compare the calculated <strong>Dry-Basis Chromium Content (${cr2o3Dry.toFixed(2)}% Cr₂O₃)</strong> against standard footwear commercial specifications.
    `;

    sopAction.textContent = "Laboratory Investigation Complete. Certificate of Analysis generated successfully.";

    bench.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.75rem; width:100%; max-width:820px; overflow-y:auto; max-height:480px; padding-right:6px;">
        
        <!-- Official Laboratory Certificate -->
        <div class="final-results-certificate">
          <div class="cert-header">
            <div class="cert-title">Official Laboratory Test Certificate</div>
            <div class="cert-subtitle">Determination of Chromic Oxide Content in Leather &bull; ISO 5398-1 / ASTM D2807 / IS 582</div>
          </div>

          <div class="cert-meta-grid">
            <div><strong>Specimen Name:</strong> ${spec.name}</div>
            <div><strong>Footwear Classification:</strong> ${spec.category}</div>
            <div><strong>Tannage System:</strong> ${spec.tannage}</div>
            <div><strong>Sampling Standard:</strong> ISO 2418 (Official Butt Area)</div>
            <div><strong>Test Method:</strong> Wet Acid Digestion & Iodometric Titration</div>
            <div><strong>Titrant Solution:</strong> Standard 0.1000 N Na₂S₂O₃</div>
          </div>

          <!-- Formula Banner -->
          <div class="calc-formula-banner">
            % Cr₂O₃ (Air-Dry) = [(V₁ - V₀) × N × 0.02533 × 100] / W
            <br>
            % Cr₂O₃ (Zero-Moisture) = [% Cr₂O₃ (Air-Dry) × 100] / (100 - M)
          </div>

          <table class="data-table-iso">
            <thead>
              <tr>
                <th>Analytical Parameter</th>
                <th>Measured Value</th>
                <th>Standard Specification</th>
                <th>Commercial Tolerance</th>
                <th>Result Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Sample Weight (W)</strong></td>
                <td>${W.toFixed(4)} g</td>
                <td>1.5000 ± 0.0500 g</td>
                <td>Analytical balance (±0.0001 g)</td>
                <td><strong style="color:#15803d;">VALID</strong></td>
              </tr>
              <tr>
                <td><strong>Sample Titre Volume (V₁)</strong></td>
                <td>${V1.toFixed(2)} mL</td>
                <td>Titration Endpoint</td>
                <td>Class-A Burette (±0.05 mL)</td>
                <td><strong style="color:#15803d;">RECORDED</strong></td>
              </tr>
              <tr>
                <td><strong>Reagent Blank Titre (V₀)</strong></td>
                <td>${V0.toFixed(2)} mL</td>
                <td>Reagent Impurities Check</td>
                <td>Max 0.20 mL</td>
                <td><strong style="color:#15803d;">DEDUCTED</strong></td>
              </tr>
              <tr>
                <td><strong>Moisture Content (M)</strong></td>
                <td>${M.toFixed(1)} %</td>
                <td>ISO 4684 (102 ± 2 °C)</td>
                <td>10.0% – 15.0% Typical</td>
                <td><strong style="color:#0369a1;">APPLIED</strong></td>
              </tr>
              <tr style="background:#f0fdf4;">
                <td><strong>% Cr₂O₃ (As-Received)</strong></td>
                <td><strong style="font-size:0.95rem; color:#0369a1;">${cr2o3AsIs.toFixed(2)}%</strong></td>
                <td>Air-Dry Basis</td>
                <td>Calculated</td>
                <td><strong>--</strong></td>
              </tr>
              <tr style="background:#ecfdf5; border-top:2px solid #10b981;">
                <td><strong>% Cr₂O₃ (Zero Moisture Basis)</strong></td>
                <td><strong style="font-size:1.05rem; color:#15803d;">${cr2o3Dry.toFixed(2)}%</strong></td>
                <td>Dry Weight Basis</td>
                <td>Min ${spec.minRequirementDry.toFixed(2)}% (Footwear Standard)</td>
                <td><strong style="color:${isCompliant ? '#15803d' : '#cf222e'};">${isCompliant ? 'PASS' : 'FAIL'}</strong></td>
              </tr>
            </tbody>
          </table>

          <!-- Compliance Verdict Card -->
          <div class="compliance-status-card ${isCompliant ? 'pass' : 'fail'}">
            <div>
              <strong>${isCompliant ? 'CONFORMS TO FOOTWEAR STANDARD' : 'NON-COMPLIANT SPECIFICATION'}:</strong>
              <div style="font-size:0.72rem; margin-top:2px;">
                ${spec.complianceText} (Hydrothermal Stability: ${spec.shrinkageTemp})
              </div>
            </div>
            <div style="font-family:var(--font-mono); font-size:0.8rem; font-weight:700;">
              Ts: ${spec.shrinkageTemp}
            </div>
          </div>
        </div>
      </div>
    `;

    controls.innerHTML = `
      <div class="panel-section-title">Calculation Parameter Verification</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; font-size:0.72rem;">
        <div>
          <label class="field-label">Weight W (g):</label>
          <input type="number" id="input-calc-w" step="0.0001" value="${W.toFixed(4)}" class="field-select" style="width:100%;">
        </div>
        <div>
          <label class="field-label">Titre V₁ (mL):</label>
          <input type="number" id="input-calc-v1" step="0.05" value="${V1.toFixed(2)}" class="field-select" style="width:100%;">
        </div>
        <div>
          <label class="field-label">Blank V₀ (mL):</label>
          <input type="number" id="input-calc-v0" step="0.01" value="${V0.toFixed(2)}" class="field-select" style="width:100%;">
        </div>
        <div>
          <label class="field-label">Moisture M (%):</label>
          <input type="number" id="input-calc-m" step="0.1" value="${M.toFixed(1)}" class="field-select" style="width:100%;">
        </div>
      </div>

      <button id="btn-recalc" class="btn-step-action primary" style="margin-top:0.4rem;">
        🧮 Recalculate % Cr₂O₃
      </button>

      <button id="btn-print-report" class="btn-step-action success" style="margin-top:0.2rem;">
        🖨️ Print / Save Laboratory Report
      </button>
    `;

    updateTelemetry("% Cr₂O₃ (Dry Basis)", "% Cr₂O₃", `${cr2o3Dry.toFixed(2)}%`, isCompliant ? "Meets ISO Standard" : "Non-Compliant");

    $('btn-recalc').onclick = () => {
      state.step8.customW = parseFloat($('input-calc-w').value) || spec.nominalWeight;
      state.step8.customV1 = parseFloat($('input-calc-v1').value) || spec.expectedTitre;
      state.step8.customV0 = parseFloat($('input-calc-v0').value) || 0.15;
      state.step8.customM = parseFloat($('input-calc-m').value) || spec.moisturePercent;
      renderSlide8();
    };

    $('btn-print-report').onclick = () => {
      window.print();
    };
  }

  function resetExperiment() {
    clearInterval(heatTimer);
    clearInterval(titrateTimer);

    state.currentSlide = 1;
    state.maxUnlockedSlide = 1;

    state.step1.balanceTared = false;
    state.step1.specimenWeighed = false;
    state.step1.isTransferring = false;

    state.step2.hno3Added = false;
    state.step2.hclo4Added = false;
    state.step2.isPouringHNO3 = false;
    state.step2.isPouringHClO4 = false;

    state.step3.isHeating = false;
    state.step3.digestionProgress = 0;
    state.step3.oxidationDone = false;
    state.step3.temp = 24.5;

    state.step4.diluted = false;
    state.step4.isPouringH2O = false;
    state.step4.chlorineExpelled = false;

    state.step5.kiAdded = false;
    state.step5.isPouringKI = false;
    state.step5.darkDwellDone = false;

    state.step6.buretteFilled = false;
    state.step6.stirrerActive = false;

    state.step7.titrantVolume = 0.00;
    state.step7.isTitrating = false;
    state.step7.starchAdded = false;
    state.step7.endpointReached = false;

    state.step8.customW = null;
    state.step8.customV1 = null;
    state.step8.customM = null;

    goToSlide(1);
  }

  function init() {
    const resetBtn = $('btn-deck-reset');
    if (resetBtn) resetBtn.onclick = resetExperiment;

    const specSelect = $('select-leather-sample');
    if (specSelect) {
      specSelect.onchange = (e) => {
        state.specimenId = e.target.value;
        resetExperiment();
      };
    }

    const prevBtn = $('btn-slide-prev');
    const nextBtn = $('btn-slide-next');

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (state.currentSlide > 1) {
          goToSlide(state.currentSlide - 1);
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (state.currentSlide < 8 && isStepCompleted(state.currentSlide)) {
          goToSlide(state.currentSlide + 1);
        }
      };
    }

    document.querySelectorAll('.progress-step').forEach(stepEl => {
      stepEl.addEventListener('click', () => {
        const targetStep = parseInt(stepEl.getAttribute('data-step'), 10);
        if (targetStep <= state.maxUnlockedSlide) {
          goToSlide(targetStep);
        }
      });
    });

    goToSlide(1);
  }

  window.addEventListener('DOMContentLoaded', init);

})();
