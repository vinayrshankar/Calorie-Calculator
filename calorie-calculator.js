(() => {

  const ALLOWED_PARENT_ORIGINS = new Set([
    'https://tfaworld.org',
    'https://www.tfaworld.org'
  ]);

  function postHeightToParent() {
    if (window.parent === window) return;

    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    ALLOWED_PARENT_ORIGINS.forEach(origin => {
      window.parent.postMessage(
        {
          type: 'TFA_CALCULATOR_HEIGHT',
          height
        },
        origin
      );
    });
  }

  const resizeObserver = new ResizeObserver(() => {
    postHeightToParent();
  });

  window.addEventListener('load', () => {
    resizeObserver.observe(document.documentElement);
    postHeightToParent();
  });

  const $ = id => document.getElementById(id);

  let heightMode = 'cm';
  let weightMode = 'kg';

  function setSegment(groupId, mode, callback){
    document.querySelectorAll(`#${groupId} button`).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#${groupId} button`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        callback(btn.dataset.mode);
      });
    });
  }

  setSegment('heightMode', 'cm', mode => {
    heightMode = mode;
    $('heightCmWrap').classList.toggle('hidden', mode !== 'cm');
    $('heightFtWrap').classList.toggle('hidden', mode !== 'ft');
  });

  setSegment('weightMode', 'kg', mode => {
    weightMode = mode;
    $('weight').placeholder = mode === 'kg' ? 'e.g. 75' : 'e.g. 165';
  });

  $('rmrSource').addEventListener('change', e => {
    const reported = e.target.value === 'reported';
    $('reportedRmrWrap').classList.toggle('hidden', !reported);
    $('formulaWrap').classList.toggle('hidden', reported);
  });

  $('formula').addEventListener('change', e => {
    $('bodyFatWrap').classList.toggle('hidden', !['katch','cunningham'].includes(e.target.value));
  });

  $('activity').addEventListener('change', e => {
    $('customActivityWrap').classList.toggle('hidden', e.target.value !== 'custom');
  });

  const intensityOptions = {
    lose: [
      {value:'0.10', text:'Gentle loss — 10% below maintenance'},
      {value:'0.15', text:'Moderate loss — 15% below maintenance'},
      {value:'0.20', text:'Larger loss — 20% below maintenance'}
    ],
    gain: [
      {value:'0.05', text:'Conservative gain — 5% above maintenance'},
      {value:'0.10', text:'Moderate gain — 10% above maintenance'},
      {value:'0.15', text:'Larger gain — 15% above maintenance'}
    ]
  };

  function updateGoalIntensity(){
    const goal = $('goal').value;
    const wrap = $('goalIntensityWrap');
    const sel = $('goalIntensity');

    if(goal === 'maintain'){
      wrap.classList.add('hidden');
      sel.innerHTML = '';
      return;
    }

    wrap.classList.remove('hidden');
    sel.innerHTML = intensityOptions[goal]
      .map(o => `<option value="${o.value}">${o.text}</option>`)
      .join('');
    sel.value = goal === 'lose' ? '0.15' : '0.10';
  }

  $('goal').addEventListener('change', updateGoalIntensity);
  updateGoalIntensity();

  function getHeightCm(){
    if(heightMode === 'cm'){
      return parseFloat($('heightCm').value);
    }
    const ft = parseFloat($('heightFt').value || 0);
    const inch = parseFloat($('heightIn').value || 0);
    return (ft * 12 + inch) * 2.54;
  }

  function getWeightKg(){
    const w = parseFloat($('weight').value);
    return weightMode === 'kg' ? w : w * 0.45359237;
  }

  function rounded(n){
    return Math.round(n);
  }

  function calculateRmr(age, sex, heightCm, weightKg){
    if($('rmrSource').value === 'reported'){
      const v = parseFloat($('reportedRmr').value);
      return {
        value: v,
        label: 'User-entered BMR/RMR from a body-composition or metabolic report'
      };
    }

    const formula = $('formula').value;

    if(formula === 'mifflin'){
      const sexConstant = sex === 'male' ? 5 : -161;
      return {
        value: (10 * weightKg) + (6.25 * heightCm) - (5 * age) + sexConstant,
        label: 'Mifflin–St Jeor predictive equation'
      };
    }

    const bf = parseFloat($('bodyFat').value);
    const ffm = weightKg * (1 - (bf / 100));

    if(formula === 'katch'){
      return {
        value: 370 + (21.6 * ffm),
        label: `Katch–McArdle using estimated fat-free mass (${ffm.toFixed(1)} kg)`
      };
    }

    return {
      value: 500 + (22 * ffm),
      label: `Cunningham using estimated fat-free mass (${ffm.toFixed(1)} kg)`
    };
  }

  function validate(){
    const errors = [];
    const age = parseFloat($('age').value);
    const sex = $('sex').value;
    const heightCm = getHeightCm();
    const weightKg = getWeightKg();

    if(!age || age < 18 || age > 100) errors.push('Enter an age between 18 and 100.');
    if(!heightCm || heightCm < 100 || heightCm > 250) errors.push('Enter a valid height.');
    if(!weightKg || weightKg < 30 || weightKg > 400) errors.push('Enter a valid weight.');

    if($('rmrSource').value === 'predict'){
      if($('formula').value === 'mifflin' && !sex) errors.push('Select sex for the Mifflin–St Jeor equation.');
      if(['katch','cunningham'].includes($('formula').value)){
        const bf = parseFloat($('bodyFat').value);
        if(!bf || bf < 3 || bf > 70) errors.push('Enter a valid body-fat percentage.');
      }
    } else {
      const r = parseFloat($('reportedRmr').value);
      if(!r || r < 700 || r > 5000) errors.push('Enter a plausible reported BMR/RMR.');
    }

    const af = $('activity').value === 'custom'
      ? parseFloat($('customActivity').value)
      : parseFloat($('activity').value);

    if(!af || af < 1.1 || af > 2.4) errors.push('Enter a valid activity factor.');

    return errors;
  }

  function getActionPlan(goal){
    if(goal === 'lose'){
      return [
        'Aim for the selected calorie deficit consistently rather than pursuing extreme restriction.',
        'Prioritize protein-rich foods, vegetables, fruit, whole grains, and other high-satiety foods.',
        'Use resistance training to help preserve strength and lean mass while body weight decreases.',
        'Increase low-intensity daily movement such as walking before relying on very large calorie cuts.',
        'Review the 2–4 week trend and adjust intake gradually if progress is faster or slower than intended.'
      ];
    }
    if(goal === 'gain'){
      return [
        'Use a modest calorie surplus and emphasize progressive resistance training.',
        'Distribute protein-containing meals across the day and keep total food intake consistent.',
        'Increase calories gradually if body weight is not trending upward after several weeks.',
        'Keep some aerobic activity for cardiovascular health without allowing it to displace recovery.',
        'Use strength, performance, measurements, and body-weight trends together rather than scale weight alone.'
      ];
    }
    return [
      'Keep average calorie intake near estimated maintenance while allowing normal day-to-day variation.',
      'Maintain regular resistance training and aerobic activity.',
      'Keep daily movement reasonably consistent so energy expenditure does not fluctuate dramatically.',
      'Monitor weight trend periodically; small fluctuations from hydration and glycogen are normal.',
      'Recalculate after a meaningful change in body mass or usual activity.'
    ];
  }

  function getActivityPlan(goal, preference){
    const common = {
      resistance: [
        'Resistance training: approximately 2–4+ sessions/week depending on experience and recovery.',
        'Include major movement patterns and progressively increase training demand over time.'
      ],
      cardio: [
        'Aerobic activity: build toward roughly 150–300 minutes/week of moderate-intensity activity, or an equivalent combination.',
        'Include at least some resistance work each week rather than relying on cardio alone.'
      ],
      walking: [
        'Use regular walking and general movement to raise daily activity in a sustainable way.',
        'Add 2 or more resistance-training sessions weekly when possible.'
      ],
      mixed: [
        'Combine resistance training 2–4+ days/week with regular aerobic activity and daily movement.',
        'Use a mix of structured exercise and lower-intensity movement rather than depending on one activity alone.'
      ]
    };

    const list = [...common[preference]];

    if(goal === 'lose'){
      list.push('For fat-loss goals, increasing walking or other low-fatigue movement can help create an energy deficit without excessive training stress.');
    } else if(goal === 'gain'){
      list.push('For weight-gain goals, keep conditioning appropriate to health and performance but make resistance training the main training stimulus.');
    } else {
      list.push('For weight maintenance, prioritize consistency across both training and everyday movement.');
    }
    return list;
  }

  $('calculateBtn').addEventListener('click', () => {
    const errors = validate();
    const errorBox = $('formError');

    if(errors.length){
      errorBox.innerHTML = errors.join('<br>');
      errorBox.classList.remove('hidden');
      $('results').classList.add('hidden');
      return;
    }

    errorBox.classList.add('hidden');

    const age = parseFloat($('age').value);
    const sex = $('sex').value;
    const heightCm = getHeightCm();
    const weightKg = getWeightKg();

    const rmrObj = calculateRmr(age, sex, heightCm, weightKg);
    const rmr = rmrObj.value;

    const activityFactor = $('activity').value === 'custom'
      ? parseFloat($('customActivity').value)
      : parseFloat($('activity').value);

    const tdee = rmr * activityFactor;

    const goal = $('goal').value;
    let adjustment = 0;
    if(goal !== 'maintain') adjustment = parseFloat($('goalIntensity').value);

    let target = tdee;
    if(goal === 'lose') target = tdee * (1 - adjustment);
    if(goal === 'gain') target = tdee * (1 + adjustment);

    $('rmrOut').textContent = rounded(rmr).toLocaleString();
    $('tdeeOut').textContent = rounded(tdee).toLocaleString();
    $('targetOut').textContent = rounded(target).toLocaleString();

    const goalWord = goal === 'maintain' ? 'maintenance' : goal === 'lose' ? 'weight loss' : 'weight gain';
    const pct = Math.round(adjustment * 100);

    $('goalSummary').innerHTML = goal === 'maintain'
      ? `<strong>Start around ${rounded(target).toLocaleString()} kcal/day</strong>
         This is an estimated maintenance intake based on your resting needs and selected activity factor.`
      : `<strong>Start around ${rounded(target).toLocaleString()} kcal/day</strong>
         This applies a ${pct}% ${goal === 'lose' ? 'deficit below' : 'surplus above'} estimated maintenance for ${goalWord}.`;

    $('formulaSummary').innerHTML =
      `<p><strong>Method:</strong> ${rmrObj.label} <span class="badge">RMR ≈ ${rounded(rmr)} kcal/day</span></p>
       <p><strong>Activity factor:</strong> ${activityFactor.toFixed(3)}. Estimated maintenance = RMR × activity factor.</p>`;

    const safety = $('safetyNotice');
    safety.classList.add('hidden');
    safety.textContent = '';

    if(goal === 'lose' && target < rmr * 0.85){
      safety.textContent = 'Your selected target is substantially below estimated resting needs. Consider using a smaller deficit or obtaining individualized nutrition guidance, especially if training volume is high.';
      safety.classList.remove('hidden');
    }

    if($('rmrSource').value === 'reported' && $('reportedRmr').value){
      const reportValue = parseFloat($('reportedRmr').value);
      if(reportValue < 900 || reportValue > 3500){
        safety.textContent = 'The entered resting-energy value is unusual for many adults. Double-check the units and the value shown on the report before using the result.';
        safety.classList.remove('hidden');
      }
    }

    $('actionList').innerHTML = getActionPlan(goal).map(x => `<li>${x}</li>`).join('');
    $('activityList').innerHTML = getActivityPlan(goal, $('trainingPreference').value).map(x => `<li>${x}</li>`).join('');

    $('results').classList.remove('hidden');
    requestAnimationFrame(() => postHeightToParent());
  });
})();
