const state = {
  dashboard: null,
  analytics: null,
  catalog: [],
  currentPrecip: 'blizzard',
  charts: {
    dashboard: null,
    analytics: null,
    weatherImpact: null,
    simResults: null,
    simFactors: null,
  },
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }
  return response.json();
}

function switchTab(tabId) {
  const views = ['dashboard', 'analytics', 'catalog', 'simulator'];
  views.forEach((v) => {
    document.getElementById(`view-${v}`).classList.add('hidden');
    const btn = document.getElementById(`nav-${v}`);
    if (btn) {
      btn.classList.remove('bg-sky-600', 'text-white', 'shadow-lg', 'shadow-sky-600/30');
      btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
    }
  });

  document.getElementById(`view-${tabId}`).classList.remove('hidden');
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
    activeBtn.classList.add('bg-sky-600', 'text-white', 'shadow-lg', 'shadow-sky-600/30');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadDashboard() {
  const data = await fetchJson('/api/dashboard');
  state.dashboard = data;

  document.getElementById('dash-temp').textContent = `${data.weather.temp}°C`;
  document.getElementById('dash-wind').textContent = `${data.weather.wind_speed} м/с`;
  document.getElementById('dash-humidity').textContent = `${data.weather.humidity}%`;
  document.getElementById('dash-ai-advice').textContent = data.aiAdvice;
  document.getElementById('topProductName').textContent = data.topProduct.name;
  document.getElementById('topProductStat').textContent = `${data.topProduct.stock} дана/апта`;
  document.getElementById('stockRiskCount').textContent = `${data.metrics.productRisk} тауар азайды`;

  const labels = data.forecast.map((item) => item.day_name);
  const values = data.forecast.map((item) => item.demand_index);
  const temps = data.forecast.map((item) => item.temp_c);

  if (state.charts.dashboard) state.charts.dashboard.destroy();
  const ctx = document.getElementById('chartDashboardForecast').getContext('2d');
  state.charts.dashboard = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Сұраныс (Индекс)', data: values, borderColor: '#0284c7', backgroundColor: 'rgba(2,132,199,0.1)', borderWidth: 3, tension: 0.4, yAxisID: 'y' },
        { label: 'Температура (°C)', data: temps, borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], pointRadius: 4, pointBackgroundColor: '#f59e0b', yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Сұраныс' } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Температура (°C)' } }
      }
    }
  });
}

