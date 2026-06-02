// Global chart instances so we can update/destroy them on reload
let finanzasChartInstance = null;
let gastosChartInstance = null;

function initCharts(finanzasData) {
  const ctxFinanzas = document.getElementById('chart-finanzas');
  const ctxGastos = document.getElementById('chart-gastos');

  if (!ctxFinanzas || !ctxGastos) return;

  // Destroy previous charts if they exist
  if (finanzasChartInstance) finanzasChartInstance.destroy();
  if (gastosChartInstance) gastosChartInstance.destroy();

  // 1. COMPARATIVA FINANCIERA (BAR CHART)
  // Generating a 6-month historical overview leading to May 2026
  const labelsFinanzas = ['Dic 2025', 'Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'Mayo 2026'];
  
  // Historical data curve: May 2026 is dynamic, others are realistic mock stats
  const dynamicIngresos = finanzasData.resumenMensual.mayo2026.ingresosFacturados;
  const dynamicCostos = finanzasData.resumenMensual.mayo2026.costosPlanilla;

  const dataIngresos = [12500000, 15400000, 18900000, 16200000, 19800000, dynamicIngresos];
  const dataCostos = [8900000, 10800000, 13100000, 11500000, 13800000, dynamicCostos];

  finanzasChartInstance = new Chart(ctxFinanzas, {
    type: 'bar',
    data: {
      labels: labelsFinanzas,
      datasets: [
        {
          label: 'Ingresos Facturados ($)',
          data: dataIngresos,
          backgroundColor: 'rgba(112, 160, 56, 0.75)', // Leaf Agricultural Green
          borderColor: '#7cb83e',
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(112, 160, 56, 0.95)'
        },
        {
          label: 'Costos Planilla ($)',
          data: dataCostos,
          backgroundColor: 'rgba(32, 64, 180, 0.75)', // Corporate Trust Blue
          borderColor: '#254acc',
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(32, 64, 180, 0.95)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#9baac0',
            font: { family: 'Montserrat', weight: 600, size: 11 }
          }
        },
        tooltip: {
          backgroundColor: '#0d1b3e',
          titleFont: { family: 'Montserrat', weight: 700 },
          bodyFont: { family: 'Inter' },
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#9baac0',
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#9baac0',
            font: { family: 'Inter', size: 10 },
            callback: function(value) {
              return '$' + (value / 1000000) + 'M';
            }
          }
        }
      }
    }
  });

  // 2. EXPENSES DISTRIBUTION (DOUGHNUT CHART)
  const gastos = finanzasData.resumenMensual.mayo2026.gastosOperativos;
  const labelsGastos = ['Combustible / Petróleo', 'Colaciones Cuadrillas', 'EPP Seguridad', 'Otros Gastos (Oficina/Repuestos)'];
  const dataGastos = [gastos.petroleo, gastos.colaciones, gastos.epp, gastos.otros];

  gastosChartInstance = new Chart(ctxGastos, {
    type: 'doughnut',
    data: {
      labels: labelsGastos,
      datasets: [
        {
          data: dataGastos,
          backgroundColor: [
            'rgba(32, 64, 180, 0.8)',   // Blue
            'rgba(112, 160, 56, 0.8)',  // Green
            'rgba(244, 244, 64, 0.8)',  // Sunset Gold
            'rgba(244, 91, 91, 0.8)'    // Alert Red
          ],
          borderColor: '#0d1b3e',
          borderWidth: 2,
          hoverOffset: 12
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9baac0',
            font: { family: 'Inter', size: 10 },
            boxWidth: 12
          }
        },
        tooltip: {
          backgroundColor: '#0d1b3e',
          titleFont: { family: 'Montserrat', weight: 700 },
          bodyFont: { family: 'Inter' },
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed !== null) {
                label += new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(context.parsed);
              }
              return label;
            }
          }
        }
      }
    }
  });
}
