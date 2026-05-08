// RTA Analysis Dashboard - JavaScript Engine
const COLORS = {
  purple:'#6c5ce7',blue:'#74b9ff',green:'#00b894',orange:'#fdcb6e',
  red:'#e17055',pink:'#fd79a8',teal:'#00cec9',yellow:'#ffeaa7',
  gray:'#636e72',lavender:'#a29bfe',mint:'#55efc4',coral:'#fab1a0'
};
const PAL = Object.values(COLORS);

function showTab(id){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  event.target.classList.add('active');
}

fetch('dashboard_data.json').then(r=>r.json()).then(D=>{
  renderKPIs(D);
  renderDescriptive(D);
  renderAnalytical(D);
  renderAdvancedAnalytics(D);
  renderThematic(D);
  renderSummary(D);
}).catch(e=>document.body.innerHTML='<h2 style="color:red;padding:2rem">Error loading data: '+e+'</h2>');

let figCount = 1;
let tblCount = 1;
function applyAPA(cardId, type, title, note='') {
  const card = document.getElementById(cardId);
  if(!card) return;
  const num = type === 'Figure' ? figCount++ : tblCount++;
  const nStr = note ? `<div class="apa-note"><i>Note.</i> ${note}</div>` : '';
  card.insertAdjacentHTML('afterbegin', `<div class="apa-label">${type} ${num}</div><div class="apa-title">${title}</div>`);
  if(nStr) card.insertAdjacentHTML('beforeend', nStr);
}

function renderKPIs(D){
  const kpis=[
    {value:D.N,label:'Total RTA Cases',change:'2023-2025'},
    {value:D.rta_counts[2025],label:'Cases in 2025',change:`+${D.growth}% vs 2023`,up:true},
    {value:D.rta_pct[2025]+'%',label:'RTA Proportion 2025',change:`of all occupational incidents`},
    {value:D.injury_pct+'%',label:'Injury Rate',change:'sustained physical injury'},
    {value:D.avg_mc+' days',label:'Mean MC Duration',change:'among those granted MC'}
  ];
  document.getElementById('kpi-container').innerHTML=kpis.map(k=>`
    <div class="kpi"><div class="value">${k.value}</div><div class="label">${k.label}</div>
    <div class="change ${k.up?'up':''}">${k.change}</div></div>`).join('');
}

function makeChart(id,type,labels,datasets,opts={}){
  const ctx=document.getElementById(id);
  if(!ctx) return;
  new Chart(ctx,{
    type,data:{labels,datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:opts.legend!==false,labels:{color:'#9498ab',font:{size:11}}},
        datalabels:opts.datalabels||false},
      scales:type==='pie'||type==='doughnut'?{}:{
        x:{ticks:{color:'#9498ab',font:{size:10}},grid:{color:'rgba(42,46,63,0.5)'}},
        y:{ticks:{color:'#9498ab',font:{size:10}},grid:{color:'rgba(42,46,63,0.5)'},...(opts.yOpts||{})}
      },...(opts.extra||{})},
    plugins:opts.plugins||[]
  });
}