async function loadAnalytics() {
  const data = await fetchJson('/api/analytics');
  state.analytics = data;

  renderCategoryBreakdown(data.categoryBreakdown);
  renderWeatherImpact(data.weatherImpact);

  if (state.charts.analytics) state.charts.analytics.destroy();
  const ctx = document.getElementById('chartAnalyticsComparison').getContext('2d');
  state.charts.analytics = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.comparison.labels,
      datasets: [
        { label: 'Нақты сатылым', data: data.comparison.actual, borderColor: '#0f172a', borderWidth: 2.5, fill: false, tension: 0.3 },
        { label: 'XGBoost Болжам', data: data.comparison.forecast, borderColor: '#d97706', borderDash: [6, 4], borderWidth: 2.5, fill: false, tension: 0.3 },
        { label: 'Температура (°C)', data: data.comparison.temperature, type: 'line', backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', fill: true, tension: 0.4, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { title: { display: true, text: 'Сұраныс (��ірлік)' } },
        y1: { position: 'right', title: { display: true, text: 'Температура (°C)' }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function renderCategoryBreakdown(data) {
  const list = document.getElementById('categoryBreakdownList');
  list.innerHTML = data.labels.map((label, index) => {
    const value = data.values[index];
    const colorMap = ['bg-amber-500', 'bg-sky-500', 'bg-purple-500', 'bg-emerald-500'];
    const iconMap = ['fa-coat-hanger', 'fa-shoe-prints', 'fa-mitten', 'fa-shirt'];
    const textMap = ['text-amber-600', 'text-sky-600', 'text-purple-600', 'text-emerald-600'];
    return `
      <div>
        <div class="flex justify-between text-sm font-semibold mb-1">
          <span class="flex items-center"><i class="fa-solid ${iconMap[index]} ${textMap[index]} mr-2"></i> ${label}</span>
          <span class="text-sky-600 font-bold">${value}%</span>
        </div>
        <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div class="${colorMap[index]} h-full rounded-full" style="width: ${value}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderWeatherImpact(data) {
  const items = [
    { label: 'Температура', value: data.values[0], className: 'bg-amber-50 border-amber-200 text-amber-800', icon: 'fa-temperature-three-quarters', iconColor: 'text-amber-600' },
    { label: 'Жел', value: data.values[1], className: 'bg-indigo-50 border-indigo-200 text-indigo-800', icon: 'fa-wind', iconColor: 'text-indigo-600' },
    { label: 'Жауын-шашын', value: data.values[2], className: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: 'fa-cloud-showers-heavy', iconColor: 'text-emerald-600' }
  ];

  document.getElementById('weatherFactorList').innerHTML = items.map(item => `
    <div class="flex items-center justify-between p-2 rounded-lg border ${item.className}">
      <span class="flex items-center"><i class="fa-solid ${item.icon} mr-2 ${item.iconColor}"></i>${item.label}</span>
      <span class="font-bold">${item.value}%</span>
    </div>
  `).join('');

  if (state.charts.weatherImpact) state.charts.weatherImpact.destroy();
  const ctx = document.getElementById('chartWeatherImpact').getContext('2d');
  state.charts.weatherImpact = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{ data: data.values, backgroundColor: ['#f59e0b', '#1e1b4b', '#10b981'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' }
  });
}

async function loadCatalog() {
  state.catalog = await fetchJson('/api/catalog');
  renderCatalog();
}

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const products = state.catalog.products || [];

  grid.innerHTML = products.map((product) => {
    const category = product.category;
    const bannerClass = {
      outerwear: 'bg-amber-100/50 border-amber-200 text-amber-700',
      footwear: 'bg-sky-100/50 border-sky-200 text-sky-700',
      thermo: 'bg-purple-100/50 border-purple-200 text-purple-700',
    }[category] || 'bg-slate-100 border-slate-200 text-slate-700';

    const icon = category === 'footwear' ? 'fa-shoe-prints' : category === 'thermo' ? 'fa-mitten' : 'fa-shirt';
    const actionText = product.category === 'thermo' ? 'ТОЛЫҚТЫРУ' : product.category === 'footwear' ? 'БЕКІТУ' : product.demand_level === 'ТӨМЕН' ? 'ЖЕҢІЛДІК (ML)' : 'ЖОСПАРЛАУ';
    const demandClasses = {
      ЖОҒАРЫ: 'text-emerald-600',
      ОРТАША: 'text-amber-600',
      ТӨМЕН: 'text-rose-600',
    };
    const productLabel = product.name.toUpperCase();
    return `
      <div class="product-card bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5" data-category="${product.category}" data-title="${product.short_name}">
        <div class="w-32 h-32 ${bannerClass} rounded-xl flex items-center justify-center p-2 shrink-0 border">
          <i class="fa-solid ${icon} text-6xl"></i>
        </div>
        <div class="flex-grow space-y-2 text-center sm:text-left w-full">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-slate-800 text-lg">${productLabel}</h4>
            <span class="bg-emerald-100 text-emerald-700 text-xs font-extrabold px-2 py-0.5 rounded-md">ML +${product.trend_score}%</span>
          </div>
          <div class="text-xs text-slate-600 font-medium space-y-1">
            <p>Қорда: <b class="text-slate-900">${product.stock_quantity} дана</b></p>
            <p class="flex items-center justify-center sm:justify-start">
              <span>Сұраныс:</span>
              <span class="ml-1 ${demandClasses[product.demand_level] || 'text-slate-600'} font-bold uppercase flex items-center">
                ${product.demand_level} <i class="fa-solid ${product.demand_level === 'ЖОҒАРЫ' ? 'fa-arrow-trend-up' : product.demand_level === 'ТӨМЕН' ? 'fa-arrow-trend-down' : 'fa-minus'} ml-1"></i>
              </span>
            </p>
          </div>
          <button onclick="triggerProductAction('${product.name} - ${product.reorder_status === 'REORDER' ? 'Тапсырыс Жоспарланды' : product.reorder_status === 'STABLE' ? 'Қор Бегітілді' : 'Жеңілдік Акциясы Іске Қосылды'}')" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-sm shadow transition flex items-center justify-center space-x-2">
            <span>${actionText}</span>
            <i class="fa-solid ${product.category === 'thermo' ? 'fa-plus' : product.demand_level === 'ТӨМЕН' ? 'fa-percent' : 'fa-arrow-right'} text-xs"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterCatalog(category, btn) {
  const buttons = document.querySelectorAll('.cat-btn');
  buttons.forEach((b) => {
    b.classList.remove('bg-white', 'text-sky-600', 'shadow-sm');
    b.classList.add('text-slate-600');
  });
  btn.classList.add('bg-white', 'text-sky-600', 'shadow-sm');
  const cards = document.querySelectorAll('.product-card');
  cards.forEach((card) => {
    if (category === 'all' || card.dataset.category === category) card.classList.remove('hidden');
    else card.classList.add('hidden');
  });
}

function searchCatalog() {
  const query = document.getElementById('catalogSearch').value.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  cards.forEach((card) => {
    const title = (card.dataset.title || '').toLowerCase();
    if (title.includes(query)) card.classList.remove('hidden');
    else card.classList.add('hidden');
  });
}

function exportCSV() {
  fetch('/api/export/csv')
    .then((response) => response.blob())
    .then((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'astana_fashion_ai_matrix.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV файл сәтті жүктелді!');
    });
}

function updateSimControls() {
  const temp = document.getElementById('simTempInput').value;
  const wind = document.getElementById('simWindInput').value;
  document.getElementById('simTempVal').textContent = `${temp}°C`;
  document.getElementById('simWindVal').textContent = `${wind} м/с`;

  const badgeTemp = document.getElementById('simTempBadge');
  if (temp <= -20) {
    badgeTemp.textContent = '⚠️ Аяз (Extreme Cold)';
    badgeTemp.className = 'text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold';
  } else if (temp <= 0) {
    badgeTemp.textContent = '❄️ Суық (Cold)';
    badgeTemp.className = 'text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-bold';
  } else {
    badgeTemp.textContent = '🌤️ Жылы (Mild)';
    badgeTemp.className = 'text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold';
  }

  const badgeWind = document.getElementById('simWindBadge');
  if (wind >= 15) {
    badgeWind.textContent = '🌪️ Қатты дауыл (Gale)';
    badgeWind.className = 'text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold';
  } else if (wind >= 8) {
    badgeWind.textContent = '🍃 Қатты жел (Strong Wind)';
    badgeWind.className = 'text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold';
  } else {
    badgeWind.textContent = '💨 Баяу жел (Light Wind)';
    badgeWind.className = 'text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-bold';
  }
}

function selectPrecip(type, btn) {
  state.currentPrecip = type;
  const buttons = document.querySelectorAll('#precipGroup .precip-btn');
  buttons.forEach((b) => {
    b.classList.remove('bg-slate-900', 'text-white', 'active', 'shadow');
    b.classList.add('text-slate-700');
  });
  btn.classList.add('bg-slate-900', 'text-white', 'active', 'shadow');
}

async function runSimulation() {
  const temp = Number(document.getElementById('simTempInput').value);
  const wind = Number(document.getElementById('simWindInput').value);
  const precip = state.currentPrecip;

  const data = await fetchJson(`/api/simulator?temp=${temp}&wind=${wind}&precip=${precip}`);

  if (state.charts.simResults) state.charts.simResults.destroy();
  const simResCtx = document.getElementById('chartSimResults').getContext('2d');
  state.charts.simResults = new Chart(simResCtx, {
    type: 'bar',
    data: {
      labels: ['Сыртқы киім', 'Аяқ киім', 'Термобелье', 'Аксессуарлар'],
      datasets: [{ label: 'Өзгеріс (%)', data: [data.values.outerwear, data.values.footwear, data.values.thermo, data.values.accessories], backgroundColor: ['#d97706', '#0284c7', '#ea580c', '#8b5cf6'], borderRadius: 8 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (value) => `${value}%` }, title: { display: true, text: 'Сұраныс артуы (%)' } } }
    }
  });

  if (state.charts.simFactors) state.charts.simFactors.destroy();
  const simFacCtx = document.getElementById('chartSimFactors').getContext('2d');
  state.charts.simFactors = new Chart(simFacCtx, {
    type: 'doughnut',
    data: {
      labels: ['Температура', 'Жел', 'Қар/Жауын'],
      datasets: [{ data: [data.factors.temp, data.factors.wind, data.factors.precip], backgroundColor: ['#f59e0b', '#1e1b4b', '#10b981'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '65%' }
  });

  document.getElementById('simFactorTemp').textContent = `${data.factors.temp}%`;
  document.getElementById('simFactorWind').textContent = `${data.factors.wind}%`;
  document.getElementById('simFactorPrecip').textContent = `${data.factors.precip}%`;

  document.getElementById('dash-temp').textContent = `${temp}°C`;
  document.getElementById('dash-wind').textContent = `${wind} м/с`;
  document.getElementById('dash-ai-advice').textContent = data.advice;

  showToast('ML XGBoost Сценарийі нәтижелері қайта есептелді!');
}

function setAnalyticsTimeframe(tf, btn) {
  const buttons = document.querySelectorAll('.tf-btn');
  buttons.forEach((b) => {
    b.classList.remove('bg-white', 'text-sky-600', 'shadow-sm');
    b.classList.add('text-slate-600');
  });
  btn.classList.add('bg-white', 'text-sky-600', 'shadow-sm');

  fetchJson(`/api/analytics?timeframe=${tf}`)
    .then((data) => {
      state.analytics = data;
      if (state.charts.analytics) state.charts.analytics.destroy();
      const ctx = document.getElementById('chartAnalyticsComparison').getContext('2d');
      state.charts.analytics = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.comparison.labels,
          datasets: [
            { label: 'Нақты сатылым', data: data.comparison.actual, borderColor: '#0f172a', borderWidth: 2.5, fill: false, tension: 0.3 },
            { label: 'XGBoost Болжам', data: data.comparison.forecast, borderColor: '#d97706', borderDash: [6, 4], borderWidth: 2.5, fill: false, tension: 0.3 },
            { label: 'Температура (°C)', data: data.comparison.temperature, type: 'line', backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', fill: true, tension: 0.4, yAxisID: 'y1' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: {
            y: { title: { display: true, text: 'Сұраныс (бірлік)' } },
            y1: { position: 'right', title: { display: true, text: 'Температура (°C)' }, grid: { drawOnChartArea: false } }
          }
        }
      });
    });
}

function triggerProductAction(msg) {
  showToast(msg);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

async function init() {
  try {
    await loadDashboard();
    await loadAnalytics();
    await loadCatalog();
    updateSimControls();
    selectPrecip('blizzard', document.querySelector('.precip-btn.active') || document.querySelectorAll('.precip-btn')[3]);
    const now = new Date();
    document.getElementById('currentDateStr').textContent = now.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (error) {
    console.error(error);
    showToast('Деректерді жүктеу кезінде қате орын алды.');
  }
}

window.addEventListener('load', init);
window.addEventListener('resize', () => {
  Object.values(state.charts).forEach((chart) => chart && chart.resize());
});
