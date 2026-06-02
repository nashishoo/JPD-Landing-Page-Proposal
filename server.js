const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static landing page files at root
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static admin panel files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// JSON Helper Functions
const getDataPath = (filename) => path.join(__dirname, 'data', 'mock', filename);

const readJSON = (filename) => {
  try {
    const dataPath = getDataPath(filename);
    if (!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeJSON = (filename, data) => {
  try {
    const dataPath = getDataPath(filename);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// ----------------------------------------------------
// 🔐 AUTHENTICATION ENDPOINT
// ----------------------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Accept standard or email-style admin credentials
  const isValidUsername = username === 'admin' || username === 'admin@jpdserviciosagricolas.cl';
  const isValidPassword = password === 'jpd2026';

  if (isValidUsername && isValidPassword) {
    return res.status(200).json({
      success: true,
      token: 'jpd_mock_token_2026_super_secure_secret',
      user: {
        username: 'admin',
        name: 'Jorge "Kitto" Pailamilla',
        role: 'Administrador General'
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Usuario o contraseña incorrectos.'
    });
  }
});

// ----------------------------------------------------
// 👥 TRABAJADORES ENDPOINTS (CRUD)
// ----------------------------------------------------
app.get('/api/trabajadores', (req, res) => {
  const trabajadores = readJSON('trabajadores.json');
  res.json(trabajadores);
});

app.post('/api/trabajadores', (req, res) => {
  const trabajadores = readJSON('trabajadores.json');
  const nuevoTrabajador = req.body;

  // Simple validation
  if (!nuevoTrabajador.nombre || !nuevoTrabajador.rut || !nuevoTrabajador.cuadrillaId) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
  }

  // Generate ID
  const nuevoId = trabajadores.reduce((max, t) => t.id > max ? t.id : max, 0) + 1;
  nuevoTrabajador.id = nuevoId;
  nuevoTrabajador.estado = nuevoTrabajador.estado || 'Activo';
  nuevoTrabajador.fechaIngreso = nuevoTrabajador.fechaIngreso || new Date().toISOString().split('T')[0];

  trabajadores.push(nuevoTrabajador);
  
  if (writeJSON('trabajadores.json', trabajadores)) {
    // Proactively generate liquidacion skeleton for the new worker
    const liquidaciones = readJSON('liquidaciones.json');
    liquidaciones.push({
      trabajadorId: nuevoId,
      nombre: nuevoTrabajador.nombre,
      rut: nuevoTrabajador.rut,
      rol: nuevoTrabajador.rol || 'Cosechador',
      cuadrillaId: parseInt(nuevoTrabajador.cuadrillaId),
      diasTrabajados: 0,
      diasAusente: 0,
      diasLicencia: 0,
      diasPermiso: 0,
      sueldoBase: 0,
      bonoAsistencia: 0,
      bonoProduccion: 0,
      asigMovilizacion: 0,
      asigColacion: 0,
      totalHaberes: 0,
      anticipoQuincenal: nuevoTrabajador.rol === 'Caporal' ? 200000 : 150000,
      adelantoSolicitado: 0,
      descuentosVarios: 0,
      totalDescuentos: nuevoTrabajador.rol === 'Caporal' ? 200000 : 150000,
      sueldoLiquido: -150000
    });
    writeJSON('liquidaciones.json', liquidaciones);

    res.status(201).json({ success: true, trabajador: nuevoTrabajador });
  } else {
    res.status(500).json({ success: false, message: 'Error escribiendo en base de datos.' });
  }
});

// ----------------------------------------------------
// 📋 CUADRILLAS ENDPOINTS
// ----------------------------------------------------
app.get('/api/cuadrillas', (req, res) => {
  const cuadrillas = readJSON('cuadrillas.json');
  res.json(cuadrillas);
});

// ----------------------------------------------------
// 📋 ASISTENCIA ENDPOINTS
// ----------------------------------------------------
app.get('/api/asistencia', (req, res) => {
  const { fecha, cuadrillaId } = req.query;
  let asistencia = readJSON('asistencia.json');

  if (fecha) {
    asistencia = asistencia.filter(a => a.fecha === fecha);
  }

  if (cuadrillaId) {
    const trabajadores = readJSON('trabajadores.json');
    const idsEnCuadrilla = trabajadores
      .filter(t => t.cuadrillaId === parseInt(cuadrillaId))
      .map(t => t.id);
    asistencia = asistencia.filter(a => idsEnCuadrilla.includes(a.trabajadorId));
  }

  res.json(asistencia);
});

app.post('/api/asistencia/guardar', (req, res) => {
  const registros = req.body; // Array of { trabajadorId, fecha, estado, horaIngreso, horaSalida, usoTransporte }
  
  if (!Array.isArray(registros) || registros.length === 0) {
    return res.status(400).json({ success: false, message: 'Datos de asistencia inválidos.' });
  }

  let asistencia = readJSON('asistencia.json');
  
  registros.forEach(nuevoReg => {
    // Parse numeric fields
    nuevoReg.trabajadorId = parseInt(nuevoReg.trabajadorId);
    
    // Find index of existing entry for same worker & date
    const index = asistencia.findIndex(a => a.trabajadorId === nuevoReg.trabajadorId && a.fecha === nuevoReg.fecha);
    
    if (index !== -1) {
      asistencia[index] = { ...asistencia[index], ...nuevoReg };
    } else {
      asistencia.push(nuevoReg);
    }
  });

  if (writeJSON('asistencia.json', asistencia)) {
    // Proactively recalculate liquidaciones for affected workers
    recalcularLiquidaciones();
    res.json({ success: true, message: 'Asistencia guardada y liquidaciones recalculadas con éxito.' });
  } else {
    res.status(500).json({ success: false, message: 'Error escribiendo en base de datos.' });
  }
});

// ----------------------------------------------------
// 📝 TARJAS (PRODUCCIÓN) ENDPOINTS
// ----------------------------------------------------
app.get('/api/tarjas', (req, res) => {
  const { fecha } = req.query;
  let tarjas = readJSON('tarjas.json');

  if (fecha) {
    tarjas = tarjas.filter(t => t.fecha === fecha);
  }

  res.json(tarjas);
});

app.post('/api/tarjas/guardar', (req, res) => {
  const registros = req.body; // Array of { trabajadorId, fecha, labor, tipoPago, cantidad, precioUnitario, totalGanado }
  
  if (!Array.isArray(registros) || registros.length === 0) {
    return res.status(400).json({ success: false, message: 'Datos de tarjas inválidos.' });
  }

  let tarjas = readJSON('tarjas.json');

  registros.forEach(nuevoReg => {
    nuevoReg.trabajadorId = parseInt(nuevoReg.trabajadorId);
    nuevoReg.cantidad = parseFloat(nuevoReg.cantidad);
    nuevoReg.precioUnitario = parseInt(nuevoReg.precioUnitario);
    nuevoReg.totalGanado = Math.round(nuevoReg.cantidad * nuevoReg.precioUnitario);

    const index = tarjas.findIndex(t => t.trabajadorId === nuevoReg.trabajadorId && t.fecha === nuevoReg.fecha);
    
    if (index !== -1) {
      tarjas[index] = nuevoReg;
    } else {
      tarjas.push(nuevoReg);
    }
  });

  if (writeJSON('tarjas.json', tarjas)) {
    recalcularLiquidaciones();
    res.json({ success: true, message: 'Tarjas guardadas y liquidaciones recalculadas con éxito.' });
  } else {
    res.status(500).json({ success: false, message: 'Error escribiendo en base de datos.' });
  }
});

// ----------------------------------------------------
// 💰 FINANZAS ENDPOINTS
// ----------------------------------------------------
app.get('/api/finanzas', (req, res) => {
  const finanzas = readJSON('finanzas.json');
  
  // Dynamically calculate actual totals from current workers / liquidations
  const liquidaciones = readJSON('liquidaciones.json');
  const clientes = readJSON('clientes.json');
  
  let totalCostosPlanilla = liquidaciones.reduce((sum, l) => sum + l.sueldoBase, 0);
  let totalHaberesCompleto = liquidaciones.reduce((sum, l) => sum + l.totalHaberes, 0);

  // Calculate dynamic exportadora billings using their markup relative to their crew's total base earnings
  let totalBilling = 0;
  clientes.forEach(cli => {
    // Find workers in this client's crews
    const cuadrillas = readJSON('cuadrillas.json').filter(c => c.clienteId === cli.id);
    const cuadrillaIds = cuadrillas.map(c => c.id);
    
    const baseGainedByCrews = liquidaciones
      .filter(l => cuadrillaIds.includes(l.cuadrillaId))
      .reduce((sum, l) => sum + l.sueldoBase, 0);
      
    // billing = base crew sueldo + JPD commission markup
    cli.totalFacturado = Math.round(baseGainedByCrews * (1 + cli.markup));
    totalBilling += cli.totalFacturado;
  });

  const gastos = finanzas.resumenMensual.mayo2026.gastosOperativos;
  const totalGastos = Object.values(gastos).reduce((sum, v) => sum + v, 0);
  const margenNeto = totalBilling - (totalHaberesCompleto + totalGastos);
  const porcentajeMargen = totalBilling > 0 ? ((margenNeto / totalBilling) * 100).toFixed(2) : 0;

  res.json({
    resumenMensual: {
      mayo2026: {
        ingresosFacturados: totalBilling,
        costosPlanilla: totalHaberesCompleto,
        gastosOperativos: gastos,
        totalGastosOperativos: totalGastos,
        margenNeto: margenNeto,
        porcentajeMargen: parseFloat(porcentajeMargen)
      }
    },
    movimientosRecientes: finanzas.movimientosRecientes,
    clientesFacturacion: clientes
  });
});

// ----------------------------------------------------
// 💵 LIQUIDACIONES & ANTICIPOS ENDPOINTS
// ----------------------------------------------------
app.get('/api/liquidaciones', (req, res) => {
  const liquidaciones = readJSON('liquidaciones.json');
  res.json(liquidaciones);
});

// Update specific advances, loans, or discounts for a worker
app.post('/api/liquidaciones/actualizar-descuentos', (req, res) => {
  const { trabajadorId, anticipoQuincenal, adelantoSolicitado, descuentosVarios } = req.body;
  
  if (!trabajadorId) {
    return res.status(400).json({ success: false, message: 'ID de trabajador requerido.' });
  }

  let liquidaciones = readJSON('liquidaciones.json');
  const index = liquidaciones.findIndex(l => l.trabajadorId === parseInt(trabajadorId));

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Liquidación no encontrada.' });
  }

  const liq = liquidaciones[index];
  
  // Overwrite variables if provided
  if (anticipoQuincenal !== undefined) liq.anticipoQuincenal = parseInt(anticipoQuincenal);
  if (adelantoSolicitado !== undefined) liq.adelantoSolicitado = parseInt(adelantoSolicitado);
  if (descuentosVarios !== undefined) liq.descuentosVarios = parseInt(descuentosVarios);

  // Recalculate totals
  liq.totalDescuentos = liq.anticipoQuincenal + liq.adelantoSolicitado + liq.descuentosVarios;
  liq.sueldoLiquido = liq.totalHaberes - liq.totalDescuentos;

  // Add a record to recent financial transactions if adelanto or extra discount was modified
  if (adelantoSolicitado > 0 || descuentosVarios > 0) {
    let finanzas = readJSON('finanzas.json');
    finanzas.movimientosRecientes.unshift({
      id: finanzas.movimientosRecientes.length + 1,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Egreso',
      descripcion: `Adelanto/Descuento Ajustado - ${liq.nombre}`,
      monto: parseInt(adelantoSolicitado || 0) + parseInt(descuentosVarios || 0),
      categoria: 'Adelanto'
    });
    writeJSON('finanzas.json', finanzas);
  }

  if (writeJSON('liquidaciones.json', liquidaciones)) {
    res.json({ success: true, liquidacion: liq });
  } else {
    res.status(500).json({ success: false, message: 'Error actualizando liquidación.' });
  }
});

// ----------------------------------------------------
// 🛠️ RECALCULATE LIQUIDATIONS UTILITY
// ----------------------------------------------------
function recalcularLiquidaciones() {
  const trabajadores = readJSON('trabajadores.json');
  const cuadrillas = readJSON('cuadrillas.json');
  const asistencia = readJSON('asistencia.json');
  const tarjas = readJSON('tarjas.json');
  const liquidaciones = readJSON('liquidaciones.json');

  const nuevasLiquidaciones = trabajadores.map(t => {
    const c = cuadrillas.find(cuad => cuad.id === t.cuadrillaId);
    
    // Find worker records
    const tAsistencia = asistencia.filter(a => a.trabajadorId === t.id);
    const tTarjas = tarjas.filter(a => a.trabajadorId === t.id);

    // Counts
    const countPresent = tAsistencia.filter(a => a.estado === 'Presente').length;
    const countAusente = tAsistencia.filter(a => a.estado === 'Ausente').length;
    const countLicencia = tAsistencia.filter(a => a.estado === 'Licencia').length;
    const countPermiso = tAsistencia.filter(a => a.estado === 'Permiso').length;

    // Totals
    const sueldoBase = tTarjas.reduce((sum, tar) => sum + tar.totalGanado, 0);
    const totalUnidades = tTarjas.reduce((sum, tar) => sum + tar.cantidad, 0);
    const totalTransporteNoUsado = tAsistencia.filter(a => a.estado === 'Presente' && !a.usoTransporte).length;

    // Bonuses and allowances
    const bonoAsistencia = countAusente === 0 && countPresent > 0 ? 40000 : 0;
    
    let bonoProduccion = 0;
    if (t.rol !== 'Caporal' && c.tipoPago === 'Trato') {
      const limit = c.id === 1 ? 1600 : 1100;
      if (totalUnidades > limit) {
        bonoProduccion = 30000;
      }
    }

    const asigMovilizacion = totalTransporteNoUsado * 2500;
    const asigColacion = countPresent * 3000;

    const totalHaberes = sueldoBase + bonoAsistencia + bonoProduccion + asigMovilizacion + asigColacion;

    // Preserve existing discounts/advances if they existed
    const liqExistente = liquidaciones.find(l => l.trabajadorId === t.id);
    const anticipoQuincenal = liqExistente ? liqExistente.anticipoQuincenal : (t.rol === 'Caporal' ? 200000 : 150000);
    const adelantoSolicitado = liqExistente ? liqExistente.adelantoSolicitado : 0;
    const descuentosVarios = liqExistente ? liqExistente.descuentosVarios : 0;

    const totalDescuentos = anticipoQuincenal + adelantoSolicitado + descuentosVarios;
    const sueldoLiquido = totalHaberes - totalDescuentos;

    return {
      trabajadorId: t.id,
      nombre: t.nombre,
      rut: t.rut,
      rol: t.rol,
      cuadrillaId: t.cuadrillaId,
      diasTrabajados: countPresent,
      diasAusente: countAusente,
      diasLicencia: countLicencia,
      diasPermiso: countPermiso,
      sueldoBase,
      bonoAsistencia,
      bonoProduccion,
      asigMovilizacion,
      asigColacion,
      totalHaberes,
      anticipoQuincenal,
      adelantoSolicitado,
      descuentosVarios,
      totalDescuentos,
      sueldoLiquido
    };
  });

  writeJSON('liquidaciones.json', nuevasLiquidaciones);
}

// ----------------------------------------------------
// 🚀 SERVER INIT
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚜 JPD Servicios Agrícolas - Servidor Iniciado`);
  console.log(`📡 Escuchando en: http://localhost:${PORT}`);
  console.log(`🔐 Acceso Admin Mockup: admin / jpd2026`);
  console.log(`====================================================`);
});