function renderDescriptive(D){
  // Trend chart
  makeChart('chart-trend','bar',['2023','2024','2025'],[
    {label:'RTA Cases',data:[D.rta_counts[2023],D.rta_counts[2024],D.rta_counts[2025]],backgroundColor:COLORS.red,borderRadius:6},
    {label:'Other Incidents',data:[D.all_counts[2023]-D.rta_counts[2023],D.all_counts[2024]-D.rta_counts[2024],D.all_counts[2025]-D.rta_counts[2025]],backgroundColor:COLORS.blue,borderRadius:6}
  ],{extra:{scales:{x:{stacked:true},y:{stacked:true}}}});

  // Proportion
  makeChart('chart-proportion','line',['2023','2024','2025'],[
    {label:'RTA %',data:[D.rta_pct[2023],D.rta_pct[2024],D.rta_pct[2025]],borderColor:COLORS.purple,backgroundColor:'rgba(108,92,231,0.15)',fill:true,tension:.3,pointRadius:6}
  ]);

  // Gender
  makeChart('chart-gender','doughnut',Object.keys(D.gender),
    [{data:Object.values(D.gender),backgroundColor:[COLORS.blue,COLORS.pink,COLORS.green]}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{weight:'bold',size:12},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return (v/t*100).toFixed(1)+'%'}}});

  // Age
  makeChart('chart-age','bar',Object.keys(D.age),[{label:'Cases',data:Object.values(D.age),backgroundColor:PAL.map(c=>c+'cc'),borderRadius:4}],{legend:false});

  // Ethnicity
  makeChart('chart-ethnicity','doughnut',Object.keys(D.ethnicity),
    [{data:Object.values(D.ethnicity),backgroundColor:PAL}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{size:11},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return v>=5?(v/t*100).toFixed(0)+'%':''}}});

  // Jawatan bars
  const jMax=Math.max(...Object.values(D.jawatan));
  document.getElementById('jawatan-bars').innerHTML=Object.entries(D.jawatan).map(([k,v],i)=>`
    <div class="freq-bar"><span class="label">${k}</span><div class="bar-bg">
    <div class="bar-fill" style="width:${v/jMax*100}%;background:${PAL[i%PAL.length]}">${v}</div></div></div>`).join('');

  // Facility
  makeChart('chart-facility','doughnut',Object.keys(D.facility),[{data:Object.values(D.facility),backgroundColor:PAL}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{size:11},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return v>=5?(v/t*100).toFixed(0)+'%':''}}});

  // District
  makeChart('chart-district','bar',Object.keys(D.district),[{label:'Cases',data:Object.values(D.district),backgroundColor:PAL.map(c=>c+'cc'),borderRadius:4}],{legend:false});

  // Vehicle
  makeChart('chart-vehicle','bar',Object.keys(D.vehicle),[{label:'Cases',data:Object.values(D.vehicle),backgroundColor:[COLORS.red,COLORS.blue,COLORS.green,COLORS.orange,COLORS.purple],borderRadius:6}],{legend:false});

  // Time
  const timeOrder=['Early Morning (5-8am)','Morning (8am-12pm)','Afternoon (12-2pm)','Late Afternoon (2-5pm)','Evening (5-8pm)','Night (8pm-5am)'];
  const timeData=timeOrder.map(t=>D.time_period[t]||0);
  makeChart('chart-time','bar',timeOrder.map(t=>t.split('(')[0].trim()),
    [{label:'Cases',data:timeData,backgroundColor:[COLORS.orange,COLORS.yellow,COLORS.green,COLORS.teal,COLORS.blue,COLORS.purple],borderRadius:4}],{legend:false});

  // Shift
  makeChart('chart-shift','doughnut',Object.keys(D.shift),[{data:Object.values(D.shift),backgroundColor:PAL}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{size:11,weight:'bold'},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return (v/t*100).toFixed(0)+'%'}}});

  // Injury
  makeChart('chart-injury','doughnut',Object.keys(D.injury),[{data:Object.values(D.injury),backgroundColor:[COLORS.green,COLORS.orange,COLORS.red,COLORS.gray]}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{size:12,weight:'bold'},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return (v/t*100).toFixed(0)+'%'}}});

  // Treatment
  makeChart('chart-treatment','doughnut',Object.keys(D.treatment),[{data:Object.values(D.treatment),backgroundColor:[COLORS.green,COLORS.red,COLORS.gray]}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{size:12,weight:'bold'},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return (v/t*100).toFixed(0)+'%'}}});

  // MC
  makeChart('chart-mc','doughnut',Object.keys(D.mc),[{data:Object.values(D.mc),backgroundColor:[COLORS.blue,COLORS.red,COLORS.gray]}],
    {plugins:[ChartDataLabels],datalabels:{color:'#fff',font:{size:12,weight:'bold'},formatter:(v,c)=>{let t=c.dataset.data.reduce((a,b)=>a+b,0);return (v/t*100).toFixed(0)+'%'}}});

  // Cross-tab: Gender x Year
  const genders=Object.keys(D.gender);
  let tbl='<table><tr><th>Gender</th><th>2023</th><th>2024</th><th>2025</th><th>Total</th></tr>';
  genders.forEach(g=>{
    const vals=[D.gender_year['2023'][g]||0,D.gender_year['2024'][g]||0,D.gender_year['2025'][g]||0];
    tbl+=`<tr><td>${g}</td>${vals.map(v=>`<td>${v}</td>`).join('')}<td><strong>${vals.reduce((a,b)=>a+b,0)}</strong></td></tr>`;
  });
  tbl+='</table>';
  document.getElementById('table-gender-year').innerHTML=tbl;

  // Cross-tab: Vehicle x Injury
  const injuries=new Set();
  Object.values(D.vehicle_injury).forEach(v=>Object.keys(v).forEach(k=>injuries.add(k)));
  const injArr=[...injuries];
  let tbl2='<table><tr><th>Vehicle</th>'+injArr.map(i=>`<th>${i}</th>`).join('')+'<th>Total</th></tr>';
  Object.entries(D.vehicle_injury).forEach(([v,data])=>{
    const vals=injArr.map(i=>data[i]||0);
    tbl2+=`<tr><td>${v}</td>${vals.map(x=>`<td>${x}</td>`).join('')}<td><strong>${vals.reduce((a,b)=>a+b,0)}</strong></td></tr>`;
  });
  tbl2+='</table>';
  document.getElementById('table-vehicle-injury').innerHTML=tbl2;

  applyAPA('wrap-chart-trend', 'Figure', 'Annual Trend of Road Traffic Accidents vs. Other Occupational Incidents');
  applyAPA('wrap-chart-proportion', 'Figure', 'Road Traffic Accidents as a Proportion of All Occupational Incidents (2023-2025)');
  applyAPA('wrap-chart-gender', 'Figure', 'Gender Distribution of RTA Cases');
  applyAPA('wrap-chart-age', 'Figure', 'Age Group Distribution of RTA Cases');
  applyAPA('wrap-chart-ethnicity', 'Figure', 'Ethnicity Distribution of RTA Cases');
  applyAPA('wrap-jawatan', 'Figure', 'Top 15 Job Designations Involved in RTAs');
  applyAPA('wrap-chart-facility', 'Figure', 'Facility Type Distribution of RTA Cases');
  applyAPA('wrap-chart-district', 'Figure', 'District Distribution of RTA Cases in Kedah');
  applyAPA('wrap-chart-vehicle', 'Figure', 'Vehicle Type Involved in RTAs');
  applyAPA('wrap-chart-time', 'Figure', 'Time of Accident Occurrence');
  applyAPA('wrap-chart-shift', 'Figure', 'Work Shift Distribution During Accidents');
  applyAPA('wrap-chart-injury', 'Figure', 'Injury Severity Resulting from RTAs');
  applyAPA('wrap-chart-treatment', 'Figure', 'Medical Treatment Received Post-Accident');
  applyAPA('wrap-chart-mc', 'Figure', 'Medical Leave (MC) Granted Post-Accident');
  applyAPA('wrap-table-gender-year', 'Table', 'Cross-tabulation of RTA Cases by Gender and Year', 'N = 310 cases.');
  applyAPA('wrap-table-vehicle-injury', 'Table', 'Cross-tabulation of Vehicle Type and Injury Severity', 'N = 310 cases. Includes only cases with complete vehicle and injury data.');
}

