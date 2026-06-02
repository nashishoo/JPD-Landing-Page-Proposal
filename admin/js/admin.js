document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // 🔐 AUTH & SESSION CHECK
  // ----------------------------------------------------
  const checkAuth = () => {
    const token = sessionStorage.getItem('jpd_token');
    if (!token) {
      window.location.href = '/#login';
    }
  };
  
  // Verify auth on mount
  checkAuth();

  // Logout button
  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem('jpd_token');
    window.location.href = '/';
  });

  // Set Top Header Date to current Chilean timezone date
  const updateHeaderDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('es-CL', options);
    // Capitalize first letter
    document.getElementById('header-date').innerText = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);
  };
  updateHeaderDate();

  // ----------------------------------------------------
  // 🔀 SPA NAVIGATION (TABS ROUTING)
  // ----------------------------------------------------
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  const viewTitle = document.getElementById('view-title');
  const viewSubtitle = document.getElementById('view-subtitle');

  const viewMetadata = {
    dashboard: { title: 'Dashboard General', subtitle: 'Resumen del estado financiero y operativo hoy' },
    asistencia: { title: 'Libro de Asistencia', subtitle: 'Marcaje diario y control de transporte de cuadrillas' },
    tarjas: { title: 'Registro de Tarja Diaria', subtitle: 'Faenas de cosecha y packing por trato o jornal' },
    personal: { title: 'Planilla de Personal', subtitle: 'Listado oficial de cuadrillas y datos de contratación' },
    finanzas: { title: 'Remuneraciones y Costos', subtitle: 'Liquidaciones de sueldo, anticipos quincenales y márgenes' }
  };

  const switchTab = (tabId) => {
    // Update Sidebar tabs
    navTabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Show active panel
    viewPanels.forEach(panel => {
      if (panel.id === `panel-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update Titles
    if (viewMetadata[tabId]) {
      viewTitle.innerText = viewMetadata[tabId].title;
      viewSubtitle.innerText = viewMetadata[tabId].subtitle;
    }

    // Trigger data loading for active tab
    loadViewData(tabId);
  };

  // Listen for navigation clicks
  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = tab.getAttribute('data-tab');
      window.location.hash = tabId;
      switchTab(tabId);
    });
  });

  // Handle Hash Changes
  const handleHashChange = () => {
    const hash = window.location.hash.substring(1) || 'dashboard';
    if (viewMetadata[hash]) {
      switchTab(hash);
    }
  };
  window.addEventListener('hashchange', handleHashChange);
  // Initial run
  handleHashChange();

  // ----------------------------------------------------
  // 💵 FINANZAS SUBTAB NAVIGATION
  // ----------------------------------------------------
  const subtabBtns = document.querySelectorAll('.subtab-btn');
  const subtabContents = document.querySelectorAll('.subtab-content');

  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subtabId = btn.getAttribute('data-subtab');
      
      // Update buttons
      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content
      subtabContents.forEach(content => {
        if (content.id === `subtab-${subtabId}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // ----------------------------------------------------
  // 🔄 VIEW DATA FETCHING & RENDERING
  // ----------------------------------------------------
  // Local state cache
  let cache = {
    trabajadores: [],
    cuadrillas: [],
    asistencia: [],
    tarjas: [],
    finanzas: {},
    liquidaciones: []
  };

  function loadViewData(viewId) {
    if (viewId === 'dashboard') {
      loadDashboardData();
    } else if (viewId === 'asistencia') {
      loadAsistenciaData();
    } else if (viewId === 'tarjas') {
      loadTarjasData();
    } else if (viewId === 'personal') {
      loadPersonalData();
    } else if (viewId === 'finanzas') {
      loadFinanzasData();
    }
  }

  // A. DASHBOARD VIEW CONTROLLER
  async function loadDashboardData() {
    try {
      // 1. Fetch Finance Stats
      const finRes = await fetch('/api/finanzas');
      const finData = await finRes.json();
      cache.finanzas = finData;

      // 2. Fetch Workers
      const trabRes = await fetch('/api/trabajadores');
      const trabData = await trabRes.json();
      cache.trabajadores = trabData;

      // Render KPIs
      const resumen = finData.resumenMensual.mayo2026;
      
      // Dynamic active today: count active attendees for May 29, 2026 (last weekday of mock data)
      const mockToday = '2026-05-29';
      const asistRes = await fetch(`/api/asistencia?fecha=${mockToday}`);
      const asistData = await asistRes.json();
      const presentCount = asistData.filter(a => a.estado === 'Presente').length;
      
      document.getElementById('kpi-dotacion').innerText = `${presentCount} / ${trabData.length}`;
      document.getElementById('kpi-ingresos').innerText = formatCLP(resumen.ingresosFacturados);
      document.getElementById('kpi-costos').innerText = formatCLP(resumen.costosPlanilla);
      document.getElementById('kpi-ganancia').innerText = formatCLP(resumen.margenNeto);
      document.getElementById('kpi-ganancia-porcentaje').innerText = `Margen Neto: ${resumen.porcentajeMargen}%`;

      // Render Charts
      initCharts(finData);

      // Render Recent Transactions
      const tbody = document.getElementById('tbody-movimientos');
      tbody.innerHTML = '';
      
      finData.movimientosRecientes.slice(0, 5).forEach(m => {
        const tr = document.createElement('tr');
        const badgeClass = m.tipo === 'Ingreso' ? 'badge-presente' : 'badge-ausente';
        const typeSymbol = m.tipo === 'Ingreso' ? '+' : '-';
        const amountClass = m.tipo === 'Ingreso' ? 'text-green' : 'text-red';
        
        tr.innerHTML = `
          <td>${formatDateSimple(m.fecha)}</td>
          <td><span class="badge ${badgeClass}">${m.categoria}</span></td>
          <td><strong>${m.descripcion}</strong></td>
          <td class="font-title ${amountClass}"><strong>${typeSymbol} ${formatCLP(m.monto)}</strong></td>
          <td><span class="badge ${badgeClass}">${m.tipo}</span></td>
        `;
        tbody.appendChild(tr);
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  // B. ASISTENCIA VIEW CONTROLLER
  const asistDateInput = document.getElementById('asistencia-date');
  const asistCuadrillaSelect = document.getElementById('asistencia-cuadrilla');
  
  // Set default date input value to the last weekday of mock data (2026-05-29)
  if (!asistDateInput.value) {
    asistDateInput.value = '2026-05-29';
  }

  asistDateInput.addEventListener('change', () => loadAsistenciaData());
  asistCuadrillaSelect.addEventListener('change', () => loadAsistenciaData());

  async function loadAsistenciaData() {
    try {
      const fecha = asistDateInput.value;
      const cuadrillaId = asistCuadrillaSelect.value;

      // 1. Fetch Workers & Cuadrillas
      const trabRes = await fetch('/api/trabajadores');
      const trabData = await trabRes.json();
      cache.trabajadores = trabData;

      const cuadRes = await fetch('/api/cuadrillas');
      const cuadData = await cuadRes.json();
      cache.cuadrillas = cuadData;

      // Populate cuadrilla select if empty
      if (asistCuadrillaSelect.children.length <= 1) {
        cuadData.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.innerText = c.nombre;
          asistCuadrillaSelect.appendChild(opt);
        });
      }

      // 2. Fetch Attendance for selected date
      const asistRes = await fetch(`/api/asistencia?fecha=${fecha}`);
      const asistData = await asistRes.json();
      cache.asistencia = asistData;

      // Filter workers by selected Cuadrilla
      let filteredWorkers = trabData;
      if (cuadrillaId !== 'all') {
        filteredWorkers = trabData.filter(t => t.cuadrillaId === parseInt(cuadrillaId));
      }

      const tbody = document.getElementById('tbody-asistencia');
      tbody.innerHTML = '';

      if (filteredWorkers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay trabajadores en esta cuadrilla.</td></tr>`;
        return;
      }

      filteredWorkers.forEach(w => {
        const c = cuadData.find(cuad => cuad.id === w.cuadrillaId);
        
        // Find existing attendance record
        let record = asistData.find(a => a.trabajadorId === w.id);
        
        // Default record if not found
        if (!record) {
          record = {
            trabajadorId: w.id,
            fecha: fecha,
            estado: 'Presente',
            horaIngreso: '08:00',
            horaSalida: '17:30',
            usoTransporte: true
          };
        }

        const tr = document.createElement('tr');
        tr.setAttribute('data-worker-id', w.id);
        
        // Get initial button classes
        const getToggleClass = (state, match) => state === match ? match.toLowerCase() : '';
        
        const avatarChar = w.nombre.charAt(0);
        const avatarColors = ['#183080', '#70a038', '#e8d02c', '#a03880'];
        const avatarBg = avatarColors[w.cuadrillaId % avatarColors.length];

        tr.innerHTML = `
          <td>
            <div class="worker-row-avatar">
              <div class="w-avatar" style="background-color: ${avatarBg}">${avatarChar}</div>
              <div class="client-details-text">
                <span class="client-name">${w.nombre}</span>
                <span class="client-fundo">${w.rol} • RUT: ${w.rut}</span>
              </div>
            </div>
          </td>
          <td><strong>${c ? c.nombre.split(' — ')[1] : 'Sin asignación'}</strong></td>
          <td>
            <div class="toggle-group" data-worker-id="${w.id}">
              <button type="button" class="btn-toggle-asistencia P ${getToggleClass(record.estado, 'Presente') ? 'presente' : ''}" onclick="toggleAsist(this, 'Presente')">P</button>
              <button type="button" class="btn-toggle-asistencia A ${getToggleClass(record.estado, 'Ausente') ? 'ausente' : ''}" onclick="toggleAsist(this, 'Ausente')">A</button>
              <button type="button" class="btn-toggle-asistencia L ${getToggleClass(record.estado, 'Licencia') ? 'licencia' : ''}" onclick="toggleAsist(this, 'Licencia')">L</button>
              <button type="button" class="btn-toggle-asistencia PE ${getToggleClass(record.estado, 'Permiso') ? 'permiso' : ''}" onclick="toggleAsist(this, 'Permiso')">PE</button>
            </div>
          </td>
          <td>
            <input type="text" class="form-input time-input" value="${record.horaIngreso || ''}" ${record.estado !== 'Presente' ? 'disabled' : ''} placeholder="08:00">
          </td>
          <td>
            <input type="text" class="form-input time-input" value="${record.horaSalida || ''}" ${record.estado !== 'Presente' ? 'disabled' : ''} placeholder="17:30">
          </td>
          <td class="text-center">
            <input type="checkbox" class="bus-checkbox" ${record.usoTransporte ? 'checked' : ''} ${record.estado !== 'Presente' ? 'disabled' : ''} style="transform: scale(1.3); accent-color: var(--secondary-color);">
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  }

  // Global attendance state click helper
  window.toggleAsist = (btn, estado) => {
    const group = btn.closest('.toggle-group');
    group.querySelectorAll('.btn-toggle-asistencia').forEach(b => {
      b.classList.remove('presente', 'ausente', 'licencia', 'permiso');
    });
    
    btn.classList.add(estado.toLowerCase());
    
    // Enable or disable corresponding time inputs in the row
    const row = btn.closest('tr');
    const timeInputs = row.querySelectorAll('.time-input');
    const busCheck = row.querySelector('.bus-checkbox');
    
    if (estado === 'Presente') {
      timeInputs.forEach(i => {
        i.removeAttribute('disabled');
        if (!i.value) i.value = i.placeholder;
      });
      busCheck.removeAttribute('disabled');
      busCheck.checked = true;
    } else {
      timeInputs.forEach(i => {
        i.setAttribute('disabled', 'true');
        i.value = '';
      });
      busCheck.setAttribute('disabled', 'true');
      busCheck.checked = false;
    }
  };

  // Save attendance
  document.getElementById('btn-save-asistencia').addEventListener('click', async () => {
    try {
      const date = asistDateInput.value;
      const rows = document.querySelectorAll('#tbody-asistencia tr[data-worker-id]');
      const recordsToSave = [];

      rows.forEach(row => {
        const workerId = parseInt(row.getAttribute('data-worker-id'));
        const activeBtn = row.querySelector('.btn-toggle-asistencia.presente, .btn-toggle-asistencia.ausente, .btn-toggle-asistencia.licencia, .btn-toggle-asistencia.permiso');
        
        let estado = 'Presente';
        if (activeBtn.classList.contains('ausente')) estado = 'Ausente';
        if (activeBtn.classList.contains('licencia')) estado = 'Licencia';
        if (activeBtn.classList.contains('permiso')) estado = 'Permiso';

        const timeInputs = row.querySelectorAll('.time-input');
        const usoTransporte = row.querySelector('.bus-checkbox').checked;

        recordsToSave.push({
          trabajadorId: workerId,
          fecha: date,
          estado: estado,
          horaIngreso: timeInputs[0].value || '',
          horaSalida: timeInputs[1].value || '',
          usoTransporte: usoTransporte
        });
      });

      const response = await fetch('/api/asistencia/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordsToSave)
      });
      
      const resData = await response.json();
      if (resData.success) {
        alert('Asistencia guardada y acumulados de remuneraciones actualizados con éxito.');
        loadAsistenciaData();
      } else {
        alert('Error: ' + resData.message);
      }

    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error de conexión al guardar asistencia.');
    }
  });

  // C. TARJAS VIEW CONTROLLER
  const tarjaDateInput = document.getElementById('tarja-date');
  
  if (!tarjaDateInput.value) {
    tarjaDateInput.value = '2026-05-29';
  }

  tarjaDateInput.addEventListener('change', () => loadTarjasData());

  async function loadTarjasData() {
    try {
      const fecha = tarjaDateInput.value;

      // 1. Fetch Workers & Cuadrillas
      const trabRes = await fetch('/api/trabajadores');
      const trabData = await trabRes.json();
      cache.trabajadores = trabData;

      const cuadRes = await fetch('/api/cuadrillas');
      const cuadData = await cuadRes.json();
      cache.cuadrillas = cuadData;

      // 2. Fetch Attendance for date (only present workers can submit tarjas)
      const asistRes = await fetch(`/api/asistencia?fecha=${fecha}`);
      const asistData = await asistRes.json();

      // 3. Fetch existing tarjas
      const tarjaRes = await fetch(`/api/tarjas?fecha=${fecha}`);
      const tarjaData = await tarjaRes.json();

      const tbody = document.getElementById('tbody-tarjas');
      tbody.innerHTML = '';

      // Check present workers
      const presentWorkerIds = asistData
        .filter(a => a.estado === 'Presente')
        .map(a => a.trabajadorId);

      const presentWorkers = trabData.filter(t => presentWorkerIds.includes(t.id));

      if (presentWorkers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay trabajadores marcados como 'Presente' en la asistencia de este día.<br>Por favor, registra primero la asistencia.</td></tr>`;
        return;
      }

      presentWorkers.forEach(w => {
        const c = cuadData.find(cuad => cuad.id === w.cuadrillaId);
        
        // Find existing tarja record
        let record = tarjaData.find(t => t.trabajadorId === w.id);
        
        let initialQty = 1;
        let initialPrice = c ? c.precioTrato : 22000;
        let labor = c ? c.laborPrincipal : 'Cosecha';
        let tipoPago = c ? c.tipoPago : 'Jornal';

        if (w.rol === 'Caporal') {
          tipoPago = 'Jornal';
          initialPrice = 35000;
          labor = c ? c.laborPrincipal : 'Coordinación';
        }

        if (record) {
          initialQty = record.cantidad;
          initialPrice = record.precioUnitario;
          labor = record.labor;
          tipoPago = record.tipoPago;
        } else {
          // If piece rate (Trato), load standard realistic start numbers
          if (tipoPago === 'Trato') {
            initialQty = w.cuadrillaId === 1 ? 80 : 55; // Cerezas vs Arándanos
          }
        }

        const totalGanado = Math.round(initialQty * initialPrice);

        const tr = document.createElement('tr');
        tr.setAttribute('data-worker-id', w.id);
        tr.setAttribute('data-labor', labor);
        tr.setAttribute('data-tipo-pago', tipoPago);
        
        const avatarChar = w.nombre.charAt(0);
        const avatarColors = ['#183080', '#70a038', '#e8d02c', '#a03880'];
        const avatarBg = avatarColors[w.cuadrillaId % avatarColors.length];

        tr.innerHTML = `
          <td>
            <div class="worker-row-avatar">
              <div class="w-avatar" style="background-color: ${avatarBg}">${avatarChar}</div>
              <div class="client-details-text">
                <span class="client-name">${w.nombre}</span>
                <span class="client-fundo">${w.rol} • RUT: ${w.rut}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="client-details-text">
              <span class="client-name">${labor}</span>
              <span class="client-fundo">${c ? c.fundo : ''}</span>
            </div>
          </td>
          <td><span class="badge ${tipoPago === 'Trato' ? 'badge-licencia' : 'badge-presente'}">${tipoPago}</span></td>
          <td>
            <input type="number" class="form-input qty-input" value="${initialQty}" min="0.5" step="0.5" oninput="updateTarjaTotal(this)" style="max-width: 140px;">
          </td>
          <td>
            <input type="number" class="form-input price-input" value="${initialPrice}" min="0" step="50" oninput="updateTarjaTotal(this)" style="max-width: 160px;">
          </td>
          <td>
            <strong class="text-green font-title tarja-total-label">${formatCLP(totalGanado)}</strong>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (error) {
      console.error('Error loading tarjas data:', error);
    }
  }

  // Update row totals dynamically in client view
  window.updateTarjaTotal = (input) => {
    const row = input.closest('tr');
    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
    const price = parseInt(row.querySelector('.price-input').value) || 0;
    const totalLabel = row.querySelector('.tarja-total-label');
    
    const total = Math.round(qty * price);
    totalLabel.innerText = formatCLP(total);
  };

  // Save tarjas
  document.getElementById('btn-save-tarjas').addEventListener('click', async () => {
    try {
      const date = tarjaDateInput.value;
      const rows = document.querySelectorAll('#tbody-tarjas tr[data-worker-id]');
      const recordsToSave = [];

      rows.forEach(row => {
        const workerId = parseInt(row.getAttribute('data-worker-id'));
        const labor = row.getAttribute('data-labor');
        const tipoPago = row.getAttribute('data-tipo-pago');
        const cantidad = parseFloat(row.querySelector('.qty-input').value) || 0;
        const precioUnitario = parseInt(row.querySelector('.price-input').value) || 0;

        recordsToSave.push({
          trabajadorId: workerId,
          fecha: date,
          labor: labor,
          tipoPago: tipoPago,
          cantidad: cantidad,
          precioUnitario: precioUnitario
        });
      });

      const response = await fetch('/api/tarjas/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordsToSave)
      });
      
      const resData = await response.json();
      if (resData.success) {
        alert('Producción de Tarjas guardada y acumulados de remuneraciones recalculados con éxito.');
        loadTarjasData();
      } else {
        alert('Error: ' + resData.message);
      }

    } catch (error) {
      console.error('Error saving tarjas:', error);
      alert('Error de conexión al guardar tarjas.');
    }
  });

  // D. PERSONAL VIEW CONTROLLER
  const searchInput = document.getElementById('search-personal');
  
  searchInput.addEventListener('input', () => {
    renderPersonalTable();
  });

  async function loadPersonalData() {
    try {
      // Fetch Workers & Cuadrillas
      const trabRes = await fetch('/api/trabajadores');
      const trabData = await trabRes.json();
      cache.trabajadores = trabData;

      const cuadRes = await fetch('/api/cuadrillas');
      const cuadData = await cuadRes.json();
      cache.cuadrillas = cuadData;

      // Populate cuadrilla select inside hire modal
      const newCuadrillaSelect = document.getElementById('new-cuadrilla');
      newCuadrillaSelect.innerHTML = '';
      cuadData.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = c.nombre;
        newCuadrillaSelect.appendChild(opt);
      });

      renderPersonalTable();

    } catch (error) {
      console.error('Error loading personal data:', error);
    }
  }

  function renderPersonalTable() {
    const q = searchInput.value.toLowerCase();
    const tbody = document.getElementById('tbody-personal');
    tbody.innerHTML = '';

    const filtered = cache.trabajadores.filter(w => 
      w.nombre.toLowerCase().includes(q) || w.rut.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No se encontraron trabajadores con ese término.</td></tr>`;
      return;
    }

    filtered.forEach(w => {
      const c = cache.cuadrillas.find(cuad => cuad.id === w.cuadrillaId);
      const tr = document.createElement('tr');
      
      const badgeClass = w.estado === 'Activo' ? 'badge-presente' : 'badge-inactivo';
      
      const avatarChar = w.nombre.charAt(0);
      const avatarColors = ['#183080', '#70a038', '#e8d02c', '#a03880'];
      const avatarBg = avatarColors[w.cuadrillaId % avatarColors.length];

      tr.innerHTML = `
        <td>
          <div class="worker-row-avatar">
            <div class="w-avatar" style="background-color: ${avatarBg}">${avatarChar}</div>
            <strong class="client-name">${w.nombre}</strong>
          </div>
        </td>
        <td><strong>${w.rut}</strong></td>
        <td>${w.comuna}</td>
        <td>${w.telefono}</td>
        <td><span class="text-blue"><strong>${c ? c.nombre.split(' — ')[1] : 'Sin asignar'}</strong></span></td>
        <td>${w.rol}</td>
        <td><span class="badge ${badgeClass}">${w.estado}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Personal modal controllers
  const modalTrabajador = document.getElementById('modal-nuevo-trabajador');
  
  document.getElementById('btn-open-nuevo-trabajador').addEventListener('click', () => {
    modalTrabajador.classList.add('active');
  });

  document.getElementById('btn-close-modal-trabajador').addEventListener('click', () => {
    modalTrabajador.classList.remove('active');
  });

  // Handle hire form submit
  document.getElementById('form-nuevo-trabajador').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: document.getElementById('new-nombre').value,
        rut: document.getElementById('new-rut').value,
        telefono: document.getElementById('new-telefono').value,
        comuna: document.getElementById('new-comuna').value,
        cuadrillaId: parseInt(document.getElementById('new-cuadrilla').value),
        rol: document.getElementById('new-rol').value,
        banco: document.getElementById('new-banco').value,
        tipoCuenta: document.getElementById('new-tipo-cuenta').value,
        numeroCuenta: document.getElementById('new-numero-cuenta').value
      };

      const response = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        alert('Trabajador contratado e incorporado con éxito a JPD.');
        modalTrabajador.classList.remove('active');
        document.getElementById('form-nuevo-trabajador').reset();
        loadPersonalData();
      } else {
        alert('Error: ' + resData.message);
      }

    } catch (error) {
      console.error('Error hiring worker:', error);
      alert('Error de conexión al contratar.');
    }
  });

  // E. FINANZAS VIEW CONTROLLER
  async function loadFinanzasData() {
    try {
      // 1. Fetch Finance Stats
      const finRes = await fetch('/api/finanzas');
      const finData = await finRes.json();
      cache.finanzas = finData;

      // 2. Fetch Payroll Liquidaciones
      const liqRes = await fetch('/api/liquidaciones');
      const liqData = await liqRes.json();
      cache.liquidaciones = liqData;

      const trabRes = await fetch('/api/trabajadores');
      const trabData = await trabRes.json();
      cache.trabajadores = trabData;

      // SUBTAB 1: Resumen Financiero General
      // Exportadoras
      const clientsList = document.getElementById('billing-clients-list');
      clientsList.innerHTML = '';
      
      const charClasses = ['', 'green', 'gold'];

      finData.clientesFacturacion.forEach((cli, idx) => {
        const charBg = charClasses[idx % charClasses.length];
        const initial = cli.nombre.charAt(0);
        const li = document.createElement('li');
        li.className = 'billing-item';
        li.innerHTML = `
          <div class="client-info-box">
            <div class="client-logo-char ${charBg}">${initial}</div>
            <div class="client-details-text">
              <span class="client-name">${cli.nombre}</span>
              <span class="client-fundo">${cli.fundo} • Comisión: ${cli.markup * 100}%</span>
            </div>
          </div>
          <span class="client-billing-value">${formatCLP(cli.totalFacturado)}</span>
        `;
        clientsList.appendChild(li);
      });

      // Expenses
      const expList = document.getElementById('expenses-list');
      expList.innerHTML = '';
      
      const expObj = finData.resumenMensual.mayo2026.gastosOperativos;
      const expLabels = {
        petroleo: 'Furgones y Combustible (Petróleo)',
        colaciones: 'Snacks y Colaciones Cuadrillas',
        epp: 'EPP de Seguridad (Antiparras/Guantes)',
        otros: 'Gastos de Administración y Oficina'
      };

      Object.keys(expObj).forEach(key => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
          <span class="client-name">${expLabels[key]}</span>
          <span class="expense-value">${formatCLP(expObj[key])}</span>
        `;
        expList.appendChild(li);
      });

      // SUBTAB 2: Payroll Liquidaciones Master List
      const tbodyLiq = document.getElementById('tbody-liquidaciones');
      tbodyLiq.innerHTML = '';

      liqData.forEach(liq => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td><strong>${liq.nombre}</strong><br><span class="text-muted text-xs">${liq.rol}</span></td>
          <td class="text-center"><strong>${liq.diasTrabajados}</strong></td>
          <td class="text-right">${formatCLP(liq.sueldoBase)}</td>
          <td class="text-right text-green">${formatCLP(liq.bonoAsistencia)}</td>
          <td class="text-right text-green">${formatCLP(liq.bonoProduccion)}</td>
          <td class="text-right">${formatCLP(liq.asigColacion + liq.asigMovilizacion)}</td>
          <td class="text-right text-red">${formatCLP(liq.anticipoQuincenal)}</td>
          <td class="text-right text-red">${formatCLP(liq.adelantoSolicitado + liq.descuentosVarios)}</td>
          <td class="text-right text-blue font-title"><strong>${formatCLP(liq.sueldoLiquido)}</strong></td>
          <td>
            <button class="btn btn-primary" onclick="openSlipModal(${liq.trabajadorId})" style="padding: 6px 12px; font-size: 0.7rem;">
              <span class="material-symbols-outlined" style="font-size: 0.95rem;">receipt</span>
            </button>
          </td>
        `;
        tbodyLiq.appendChild(tr);
      });

      // SUBTAB 3: Control de Anticipos y Adelantos Form
      // Populate worker select in advances
      const antSelect = document.getElementById('ant-trabajador');
      
      // Save cursor selection if any
      const selectedVal = antSelect.value;
      
      antSelect.innerHTML = '<option value="" disabled selected>Seleccione trabajador...</option>';
      trabData.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.innerText = w.nombre;
        antSelect.appendChild(opt);
      });

      if (selectedVal) {
        antSelect.value = selectedVal;
      }

      // Financial summaries block in subtab 3
      let totalLiquido = liqData.reduce((sum, l) => sum + l.sueldoLiquido, 0);
      let totalAnticipo = liqData.reduce((sum, l) => sum + l.anticipoQuincenal, 0);
      let totalAdelanto = liqData.reduce((sum, l) => sum + l.adelantoSolicitado, 0);
      let totalDescuentos = liqData.reduce((sum, l) => sum + l.descuentosVarios, 0);
      let totalDesembolso = totalLiquido + totalAnticipo + totalAdelanto + totalDescuentos;

      document.getElementById('sum-sueldos-liquidos').innerText = formatCLP(totalLiquido);
      document.getElementById('sum-anticipos').innerText = formatCLP(totalAnticipo);
      document.getElementById('sum-adelantos').innerText = formatCLP(totalAdelanto);
      document.getElementById('sum-descuentos').innerText = formatCLP(totalDescuentos);
      document.getElementById('sum-planilla-total').innerText = formatCLP(totalDesembolso);

    } catch (error) {
      console.error('Error loading finance data:', error);
    }
  }

  // Load selected values on advance worker change
  document.getElementById('ant-trabajador').addEventListener('change', (e) => {
    const workerId = parseInt(e.target.value);
    const liq = cache.liquidaciones.find(l => l.trabajadorId === workerId);
    
    if (liq) {
      document.getElementById('ant-quincena').value = liq.anticipoQuincenal;
      document.getElementById('ant-adelanto').value = liq.adelantoSolicitado;
      document.getElementById('ant-descuentos').value = liq.descuentosVarios;
    }
  });

  // Handle advance form submit
  document.getElementById('form-anticipo').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        trabajadorId: parseInt(document.getElementById('ant-trabajador').value),
        anticipoQuincenal: parseInt(document.getElementById('ant-quincena').value),
        adelantoSolicitado: parseInt(document.getElementById('ant-adelanto').value),
        descuentosVarios: parseInt(document.getElementById('ant-descuentos').value)
      };

      const response = await fetch('/api/liquidaciones/actualizar-descuentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        alert('Cálculo de remuneraciones actualizado con éxito. El sueldo líquido neto se ha reajustado.');
        loadFinanzasData();
      } else {
        alert('Error: ' + resData.message);
      }

    } catch (error) {
      console.error('Error updating advance values:', error);
      alert('Error de conexión al aplicar adelanto.');
    }
  });

  // ----------------------------------------------------
  // 📄 MODAL: DETALLE LIQUIDACIÓN CHILENA CONTROLLER
  // ----------------------------------------------------
  const modalLiquidacion = document.getElementById('modal-liquidacion-detalle');
  
  window.openSlipModal = async (workerId) => {
    try {
      // Find worker & liquidacion
      const liq = cache.liquidaciones.find(l => l.trabajadorId === workerId);
      const w = cache.trabajadores.find(t => t.id === workerId);
      
      const cuadRes = await fetch('/api/cuadrillas');
      const cuadData = await cuadRes.json();
      const c = cuadData.find(cuad => cuad.id === w.cuadrillaId);

      if (!liq || !w) return;

      // Populate text labels inside printing slip
      document.getElementById('slip-w-nombre').innerText = w.nombre;
      document.getElementById('slip-w-rut').innerText = w.rut;
      document.getElementById('slip-w-rol').innerText = w.rol;
      document.getElementById('slip-w-fundo').innerText = c ? c.fundo : 'Faenas JPD';
      document.getElementById('slip-w-dias').innerText = liq.diasTrabajados;
      document.getElementById('slip-w-cuadrilla').innerText = w.cuadrillaId;

      document.getElementById('slip-h-base').innerText = formatCLP(liq.sueldoBase);
      document.getElementById('slip-h-bono-asistencia').innerText = formatCLP(liq.bonoAsistencia);
      document.getElementById('slip-h-bono-produccion').innerText = formatCLP(liq.bonoProduccion);
      document.getElementById('slip-h-colacion').innerText = formatCLP(liq.asigColacion);
      document.getElementById('slip-h-movilizacion').innerText = formatCLP(liq.asigMovilizacion);
      document.getElementById('slip-h-total').innerText = formatCLP(liq.totalHaberes);

      document.getElementById('slip-d-quincena').innerText = `-$${formatNumber(liq.anticipoQuincenal)}`;
      document.getElementById('slip-d-adelantos').innerText = `-$${formatNumber(liq.adelantoSolicitado)}`;
      document.getElementById('slip-d-otros').innerText = `-$${formatNumber(liq.descuentosVarios)}`;
      document.getElementById('slip-d-total').innerText = `-$${formatNumber(liq.totalDescuentos)}`;

      document.getElementById('slip-liquido-total').innerText = formatCLP(liq.sueldoLiquido);
      document.getElementById('slip-banco-nombre').innerText = w.banco.toUpperCase();
      document.getElementById('slip-banco-cuenta').innerText = `${w.tipoCuenta} N° ${w.numeroCuenta}`;

      modalLiquidacion.classList.add('active');

    } catch (error) {
      console.error('Error drawing slip:', error);
    }
  };

  document.getElementById('btn-close-modal-liquidacion').addEventListener('click', () => {
    modalLiquidacion.classList.remove('active');
  });

  // ----------------------------------------------------
  // 🧮 HELPERS FOR FORMATTING
  // ----------------------------------------------------
  function formatCLP(number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(number);
  }

  function formatNumber(number) {
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(number);
  }

  function formatDateSimple(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  }

});
