<?php
/*
 * TFA Calorie & Energy Needs Calculator
 * Host: https://apps.tfaworld.org
 * Intended parent site: https://tfaworld.org
 *
 * Files expected in the same directory:
 * - calorie-calculator.php
 * - calorie-calculator.css
 * - calorie-calculator.js
 */

// Allow framing only by TFA.
header(
    "Content-Security-Policy: " .
    "default-src 'self'; " .
    "script-src 'self'; " .
    "style-src 'self'; " .
    "img-src 'self' data:; " .
    "font-src 'self'; " .
    "connect-src 'none'; " .
    "object-src 'none'; " .
    "base-uri 'none'; " .
    "form-action 'none'; " .
    "frame-ancestors 'self' https://tfaworld.org https://www.tfaworld.org;"
);

header("Referrer-Policy: strict-origin-when-cross-origin");
header("X-Content-Type-Options: nosniff");
header("Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()");
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Calorie & Energy Needs Calculator</title>
<link rel="stylesheet" href="calorie-calculator.css">
</head>
<body>
<div class="calc-wrap">
  <div class="hero">
    <h1>Calorie & Energy Needs Calculator</h1>
    <p>Estimate resting energy needs, daily energy expenditure, and a practical calorie target for maintaining, losing, or gaining weight.</p>
  </div>

  <div class="grid">
    <section class="card">
      <h2>1. Body Information</h2>

      <div class="field">
        <label for="age">Age</label>
        <input id="age" type="number" min="18" max="100" step="1" placeholder="e.g. 30">
        <span class="hint">This version is intended for adults 18+.</span>
      </div>

      <div class="field">
        <label for="sex">Sex used for predictive equation</label>
        <select id="sex">
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <span class="hint">Required for Mifflin–St Jeor. Lean-mass formulas do not use sex directly.</span>
      </div>

      <div class="field">
        <label>Height</label>
        <div class="segment" id="heightMode">
          <button type="button" class="active" data-mode="cm">Centimeters</button>
          <button type="button" data-mode="ft">Feet / inches</button>
        </div>
      </div>

      <div id="heightCmWrap" class="field">
        <input id="heightCm" type="number" min="100" max="250" step="0.1" placeholder="e.g. 175">
      </div>

      <div id="heightFtWrap" class="field hidden">
        <div class="row">
          <input id="heightFt" type="number" min="3" max="8" step="1" placeholder="Feet">
          <input id="heightIn" type="number" min="0" max="11.9" step="0.1" placeholder="Inches">
        </div>
      </div>

      <div class="field">
        <label>Weight</label>
        <div class="segment" id="weightMode">
          <button type="button" class="active" data-mode="kg">Kilograms</button>
          <button type="button" data-mode="lb">Pounds</button>
        </div>
      </div>

      <div class="field">
        <input id="weight" type="number" min="30" max="400" step="0.1" placeholder="e.g. 75">
      </div>
    </section>

    <section class="card">
      <h2>2. Resting Metabolic Rate</h2>

      <div class="field">
        <label for="rmrSource">RMR / BMR source</label>
        <select id="rmrSource">
          <option value="predict">Estimate from an equation</option>
          <option value="reported">Enter value from body-composition / metabolic report</option>
        </select>
      </div>

      <div id="reportedRmrWrap" class="field hidden">
        <label for="reportedRmr">Reported BMR / RMR</label>
        <input id="reportedRmr" type="number" min="700" max="5000" step="1" placeholder="kcal/day">
        <span class="hint">If you have an indirect-calorimetry result, use that. Many body-composition devices report an estimated rather than directly measured value.</span>
      </div>

      <div id="formulaWrap">
        <div class="field">
          <label for="formula">Predictive formula</label>
          <select id="formula">
            <option value="mifflin">Mifflin–St Jeor (default)</option>
            <option value="katch">Katch–McArdle (requires body-fat %)</option>
            <option value="cunningham">Cunningham (requires body-fat %)</option>
          </select>
        </div>

        <div id="bodyFatWrap" class="field hidden">
          <label for="bodyFat">Body-fat percentage</label>
          <input id="bodyFat" type="number" min="3" max="70" step="0.1" placeholder="e.g. 18">
          <span class="hint">Used to estimate fat-free mass for Katch–McArdle or Cunningham.</span>
        </div>
      </div>

      <div class="field">
        <label for="activity">Activity factor</label>
        <select id="activity">
          <option value="1.2">Sedentary — mostly sitting, little structured exercise (1.20)</option>
          <option value="1.375">Lightly active — light exercise ~1–3 days/week (1.375)</option>
          <option value="1.55" selected>Moderately active — exercise ~3–5 days/week (1.55)</option>
          <option value="1.725">Very active — hard exercise ~6–7 days/week (1.725)</option>
          <option value="1.9">Extremely active — very hard training and/or physical job (1.90)</option>
          <option value="custom">Custom activity factor</option>
        </select>
        <span class="hint">TDEE = RMR × activity factor. Activity multipliers are estimates, not direct measurements.</span>
      </div>

      <div id="customActivityWrap" class="field hidden">
        <label for="customActivity">Custom activity factor</label>
        <input id="customActivity" type="number" min="1.1" max="2.4" step="0.01" value="1.55">
      </div>
    </section>

    <section class="card">
      <h2>3. Goal</h2>

      <div class="field">
        <label for="goal">Desired outcome</label>
        <select id="goal">
          <option value="maintain">Maintain weight</option>
          <option value="lose">Lose weight</option>
          <option value="gain">Gain weight</option>
        </select>
      </div>

      <div id="goalIntensityWrap" class="field hidden">
        <label for="goalIntensity">Calorie adjustment</label>
        <select id="goalIntensity"></select>
        <span class="hint">Percentage-based adjustments scale better across people than using the same fixed calorie deficit or surplus for everyone.</span>
      </div>

      <div class="field">
        <label for="trainingPreference">Preferred activity</label>
        <select id="trainingPreference">
          <option value="mixed">Mixed: resistance + aerobic activity</option>
          <option value="resistance">Mostly resistance training</option>
          <option value="cardio">Mostly aerobic/cardio activity</option>
          <option value="walking">Walking / general movement</option>
        </select>
      </div>
    </section>

    <section class="card">
      <h2>4. Calculate</h2>
      <p class="calculate-copy">
        The calculator first establishes resting needs, estimates total daily energy expenditure (TDEE), and then adjusts calories according to the selected goal.
      </p>
      <button type="button" id="calculateBtn" class="primary">Calculate calorie needs</button>
      <div id="formError" class="notice warning hidden"></div>
    </section>
  </div>

  <section id="results" class="results hidden">
    <div class="metrics">
      <div class="metric">
        <div class="k">Estimated / entered RMR</div>
        <div class="v" id="rmrOut">—</div>
        <div class="u">kcal/day</div>
      </div>
      <div class="metric">
        <div class="k">Maintenance calories (TDEE)</div>
        <div class="v" id="tdeeOut">—</div>
        <div class="u">kcal/day</div>
      </div>
      <div class="metric">
        <div class="k">Suggested goal intake</div>
        <div class="v" id="targetOut">—</div>
        <div class="u">kcal/day</div>
      </div>
    </div>

    <div class="result-grid">
      <div class="result-card">
        <h3>Your calorie strategy</h3>
        <div id="goalSummary" class="goal-box"></div>
        <div id="formulaSummary"></div>
        <div id="safetyNotice" class="notice warning hidden"></div>
      </div>

      <div class="result-card">
        <h3>What should you do?</h3>
        <ul id="actionList"></ul>
      </div>
    </div>

    <div class="result-grid">
      <div class="result-card">
        <h3>Suggested activity approach</h3>
        <ul id="activityList"></ul>
      </div>

      <div class="result-card">
        <h3>How to use this number</h3>
        <ul>
          <li>Use the result as a starting estimate rather than a precise prescription.</li>
          <li>Track body weight under similar conditions and look at the trend over 2–4 weeks.</li>
          <li>If your trend does not match your goal, make a small calorie adjustment and reassess.</li>
          <li>Do not automatically “eat back” exercise calories if your selected activity factor already represents your normal training.</li>
          <li>Recalculate after a meaningful change in body weight, training volume, or lifestyle activity.</li>
        </ul>
      </div>
    </div>

    <p class="calc-note">
      Educational tool only. Energy needs can differ substantially from predictive equations. Pregnancy, adolescence, eating-disorder history, significant medical conditions, or clinician-directed nutrition plans require individualized guidance.
    </p>
  </section>
</div>

<script src="calorie-calculator.js" defer></script>
</body>
</html>