function renderAnalytical(D){
  let html='<div class="section-title">Statistical Test Results</div>';
  
  D.analytical.forEach(r => {
    html+=`<div class="card card-full" style="margin-bottom:1.5rem">`;
    html+=`<div class="apa-label">Table ${tblCount++}</div><div class="apa-title">Analytical Statistics: ${r.test} for ${r.vars}</div>`;
    html+=`<table><tr><th>Statistic</th><th>df</th><th>p-value</th><th>Significance</th></tr>`;
    html+=`<tr><td>${r.stat}</td><td>${r.df}</td>
      <td><strong>${r.p}</strong></td><td><span class="stat-sig ${r.sig?'sig':'not-sig'}">${r.sig?'p < .05':'p > .05'}</span></td></tr>`;
    html+=`</table><div class="apa-note"><i>Note.</i> ${r.interpretation}. Significance level &alpha; = .05.</div></div>`;
  });
  
  // Detailed interpretation cards
  html+='<div class="section-title">Detailed Statistical Findings</div><div class="grid2">';
  D.analytical.forEach((r,i)=>{
    html+=`<div class="card"><h3>${r.vars}</h3>
      <p style="font-size:.8rem;color:var(--text2);margin-bottom:.5rem"><strong>Test:</strong> ${r.test}</p>
      <p style="font-size:.85rem;margin-bottom:.5rem">${r.stat}, p = ${r.p}</p>
      <span class="stat-sig ${r.sig?'sig':'not-sig'}">${r.sig?'SIGNIFICANT':'NOT SIGNIFICANT'}</span>
      <p style="font-size:.8rem;color:var(--text2);margin-top:.8rem">${r.interpretation}</p></div>`;
  });
  html+='</div>';

  // Summary box
  const sigTests=D.analytical.filter(r=>r.sig);
  html+=`<div class="section-title">Summary of Significant Findings</div>
    <div class="card card-full"><p style="font-size:.85rem;margin-bottom:.5rem">
    <strong>${sigTests.length} of ${D.analytical.length}</strong> statistical tests yielded significant results (p < 0.05):</p><ul style="padding-left:1.5rem">`;
  sigTests.forEach(r=>{html+=`<li style="font-size:.82rem;margin:.3rem 0">${r.vars}: ${r.interpretation} (${r.stat}, p=${r.p})</li>`});
  html+='</ul></div>';

  document.getElementById('analytical-results').innerHTML=html;
}

function renderThematic(D){
  document.getElementById('n-narrative').textContent=D.n_narrative;
  document.getElementById('n-cause').textContent=D.n_cause;
  document.getElementById('n-contrib').textContent=D.n_contrib;

  // Thematic Summary Table
  let tHtml = `<div class="card card-full" style="margin-bottom:1.5rem">`;
  tHtml += `<div class="apa-label">Table ${tblCount++}</div><div class="apa-title">Summary of Identified Themes and Subthemes from Reflexive Thematic Analysis</div>`;
  tHtml += `<table><tr><th>Theme</th><th>Subtheme</th><th>Description</th><th>Cause Citations</th><th>Contrib Citations</th><th>Narrative Citations</th><th>Case Frequency (n)</th></tr>`;
  
  const badges={'cause':'badge-red','contrib':'badge-orange','narrative':'badge-blue'};
  const badgeLabels={'cause':'Primary Cause','contrib':'Contributing Factor','narrative':'Narrative'};
  let cardsHtml='<div class="section-title">Identified Themes with Supporting Evidence</div>';

  if (D.theme_hierarchy) {
    Object.keys(D.theme_hierarchy).forEach(mainTheme => {
      let subHtml = '';
      let themeTotal = 0;
      let themeCards = '';
      
      D.theme_hierarchy[mainTheme].forEach(sub => {
        const c1 = D.cause_themes[sub]||0;
        const c2 = D.contrib_themes[sub]||0;
        const c3 = D.narrative_themes[sub]||0;
        const nCase = D.case_themes[sub]||0;
        
        if(nCase > 0) {
          themeTotal += nCase;
          subHtml += `<tr><td></td><td><strong>${sub}</strong></td><td style="font-size:0.8rem">${D.theme_desc[sub]||''}</td><td>${c1}</td><td>${c2}</td><td>${c3}</td><td><strong>${nCase}</strong></td></tr>`;
          
          // Build card
          themeCards+=`<div class="theme-card"><h4>${sub} <span class="badge badge-purple">n=${nCase}</span></h4>`;
          themeCards+=`<p class="desc">${D.theme_desc[sub]||''}</p>`;
          themeCards+=`<p style="font-size:.75rem;margin-bottom:.5rem">`;
          if(c1) themeCards+=`<span class="badge badge-red">Cause citations: ${c1}</span>`;
          if(c2) themeCards+=`<span class="badge badge-orange">Contrib citations: ${c2}</span>`;
          if(c3) themeCards+=`<span class="badge badge-blue">Narrative citations: ${c3}</span>`;
          themeCards+=`</p>`;
          if(D.theme_quotes[sub]){
            themeCards+=`<p style="font-size:.75rem;color:var(--accent2);margin-top:.5rem">Supporting Extracts:</p>`;
            D.theme_quotes[sub].forEach(q=>{
              themeCards+=`<div class="quote">"${q.text}..." <span class="badge ${badges[q.source]}">${badgeLabels[q.source]}</span></div>`;
            });
          }
          themeCards+=`</div>`;
        }
      });
      if(themeTotal > 0) {
         tHtml += `<tr><td colspan="6" style="background:var(--bg1)"><strong>${mainTheme}</strong></td><td style="background:var(--bg1)"><strong>${themeTotal}</strong></td></tr>`;
         tHtml += subHtml;
         cardsHtml += `<h3 style="margin:2rem 0 1rem 0;color:var(--primary)">${mainTheme}</h3>` + themeCards;
      }
    });
  }
  tHtml += `</table><div class="apa-note"><i>Note.</i> Themes extracted using Braun & Clarke's (2006) 6-phase framework and categorized according to the road accident contributing factors taxonomy (Ahmed et al., 2023).</div></div>`;
  document.getElementById('theme-summary-table').innerHTML = tHtml;

  // Theme charts
  const causeLabels=Object.keys(D.cause_themes).slice(0,10);
  const causeData=causeLabels.map(l=>D.cause_themes[l]);
  makeChart('chart-themes-cause','bar',causeLabels.map(l=>l.length>25?l.slice(0,22)+'...':l),
    [{label:'Frequency',data:causeData,backgroundColor:PAL.map(c=>c+'cc'),borderRadius:4}],
    {legend:false,extra:{indexAxis:'y'}});

  const contribLabels=Object.keys(D.contrib_themes).slice(0,10);
  const contribData=contribLabels.map(l=>D.contrib_themes[l]);
  makeChart('chart-themes-contrib','bar',contribLabels.map(l=>l.length>25?l.slice(0,22)+'...':l),
    [{label:'Frequency',data:contribData,backgroundColor:PAL.map(c=>c+'cc'),borderRadius:4}],
    {legend:false,extra:{indexAxis:'y'}});

  applyAPA('wrap-chart-themes-cause', 'Figure', 'Frequency Distribution of Themes Identified in Primary Causative Factors');
  applyAPA('wrap-chart-themes-contrib', 'Figure', 'Frequency Distribution of Themes Identified in Contributing Factors');

  document.getElementById('thematic-details').innerHTML=cardsHtml;
}

function renderSummary(D){
  const sigTests=D.analytical.filter(r=>r.sig);
  const topCause=Object.keys(D.cause_themes)[0]||'N/A';
  const topContrib=Object.keys(D.contrib_themes)[0]||'N/A';
  const topVehicle=Object.keys(D.vehicle)[0]||'N/A';
  const topDistrict=Object.keys(D.district)[0]||'N/A';

  let html=`
  <div class="section-title">Executive Summary</div>
  <div class="card card-full">
    <h3 style="color:var(--accent2);font-size:1rem;margin-bottom:1rem">Road Traffic Accidents Among Healthcare Workers: A Rising Occupational Hazard in Kedah, Malaysia (2023-2025)</h3>
    <div style="font-size:.85rem;line-height:1.8">
    <p><strong>Background:</strong> This analysis examines ${D.N} road traffic accident (RTA) cases among healthcare workers in Kedah, Malaysia, reported through the WEHU/KKP occupational health surveillance system from 2023 to 2025.</p>
    <br>
    <p><strong>Key Findings:</strong></p>
    <ul style="padding-left:1.5rem;margin:.5rem 0">
      <li><strong>Rising Trend:</strong> RTA cases increased dramatically from ${D.rta_counts[2023]} (2023) to ${D.rta_counts[2024]} (2024) to ${D.rta_counts[2025]} (2025), a ${D.growth}% increase over the study period.</li>
      <li><strong>Proportion:</strong> RTA constituted ${D.rta_pct[2023]}% (2023), ${D.rta_pct[2024]}% (2024), and ${D.rta_pct[2025]}% (2025) of all occupational incidents.</li>
      <li><strong>Demographics:</strong> The majority of victims were ${Object.keys(D.gender)[0]} (${Object.values(D.gender)[0]}/${D.N}, ${(Object.values(D.gender)[0]/D.N*100).toFixed(1)}%).</li>
      <li><strong>Vehicle:</strong> ${topVehicle} was the most common vehicle type involved.</li>
      <li><strong>District:</strong> ${topDistrict} reported the highest number of cases.</li>
      <li><strong>Injury:</strong> ${D.injury_pct}% sustained physical injuries; ${D.mc_rate}% were granted medical leave (mean ${D.avg_mc} days).</li>
    </ul>
    <br>
    <p><strong>Statistical Significance:</strong> ${sigTests.length} of ${D.analytical.length} analytical tests were significant (p<0.05):</p>
    <ul style="padding-left:1.5rem;margin:.5rem 0">
      ${sigTests.map(r=>`<li>${r.interpretation} (${r.stat}, p=${r.p})</li>`).join('')}
    </ul>
    <br>
    <p><strong>Thematic Analysis:</strong> The primary causative themes identified were:</p>
    <ol style="padding-left:1.5rem;margin:.5rem 0">
      ${Object.entries(D.cause_themes).slice(0,5).map(([k,v])=>`<li>${k} (n=${v})</li>`).join('')}
    </ol>
    <br>
    <p><strong>Recommendations:</strong></p>
    <ul style="padding-left:1.5rem;margin:.5rem 0">
      <li>Implement mandatory fatigue risk management programs for shift workers</li>
      <li>Provide road safety awareness training targeting early morning commuters</li>
      <li>Explore carpooling/shuttle services for healthcare workers with long commutes (>50km)</li>
      <li>Advocate for improved road infrastructure (street lighting, intersection design) near healthcare facilities</li>
      <li>Establish post-incident support and return-to-work protocols</li>
    </ul>
    </div>
  </div>`;
  document.getElementById('exec-summary').innerHTML=html;
}

function renderAdvancedAnalytics(D) {
  let html = `<div class="section-title" style="margin-top:1rem">Advanced Analytics (Inspired by Ahmed et al., 2023)</div>`;

  // 1. Predictive Odds Ratios
  html += `<div class="card card-full" style="margin-bottom:1.5rem">`;
  html += `<div class="apa-label">Table ${tblCount++}</div><div class="apa-title">Predictive Feature Importance: Odds Ratios for Severe Injury Risk</div>`;
  html += `<table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.85rem">
    <tr style="border-bottom:1px solid #2a2e3f"><th style="text-align:left;padding:8px">Predictive Factor</th><th style="padding:8px">Odds Ratio (OR)</th><th style="padding:8px">95% CI</th><th style="padding:8px">p-value</th><th style="padding:8px">Significance</th></tr>`;
  D.odds_ratios.forEach(r => {
     let badgeClass = r.stats.sig ? 'badge-red' : 'badge-purple';
     let sigText = r.stats.sig ? 'p < .05' : 'p > .05';
     html += `<tr style="border-bottom:1px solid #2a2e3f">
       <td style="padding:8px"><strong>${r.factor}</strong></td>
       <td style="text-align:center;padding:8px">${r.stats.OR}</td>
       <td style="text-align:center;padding:8px">${r.stats.ci}</td>
       <td style="text-align:center;padding:8px">${r.stats.p}</td>
       <td style="text-align:center;padding:8px"><span class="badge ${badgeClass}">${sigText}</span></td>
     </tr>`;
  });
  html += `</table><div class="apa-note"><i>Note.</i> Feature importance estimated using Epidemiological Odds Ratios (Fisher's Exact Test). OR > 1 indicates increased risk of injury. Significance level &alpha; = .05.</div></div>`;

  // 2. Blackspots
  html += `<div class="card card-full" style="margin-bottom:1.5rem">`;
  html += `<div class="apa-label">Table ${tblCount++}</div><div class="apa-title">High-Risk Accident Blackspots in Kedah (N-Gram Text Analysis)</div>`;
  html += `<table style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.85rem">
    <tr style="border-bottom:1px solid #2a2e3f"><th style="text-align:left;padding:8px;width:10%">Rank</th><th style="text-align:left;padding:8px">Location / Route</th><th style="padding:8px;text-align:center">Frequency (n)</th></tr>`;
  D.blackspots.forEach((b, i) => {
     html += `<tr style="border-bottom:1px solid #2a2e3f">
       <td style="padding:8px">${i+1}</td>
       <td style="padding:8px">${b.location}</td>
       <td style="padding:8px;text-align:center"><span class="badge badge-orange">${b.count}</span></td>
     </tr>`;
  });
  html += `</table><div class="apa-note"><i>Note.</i> Locations extracted from raw narrative fields using NLP N-gram string extraction. Stopwords were preserved to maintain context.</div></div>`;

  // 3. Fatigue Scatter Plot
  html += `<div class="card card-full" id="wrap-chart-fatigue">`;
  html += `<div class="chart-container" style="height:400px"><canvas id="chart-fatigue"></canvas></div>`;
  html += `</div>`;

  document.getElementById('advanced-content').innerHTML = html;

  applyAPA('wrap-chart-fatigue', 'Figure', 'Spatial-Temporal Fatigue Analysis: Commute Distance vs Accident Occurrence Ratio', 'A ratio of 1.0 indicates the accident occurred exactly at the workplace/destination. Ratios closer to 0 indicate accidents closer to home.');
  
  const shiftData = D.fatigue_data.filter(d=>d.shift === 'Shift Worker').map(d=>({x: d.d_work, y: d.ratio}));
  const standardData = D.fatigue_data.filter(d=>d.shift === 'Standard Office Hours').map(d=>({x: d.d_work, y: d.ratio}));

  new Chart(document.getElementById('chart-fatigue'), {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Shift Worker',
          data: shiftData,
          backgroundColor: 'rgba(225, 112, 85, 0.7)',
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: 'Standard Office Hours',
          data: standardData,
          backgroundColor: 'rgba(116, 185, 255, 0.7)',
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          title: { display: true, text: 'Total Commute Distance (km)', color: '#e4e6f0' },
          grid: { color: '#2a2e3f' },
          ticks: { color: '#9498ab' }
        },
        y: { 
          title: { display: true, text: 'Accident Distance Ratio', color: '#e4e6f0' },
          grid: { color: '#2a2e3f' },
          ticks: { color: '#9498ab' },
          max: 2.0 // Cap at 2.0 based on build filter
        }
      },
      plugins: {
         datalabels: { display: false },
         legend: { labels: { color: '#e4e6f0' } }
      }
    }
  });
}
