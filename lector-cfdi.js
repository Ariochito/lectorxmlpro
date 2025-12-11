// =====================
//  Diccionarios (punto 5)
// =====================

// Del xmlProcessor.js
const FORMAS_DE_PAGO = {
  '01': '01 - Efectivo',
  '02': '02 - Cheque nominativo',
  '03': '03 - Transferencia electrónica de fondos',
  '04': '04 - Tarjeta de crédito',
  '05': '05 - Monedero electrónico',
  '06': '06 - Dinero electrónico',
  '08': '08 - Vales de despensa',
  '12': '12 - Dación en pago',
  '13': '13 - Pago por subrogación',
  '14': '14 - Pago por consignación',
  '15': '15 - Condonación',
  '17': '17 - Compensación',
  '23': '23 - Novación',
  '24': '24 - Confusión',
  '25': '25 - Remisión de deuda',
  '26': '26 - Prescripción o caducidad',
  '27': '27 - A satisfacción del acreedor',
  '28': '28 - Tarjeta de débito',
  '29': '29 - Tarjeta de servicios',
  '30': '30 - Aplicación de anticipos',
  '31': '31 - Intermediario pagos',
  '99': '99 - Por definir',
  'Transferencia': '03 - Transferencia electrónica de fondos',
  'Pago en una sola exhibición': 'PUE-Pago en una sola exhibición',
  'Pago en parcialidades o diferido': 'PPD-Pago en parcialidades o diferido'
};

const TIPOS_DE_COMPROBANTE = {
  'I': 'Factura',
  'E': 'Nota de crédito',
  'T': 'Traslado',
  'N': 'Nómina',
  'P': 'Pago',
  'ingreso': 'Factura'
};

const METODOS_DE_PAGO = {
  'PUE': 'PUE-Pago en una sola exhibición',
  'PPD': 'PPD-Pago en parcialidades o diferido',
  'Pago en una sola exhibición': 'PUE-Pago en una sola exhibición',
  'Pago en parcialidades o diferido': 'PPD-Pago en parcialidades o diferido',
  'Transferencia': '03 - Transferencia electrónica de fondos'
};

const USO_CFDI = {
  'G01': 'Adquisición de mercancías.',
  'G02': 'Devoluciones, descuentos o bonificaciones.',
  'G03': 'Gastos en general.',
  'I01': 'Construcciones.',
  'I02': 'Mobiliario y equipo de oficina por inversiones.',
  'I03': 'Equipo de transporte.',
  'I04': 'Equipo de computo y accesorios.',
  'I05': 'Dados, troqueles, moldes, matrices y herramental.',
  'I06': 'Comunicaciones telefónicas.',
  'I07': 'Comunicaciones satelitales.',
  'I08': 'Otra maquinaria y equipo.',
  'D01': 'Honorarios médicos, dentales y gastos hospitalarios.',
  'D02': 'Gastos médicos por incapacidad o discapacidad.',
  'D03': 'Gastos funerales.',
  'D04': 'Donativos.',
  'D05': 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).',
  'D06': 'Aportaciones voluntarias al SAR.',
  'D07': 'Primas por seguros de gastos médicos.',
  'D08': 'Gastos de transportación escolar obligatoria.',
  'D09': 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',
  'D10': 'Pagos por servicios educativos (colegiaturas).',
  'S01': 'Sin efectos fiscales.',
  'CP01': 'Pagos',
  'CN01': 'Nómina'
};

// Namespaces y helpers para retenciones (punto 2)
const CFDI_NAMESPACES = [
  'http://www.sat.gob.mx/cfd/3',
  'http://www.sat.gob.mx/cfd/4',
  'http://www.sat.gob.mx/cfd/3.3',
  'http://www.sat.gob.mx/cfd/3.2',
  'http://www.sat.gob.mx/TimbreFiscalDigital'
];

function getElementsByTagNameInNamespaces(xmlDoc, tagName) {
  for (const ns of CFDI_NAMESPACES) {
    const nodes = xmlDoc.getElementsByTagNameNS(ns, tagName);
    if (nodes.length > 0) return nodes;
  }
  return [];
}

function getElementByTagNameInNamespaces(xmlDoc, tagName) {
  for (const ns of CFDI_NAMESPACES) {
    const node = xmlDoc.getElementsByTagNameNS(ns, tagName)[0];
    if (node) return node;
  }
  return null;
}

function getAttributeValue(node, possibleAttributes) {
  for (const attr of possibleAttributes) {
    if (node.hasAttribute(attr)) {
      return node.getAttribute(attr);
    }
  }
  return null;
}

// Retenciones numéricas (mismo criterio que xmlProcessor pero SIN formatoMoneda)
function extraerRetencionesNumerico(xmlDoc) {
  const retencionesNode = getElementByTagNameInNamespaces(xmlDoc, 'Retenciones');

  if (!retencionesNode) {
    return {
      retencionIVA: 0,
      retencionISR: 0
    };
  }

  let retencionIVA = 0.0;
  let retencionISR = 0.0;

  const retenciones = retencionesNode.getElementsByTagNameNS(
    retencionesNode.namespaceURI,
    'Retencion'
  );

  for (let retencion of retenciones) {
    const tipoImpuesto = getAttributeValue(retencion, ['Impuesto', 'impuesto']);
    const importe = parseFloat(getAttributeValue(retencion, ['Importe', 'importe'])) || 0;

    if (tipoImpuesto === '002' || tipoImpuesto === 'IVA') {
      retencionIVA += importe;
    } else if (tipoImpuesto === '001' || tipoImpuesto === 'ISR') {
      retencionISR += importe;
    }
  }

  return { retencionIVA, retencionISR };
}

// Formato de fecha dd/mm/aaaa (punto 4)
function formatFechaISOToDMY(iso) {
  if (!iso) return '';
  const soloFecha = iso.split('T')[0];
  const parts = soloFecha.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // último recurso: que el Date haga lo que pueda
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// =====================
//  Estructuras globales
// =====================

const cfdis = [];        // 1 objeto por XML
const conceptos = [];    // 1 objeto por concepto
const pagosResumen = []; // complementos de pago – resumen
const pagosDetalle = []; // complementos de pago – detalle

let rfcBaseDetectado = '';
let filtroUuidFacturaDetalle = null; // UUID de factura para filtrar tabla de detalle de pagos


// Configuración de columnas CFDI (ajustada para descripciones y base exenta)
const cfdiColumns = [
  { key: 'rol', label: 'Rol', visible: true },
  { key: 'version', label: 'Versión', visible: true },
  { key: 'serie', label: 'Serie', visible: true },
  { key: 'folio', label: 'Folio', visible: true },
  { key: 'tipoDesc', label: 'Tipo', visible: true },
  { key: 'tipo', label: 'Tipo código', visible: false },
  { key: 'fecha', label: 'Fecha Emisión', visible: true },
  { key: 'emisorRfc', label: 'RFC Emisor', visible: true },
  { key: 'emisorNombre', label: 'Nombre Emisor', visible: true },
  { key: 'receptorRfc', label: 'RFC Receptor', visible: true },
  { key: 'receptorNombre', label: 'Nombre Receptor', visible: true },
  { key: 'usoCfdi', label: 'Uso CFDI (código)', visible: false },
  { key: 'usoCfdiDesc', label: 'Uso CFDI', visible: true },
  { key: 'cpReceptor', label: 'CP Receptor', visible: true },
  { key: 'regimenFiscalReceptor', label: 'Régimen Receptor', visible: true },
  { key: 'subTotal', label: 'SubTotal', visible: true },
  { key: 'descuento', label: 'Descuento', visible: true },
  { key: 'iva16', label: 'IVA 16%', visible: true },
  { key: 'iva8', label: 'IVA 8%', visible: true },
  { key: 'iva0', label: 'IVA 0%', visible: false },
  { key: 'ieps', label: 'IEPS', visible: false },
  { key: 'baseExenta', label: 'Base Exenta', visible: false },
  { key: 'retencionIsr', label: 'Retención ISR', visible: true },
  { key: 'retencionIva', label: 'Retención IVA', visible: true },
  { key: 'total', label: 'Total', visible: true },
  { key: 'totalImpuestosTrasladados', label: 'Total Trasladados', visible: false },
  { key: 'moneda', label: 'Moneda', visible: true },
  { key: 'formaPago', label: 'Forma pago cód', visible: false },
  { key: 'formaPagoDesc', label: 'Forma de Pago', visible: true },
  { key: 'metodoPago', label: 'Método pago cód', visible: false },
  { key: 'metodoPagoDesc', label: 'Método de Pago', visible: true },
  { key: 'lugarExpedicion', label: 'Lugar Expedición', visible: true },
  { key: 'uuid', label: 'UUID', visible: true },
  { key: 'descripcionesConceptos', label: 'Descripción Conceptos', visible: false },
  { key: 'baseIva16', label: 'Base IVA 16%', visible: false },
  { key: 'baseIva8', label: 'Base IVA 8%', visible: false },
  { key: 'baseIva0', label: 'Base IVA 0%', visible: false },
  { key: 'baseIeps', label: 'Base IEPS', visible: false }
];

const numericFields = new Set([
  'subTotal', 'descuento', 'iva16', 'iva8', 'iva0', 'ieps',
  'retencionIsr', 'retencionIva', 'total', 'totalImpuestosTrasladados',
  'baseIva16', 'baseIva8', 'baseIva0', 'baseIeps', 'baseExenta'
]);

// =====================
//  DOM READY
// =====================

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const folderInput = document.getElementById('folderInput');
  const btnSelectFiles = document.getElementById('btnSelectFiles');
  const btnSelectFolder = document.getElementById('btnSelectFolder');
  const dropArea = document.getElementById('dropArea');
  const btnLimpiarFiltroPagosDetalle = document.getElementById('btnLimpiarFiltroPagosDetalle');
  if (btnLimpiarFiltroPagosDetalle) {
    btnLimpiarFiltroPagosDetalle.addEventListener('click', () => {
      filtroUuidFacturaDetalle = null;
      renderTablaPagosDetalle();
    });
  }


  btnSelectFiles.addEventListener('click', () => fileInput.click());
  btnSelectFolder.addEventListener('click', () => folderInput.click());

  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
  folderInput.addEventListener('change', (e) => handleFiles(e.target.files));

  // Drag & drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.style.background = '#e0ecff';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.style.background = '';
    });
  });

  dropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  // Filtros
  ['filtroRol', 'filtroVista', 'filtroPeriodo'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      renderTablaCfdi();
      renderTablaConceptos();
      renderTablaPagosResumen();
      renderTablaPagosDetalle();
      renderTablaPpd();
      renderTablaPagosSinCfdi();
    });
  });

  ['filtroNombre', 'filtroRfc'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      renderTablaCfdi();
      renderTablaConceptos();
      renderTablaPagosResumen();
      renderTablaPagosDetalle();
      renderTablaPpd();
      renderTablaPagosSinCfdi();
    });
  });

  ['fechaDesde', 'fechaHasta'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      renderTablaCfdi();
      renderTablaConceptos();
      renderTablaPagosResumen();
      renderTablaPagosDetalle();
      renderTablaPpd();
      renderTablaPagosSinCfdi();
    });
  });

  // RFC base manual
  const rfcBaseInput = document.getElementById('rfcBase');
  rfcBaseInput.addEventListener('change', () => {
    rfcBaseDetectado = (rfcBaseInput.value || '').trim().toUpperCase();
    asignarRoles();
    sincronizarRolEnConceptos();
    sincronizarRolEnPagos();
    calcularYMostrarEstadisticas();
    renderTablaCfdi();
    renderTablaConceptos();
    renderTablaPagosResumen();
    renderTablaPagosDetalle();
    renderTablaPpd();
    renderTablaPagosSinCfdi();
  });

  // Exportar tablas (punto 1 – con BOM para ñ, tildes, comas)
  document.getElementById('btnExportCfdi').addEventListener('click', () => {
    exportTableToCSV('tablaCfdi', 'cfdi_resumen.csv');
  });
  document.getElementById('btnExportConceptos').addEventListener('click', () => {
    exportTableToCSV('tablaConceptos', 'cfdi_conceptos.csv');
  });
  document.getElementById('btnExportPagosResumen').addEventListener('click', () => {
    exportTableToCSV('tablaPagosResumen', 'cfdi_pagos_resumen.csv');
  });
  document.getElementById('btnExportPagosDetalle').addEventListener('click', () => {
    exportTableToCSV('tablaPagosDetalle', 'cfdi_pagos_detalle.csv');
  });
  document.getElementById('btnExportPpd').addEventListener('click', () => {
    exportTableToCSV('tablaPpd', 'cfdi_ppd_resumen.csv');
  });
  document.getElementById('btnExportPagosSinCfdi').addEventListener('click', () => {
    exportTableToCSV('tablaPagosSinCfdi', 'cfdi_pagos_sin_cfdi.csv');
  });
  // Panel de columnas
  initCfdiColumnConfigUI();
});

// =====================
//  Carga de archivos
// =====================

function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.xml'));
  if (!files.length) return;

  cfdis.length = 0;
  conceptos.length = 0;
  pagosResumen.length = 0;
  pagosDetalle.length = 0;

  const total = files.length;
  let procesados = 0;

  const progressContainer = document.getElementById('progressContainer');
  const progressLabel = document.getElementById('progressLabel');
  const progressFill = document.getElementById('progressFill');

  progressContainer.style.display = 'block';
  progressLabel.textContent = `Procesando 0 de ${total} XML...`;
  progressFill.style.width = '0%';

  const readers = [];

  files.forEach(file => {
    const reader = new FileReader();
    readers.push(new Promise((resolve) => {
      reader.onload = () => {
        try {
          parseXmlFile(reader.result, file.name);
        } catch (err) {
          console.error('Error parseando', file.name, err);
        }
        procesados++;
        const pct = total ? (procesados / total) * 100 : 0;
        progressLabel.textContent = `Procesando ${procesados} de ${total} XML...`;
        progressFill.style.width = `${pct}%`;
        resolve();
      };
    }));
    reader.readAsText(file, 'UTF-8');
  });

  Promise.all(readers).then(() => {
    detectarRfcBaseAutomatico();
    asignarRoles();
    sincronizarRolEnConceptos();
    sincronizarRolEnPagos();
    calcularYMostrarEstadisticas();
    actualizarOpcionesPeriodo();
    renderTablaCfdi();
    renderTablaConceptos();
    renderTablaPagosResumen();
    renderTablaPagosDetalle();
    renderTablaPpd();
    renderTablaPagosSinCfdi();
    progressLabel.textContent = `Listo: ${total} XML procesados.`;
    setTimeout(() => {
      progressContainer.style.display = 'none';
    }, 800);
  });
}

// =====================
//  Parseo de XML
// =====================

function parseXmlFile(xmlText, fileName) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const comprobante = xmlDoc.querySelector('cfdi\\:Comprobante, Comprobante');
  if (!comprobante) {
    console.warn('No se encontró nodo cfdi:Comprobante en', fileName);
    return;
  }

  const emisor = xmlDoc.querySelector('cfdi\\:Emisor, Emisor');
  const receptor = xmlDoc.querySelector('cfdi\\:Receptor, Receptor');
  const timbre = xmlDoc.querySelector('tfd\\:TimbreFiscalDigital, TimbreFiscalDigital');

  const version = comprobante.getAttribute('Version') || comprobante.getAttribute('version') || '';

  const tipoCod = (comprobante.getAttribute('TipoDeComprobante') || '').toUpperCase();
  const tipoDesc = TIPOS_DE_COMPROBANTE[tipoCod] || tipoCod;

  const fechaAttr = comprobante.getAttribute('Fecha') || '';
  const fechaRaw = fechaAttr;
  const fecha = formatFechaISOToDMY(fechaAttr);

  const moneda = comprobante.getAttribute('Moneda') || '';
  const subTotal = comprobante.getAttribute('SubTotal') || '';
  const descuento = comprobante.getAttribute('Descuento') || '0';
  const total = comprobante.getAttribute('Total') || '';
  const serie = comprobante.getAttribute('Serie') || '';
  const folio = comprobante.getAttribute('Folio') || '';

  const metodoPagoCod = comprobante.getAttribute('MetodoPago') || '';
  const metodoPagoDesc = METODOS_DE_PAGO[metodoPagoCod] || metodoPagoCod;

  const formaPagoCod = comprobante.getAttribute('FormaPago') || '';
  const formaPagoDesc = FORMAS_DE_PAGO[formaPagoCod] || formaPagoCod;

  const lugarExpedicion = comprobante.getAttribute('LugarExpedicion') || '';

  const emisorRfc = emisor ? ((emisor.getAttribute('Rfc') || emisor.getAttribute('RfcEmisor') || '').toUpperCase()) : '';
  const emisorNombre = emisor ? (emisor.getAttribute('Nombre') || '') : '';

  const receptorRfc = receptor ? ((receptor.getAttribute('Rfc') || '').toUpperCase()) : '';
  const receptorNombre = receptor ? (receptor.getAttribute('Nombre') || '') : '';
  const usoCfdiCod = receptor ? (receptor.getAttribute('UsoCFDI') || '') : '';
  const usoCfdiDesc = usoCfdiCod ? (USO_CFDI[usoCfdiCod] || usoCfdiCod) : '';
  const cpReceptor = receptor ? (receptor.getAttribute('DomicilioFiscalReceptor') || '') : '';
  const regimenFiscalReceptor = receptor ? (receptor.getAttribute('RegimenFiscalReceptor') || '') : '';

  const uuid = timbre ? (timbre.getAttribute('UUID') || '') : '';

  let ivaTrasladado = 0;
  let iva16 = 0, iva8 = 0, iva0 = 0, ieps = 0;
  let baseIva16 = 0, baseIva8 = 0, baseIva0 = 0, baseIeps = 0;
  let baseExenta = 0; // punto 3

  const descripcionesConceptos = [];

  // Conceptos
  const conceptosNodes = xmlDoc.querySelectorAll('cfdi\\:Concepto, Concepto');
  conceptosNodes.forEach(concNode => {
    const claveProdServ = concNode.getAttribute('ClaveProdServ') || '';
    const noIdentificacion = concNode.getAttribute('NoIdentificacion') || '';
    const cantidad = parseFloat(concNode.getAttribute('Cantidad') || '0') || 0;
    const claveUnidad = concNode.getAttribute('ClaveUnidad') || '';
    const unidad = concNode.getAttribute('Unidad') || '';
    const descripcion = concNode.getAttribute('Descripcion') || '';
    const valorUnitario = parseFloat(concNode.getAttribute('ValorUnitario') || '0') || 0;
    const importe = parseFloat(concNode.getAttribute('Importe') || '0') || 0;
    const descConcepto = parseFloat(concNode.getAttribute('Descuento') || '0') || 0;

    descripcionesConceptos.push(descripcion);

    let ivaTrasConcepto = 0;
    let ivaRetConcepto = 0;
    let isrRetConcepto = 0;

    const impuestosNode = concNode.querySelector('cfdi\\:Impuestos, Impuestos');
    if (impuestosNode) {
      const traslados = impuestosNode.querySelectorAll('cfdi\\:Traslado, Traslado');
      traslados.forEach(t => {
        const impuesto = (t.getAttribute('Impuesto') || '').trim();
        const tasaStr = (t.getAttribute('TasaOCuota') || '').trim();
        const tipoFactor = (t.getAttribute('TipoFactor') || '').trim();
        const base = parseFloat(t.getAttribute('Base') || '0') || 0;
        const importeImp = parseFloat(t.getAttribute('Importe') || '0') || 0;

        if (impuesto === '002' || impuesto === 'IVA') { // IVA
          // Base exenta
          if (tipoFactor === 'Exento') {
            baseExenta += base;
          } else {
            ivaTrasConcepto += importeImp;
            ivaTrasladado += importeImp;

            let tasa = tasaStr ? parseFloat(tasaStr) : 0;
            if (tasa <= 1) tasa = tasa * 100; // por si viene 0.16

            if (tasa === 16) {
              iva16 += importeImp;
              baseIva16 += base;
            } else if (tasa === 8) {
              iva8 += importeImp;
              baseIva8 += base;
            } else if (tasa === 0) {
              iva0 += importeImp;
              baseIva0 += base;
            }
          }
        } else if (impuesto === '003' || impuesto === 'IEPS') {
          ieps += importeImp;
          baseIeps += base;
        }
      });

      const retenciones = impuestosNode.querySelectorAll('cfdi\\:Retencion, Retencion');
      retenciones.forEach(r => {
        const impuesto = (r.getAttribute('Impuesto') || '').trim();
        const importeImp = parseFloat(r.getAttribute('Importe') || '0') || 0;

        if (impuesto === '001' || impuesto === 'ISR') {
          isrRetConcepto += importeImp;
        } else if (impuesto === '002' || impuesto === 'IVA') {
          ivaRetConcepto += importeImp;
        }
      });
    }

    conceptos.push({
      uuid,
      serie,
      folio,
      tipo: tipoCod,
      fecha,
      fechaRaw,
      rol: 'OTRO',
      emisorRfc,
      emisorNombre,
      receptorRfc,
      receptorNombre,
      claveProdServ,
      noIdentificacion,
      cantidad,
      claveUnidad,
      unidad,
      descripcion,
      valorUnitario,
      importe,
      descuento: descConcepto,
      ivaTrasladado: ivaTrasConcepto,
      ivaRetenido: ivaRetConcepto,
      isrRetenido: isrRetConcepto
    });
  });

  const totalImpuestosTrasladados = ivaTrasladado + ieps;

  // Retenciones totales del CFDI – usando la lógica de xmlProcessor (ya probada)
  const { retencionIVA, retencionISR } = extraerRetencionesNumerico(xmlDoc);

  // Guardar CFDI
  cfdis.push({
    fileName,
    uuid,
    version,
    tipo: tipoCod,
    tipoDesc,
    fecha,
    fechaRaw,
    moneda,
    subTotal: parseFloat(subTotal || '0') || 0,
    descuento: parseFloat(descuento || '0') || 0,
    total: parseFloat(total || '0') || 0,
    serie,
    folio,
    metodoPago: metodoPagoCod,
    metodoPagoDesc,
    formaPago: formaPagoCod,
    formaPagoDesc,
    lugarExpedicion,
    emisorRfc,
    emisorNombre,
    receptorRfc,
    receptorNombre,
    usoCfdi: usoCfdiCod,
    usoCfdiDesc,
    cpReceptor,
    regimenFiscalReceptor,
    ivaTrasladado,
    // Retenciones (los nombres que usan las columnas)
    retencionIva: retencionIVA,
    retencionIsr: retencionISR,
    // También dejamos los nombres “viejos” por si los quieres usar después
    ivaRetenido: retencionIVA,
    isrRetenido: retencionISR,
    iva16,
    iva8,
    iva0,
    ieps,
    totalImpuestosTrasladados,
    baseIva16,
    baseIva8,
    baseIva0,
    baseIeps,
    baseExenta,
    descripcionesConceptos: descripcionesConceptos.join(' | '),
    rol: 'OTRO'
  });

  // Complementos de pago
  if (tipoCod === 'P') {
    parseComplementoPagos(xmlDoc, {
      uuid,
      fecha,
      fechaRaw,
      emisorRfc,
      emisorNombre,
      receptorRfc,
      receptorNombre
    });
  }
}

// =====================
//  Complementos de pago
// =====================

function parseComplementoPagos(xmlDoc, base) {
  const pagosNamespaces = [
    'http://www.sat.gob.mx/Pagos',
    'http://www.sat.gob.mx/Pagos10',
    'http://www.sat.gob.mx/Pagos20'
  ];

  const pagosNodes = [];
  pagosNamespaces.forEach(ns => {
    const nodes = xmlDoc.getElementsByTagNameNS(ns, 'Pagos');
    for (let i = 0; i < nodes.length; i++) {
      pagosNodes.push(nodes[i]);
    }
  });

  if (!pagosNodes.length) {
    const generic = xmlDoc.getElementsByTagName('Pagos');
    for (let i = 0; i < generic.length; i++) pagosNodes.push(generic[i]);
  }

  pagosNodes.forEach(pagosNode => {
    const ns = pagosNode.namespaceURI;
    const pagos = pagosNode.getElementsByTagNameNS(ns, 'Pago');

    for (let i = 0; i < pagos.length; i++) {
      const pagoNode = pagos[i];
      const fechaPagoRaw = pagoNode.getAttribute('FechaPago') || '';
      const fechaPago = formatFechaISOToDMY(fechaPagoRaw);

      const formaPagoP = pagoNode.getAttribute('FormaDePagoP') || '';
      const monedaP = pagoNode.getAttribute('MonedaP') || '';
      const montoPago = parseFloat(pagoNode.getAttribute('Monto') || '0') || 0;

      const doctos = pagoNode.getElementsByTagNameNS(ns, 'DoctoRelacionado');

      const uuidsRelacionados = [];
      let totalSaldoAnt = 0;
      let totalPagado = 0;
      let totalSaldoInsoluto = 0;

      for (let j = 0; j < doctos.length; j++) {
        const d = doctos[j];
        const idDocumento = d.getAttribute('IdDocumento') || '';
        const serieDr = d.getAttribute('Serie') || '';
        const folioDr = d.getAttribute('Folio') || '';
        const monedaDr = d.getAttribute('MonedaDR') || '';
        const metodoPagoDr = d.getAttribute('MetodoDePagoDR') || '';
        const numParcialidad = d.getAttribute('NumParcialidad') || '';

        const impSaldoAnt = parseFloat(d.getAttribute('ImpSaldoAnt') || '0') || 0;
        const impPagado = parseFloat(d.getAttribute('ImpPagado') || '0') || 0;
        const impSaldoInsoluto = parseFloat(d.getAttribute('ImpSaldoInsoluto') || '0') || 0;

        uuidsRelacionados.push(idDocumento);
        totalSaldoAnt += impSaldoAnt;
        totalPagado += impPagado;
        totalSaldoInsoluto += impSaldoInsoluto;

        pagosDetalle.push({
          uuidPago: base.uuid,
          fechaEmision: base.fecha,
          fechaEmisionRaw: base.fechaRaw,
          fechaPago,
          fechaPagoRaw,
          emisorRfc: base.emisorRfc,
          emisorNombre: base.emisorNombre,
          receptorRfc: base.receptorRfc,
          receptorNombre: base.receptorNombre,
          rol: 'OTRO',
          idDocumento,
          serieDr,
          folioDr,
          monedaDr,
          metodoPagoDr,
          numParcialidad,
          impSaldoAnt,
          impPagado,
          impSaldoInsoluto,
          montoPago,
          monedaP,
          formaPagoP
        });
      }

      pagosResumen.push({
        uuidPago: base.uuid,
        fechaEmision: base.fecha,
        fechaEmisionRaw: base.fechaRaw,
        fechaPago,
        fechaPagoRaw,
        emisorRfc: base.emisorRfc,
        emisorNombre: base.emisorNombre,
        receptorRfc: base.receptorRfc,
        receptorNombre: base.receptorNombre,
        rol: 'OTRO',
        formaPagoP,
        monedaP,
        montoPago,
        numRelacionados: doctos.length,
        uuidsRelacionados: uuidsRelacionados.join(' | '),
        totalSaldoAnt,
        totalPagado,
        totalSaldoInsoluto
      });
    }
  });
}

// =====================
//  RFC base y roles
// =====================

function detectarRfcBaseAutomatico() {
  const rfcStats = new Map();

  cfdis.forEach(c => {
    if (c.emisorRfc) {
      if (!rfcStats.has(c.emisorRfc)) {
        rfcStats.set(c.emisorRfc, { asEmisor: 0, asReceptor: 0, total: 0 });
      }
      const st = rfcStats.get(c.emisorRfc);
      st.asEmisor += 1;
      st.total += 1;
    }
    if (c.receptorRfc) {
      if (!rfcStats.has(c.receptorRfc)) {
        rfcStats.set(c.receptorRfc, { asEmisor: 0, asReceptor: 0, total: 0 });
      }
      const st = rfcStats.get(c.receptorRfc);
      st.asReceptor += 1;
      st.total += 1;
    }
  });

  if (!rfcStats.size) return;

  const candidatos = [];
  const todos = [];

  for (const [rfc, st] of rfcStats.entries()) {
    todos.push({ rfc, ...st });
    if (st.asEmisor > 0 && st.asReceptor > 0) {
      candidatos.push({ rfc, ...st });
    }
  }

  let elegido = null;

  if (candidatos.length === 1) {
    elegido = candidatos[0];
  } else if (candidatos.length > 1) {
    candidatos.sort((a, b) => b.total - a.total);
    elegido = candidatos[0];
  } else {
    todos.sort((a, b) => b.total - a.total);
    elegido = todos[0];
  }

  if (elegido) {
    rfcBaseDetectado = elegido.rfc;
    const rfcBaseInput = document.getElementById('rfcBase');
    if (rfcBaseInput && !rfcBaseInput.value) {
      rfcBaseInput.value = rfcBaseDetectado;
    }
  }
}

function asignarRoles() {
  if (!rfcBaseDetectado) {
    const rfcBaseInput = document.getElementById('rfcBase');
    if (rfcBaseInput && rfcBaseInput.value) {
      rfcBaseDetectado = rfcBaseInput.value.trim().toUpperCase();
    }
  }

  cfdis.forEach(c => {
    let rol = 'OTRO';
    if (rfcBaseDetectado) {
      if (c.emisorRfc === rfcBaseDetectado) rol = 'EMITIDO';
      else if (c.receptorRfc === rfcBaseDetectado) rol = 'RECIBIDO';
    }
    c.rol = rol;
  });
}

function sincronizarRolEnConceptos() {
  const mapUuidRol = new Map();
  cfdis.forEach(c => {
    if (c.uuid) mapUuidRol.set(c.uuid, c.rol);
  });

  conceptos.forEach(conc => {
    if (conc.uuid && mapUuidRol.has(conc.uuid)) {
      conc.rol = mapUuidRol.get(conc.uuid);
    } else {
      conc.rol = 'OTRO';
    }
  });
}

function sincronizarRolEnPagos() {
  const mapUuidRol = new Map();
  cfdis.forEach(c => {
    if (c.tipo === 'P' && c.uuid) {
      mapUuidRol.set(c.uuid, c.rol);
    }
  });

  pagosResumen.forEach(p => {
    p.rol = mapUuidRol.get(p.uuidPago) || 'OTRO';
  });

  pagosDetalle.forEach(d => {
    d.rol = mapUuidRol.get(d.uuidPago) || 'OTRO';
  });
}

// =====================
//  Estadísticas y filtros
// =====================

function calcularYMostrarEstadisticas() {
  const stats = {
    EMITIDO: { total: 0, I: 0, E: 0, P: 0 },
    RECIBIDO: { total: 0, I: 0, E: 0, P: 0 },
    GLOBAL: { total: 0, I: 0, E: 0, P: 0 }
  };

  cfdis.forEach(c => {
    if (c.tipo === 'N') return;

    const tipo = c.tipo;
    const rol = c.rol;

    if (rol === 'EMITIDO' || rol === 'RECIBIDO') {
      stats[rol].total += 1;
      if (tipo === 'I') stats[rol].I += 1;
      else if (tipo === 'E') stats[rol].E += 1;
      else if (tipo === 'P') stats[rol].P += 1;

      stats.GLOBAL.total += 1;
      if (tipo === 'I') stats.GLOBAL.I += 1;
      else if (tipo === 'E') stats.GLOBAL.E += 1;
      else if (tipo === 'P') stats.GLOBAL.P += 1;
    }
  });

  document.getElementById('statsEmitidosTotal').textContent = stats.EMITIDO.total;
  document.getElementById('statsEmitidosI').textContent = stats.EMITIDO.I;
  document.getElementById('statsEmitidosE').textContent = stats.EMITIDO.E;
  document.getElementById('statsEmitidosP').textContent = stats.EMITIDO.P;

  document.getElementById('statsRecibidosTotal').textContent = stats.RECIBIDO.total;
  document.getElementById('statsRecibidosI').textContent = stats.RECIBIDO.I;
  document.getElementById('statsRecibidosE').textContent = stats.RECIBIDO.E;
  document.getElementById('statsRecibidosP').textContent = stats.RECIBIDO.P;

  document.getElementById('statsGlobalTotal').textContent = stats.GLOBAL.total;
  document.getElementById('statsGlobalI').textContent = stats.GLOBAL.I;
  document.getElementById('statsGlobalE').textContent = stats.GLOBAL.E;
  document.getElementById('statsGlobalP').textContent = stats.GLOBAL.P;
}

function actualizarOpcionesPeriodo() {
  const select = document.getElementById('filtroPeriodo');
  if (!select) return;

  const setYm = new Set();
  cfdis.forEach(c => {
    if (c.fechaRaw && c.fechaRaw.length >= 7) {
      const ym = c.fechaRaw.substring(0, 7);
      setYm.add(ym);
    }
  });

  const valores = Array.from(setYm).sort();
  select.innerHTML = '<option value="TODOS">Todos los periodos</option>';

  valores.forEach(ym => {
    const [y, m] = ym.split('-');
    const opt = document.createElement('option');
    opt.value = ym;
    opt.textContent = `${m}/${y}`;
    select.appendChild(opt);
  });
}

function getFiltros() {
  const rol = document.getElementById('filtroRol').value;
  const vista = document.getElementById('filtroVista').value;
  const periodo = document.getElementById('filtroPeriodo').value;

  const nombreVal = (document.getElementById('filtroNombre').value || '').trim().toUpperCase();
  const rfcVal = (document.getElementById('filtroRfc').value || '').trim().toUpperCase();

  const fechaDesdeVal = document.getElementById('fechaDesde').value;
  const fechaHastaVal = document.getElementById('fechaHasta').value;

  const fechaDesde = fechaDesdeVal ? new Date(fechaDesdeVal + 'T00:00:00') : null;
  const fechaHasta = fechaHastaVal ? new Date(fechaHastaVal + 'T23:59:59') : null;

  return { rol, vista, periodo, nombreVal, rfcVal, fechaDesde, fechaHasta };
}

// =====================
//  Render de tablas
// =====================

function renderTablaCfdi() {
  const thead = document.querySelector('#tablaCfdi thead');
  const tbody = document.querySelector('#tablaCfdi tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  const filtros = getFiltros();

  const trHead = document.createElement('tr');
  cfdiColumns.forEach(col => {
    if (col.key !== 'rol' && !col.visible) return;
    const th = document.createElement('th');
    th.textContent = col.label;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  cfdis.forEach(c => {
    if (c.tipo === 'N') return;

    if (filtros.rol !== 'TODOS' && c.rol !== filtros.rol) return;

    if (filtros.vista === 'IE' && !(c.tipo === 'I' || c.tipo === 'E')) return;
    if (filtros.vista === 'P' && c.tipo !== 'P') return;

    if (filtros.periodo !== 'TODOS' && c.fechaRaw && !c.fechaRaw.startsWith(filtros.periodo)) return;

    if (filtros.nombreVal) {
      const nomE = (c.emisorNombre || '').toUpperCase();
      const nomR = (c.receptorNombre || '').toUpperCase();
      if (!nomE.includes(filtros.nombreVal) && !nomR.includes(filtros.nombreVal)) return;
    }

    if (filtros.rfcVal) {
      const rfcE = (c.emisorRfc || '').toUpperCase();
      const rfcR = (c.receptorRfc || '').toUpperCase();
      if (!rfcE.includes(filtros.rfcVal) && !rfcR.includes(filtros.rfcVal)) return;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      const fechaCfdi = c.fechaRaw ? new Date(c.fechaRaw) : null;
      if (fechaCfdi && !isNaN(fechaCfdi)) {
        if (filtros.fechaDesde && fechaCfdi < filtros.fechaDesde) return;
        if (filtros.fechaHasta && fechaCfdi > filtros.fechaHasta) return;
      }
    }

    const tr = document.createElement('tr');

    cfdiColumns.forEach(col => {
      if (col.key !== 'rol' && !col.visible) return;

      const td = document.createElement('td');

      if (col.key === 'rol') {
        const rolBadge = document.createElement('span');
        rolBadge.textContent = c.rol;
        rolBadge.classList.add('badge');
        if (c.rol === 'EMITIDO') rolBadge.classList.add('badge-emitido');
        else if (c.rol === 'RECIBIDO') rolBadge.classList.add('badge-recibido');
        else rolBadge.classList.add('badge-otro');
        td.appendChild(rolBadge);
      } else {
        let value = c[col.key];
        if (value == null) value = '';

        if (numericFields.has(col.key)) {
          value = Number(value || 0).toFixed(2);
          td.style.textAlign = 'right';
        }

        td.textContent = value;
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function renderTablaConceptos() {
  const tbody = document.querySelector('#tablaConceptos tbody');
  tbody.innerHTML = '';

  const filtros = getFiltros();

  conceptos.forEach(conc => {
    if (conc.tipo === 'N') return;

    if (filtros.rol !== 'TODOS' && conc.rol !== filtros.rol) return;

    if (filtros.vista === 'IE' && !(conc.tipo === 'I' || conc.tipo === 'E')) return;
    if (filtros.vista === 'P' && conc.tipo !== 'P') return;

    if (filtros.periodo !== 'TODOS' && conc.fechaRaw && !conc.fechaRaw.startsWith(filtros.periodo)) return;

    if (filtros.nombreVal) {
      const nomE = (conc.emisorNombre || '').toUpperCase();
      const nomR = (conc.receptorNombre || '').toUpperCase();
      if (!nomE.includes(filtros.nombreVal) && !nomR.includes(filtros.nombreVal)) return;
    }

    if (filtros.rfcVal) {
      const rfcE = (conc.emisorRfc || '').toUpperCase();
      const rfcR = (conc.receptorRfc || '').toUpperCase();
      if (!rfcE.includes(filtros.rfcVal) && !rfcR.includes(filtros.rfcVal)) return;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      const fechaConc = conc.fechaRaw ? new Date(conc.fechaRaw) : null;
      if (fechaConc && !isNaN(fechaConc)) {
        if (filtros.fechaDesde && fechaConc < filtros.fechaDesde) return;
        if (filtros.fechaHasta && fechaConc > filtros.fechaHasta) return;
      }
    }

    const tr = document.createElement('tr');

    const rolBadge = document.createElement('span');
    rolBadge.textContent = conc.rol;
    rolBadge.classList.add('badge');
    if (conc.rol === 'EMITIDO') rolBadge.classList.add('badge-emitido');
    else if (conc.rol === 'RECIBIDO') rolBadge.classList.add('badge-recibido');
    else rolBadge.classList.add('badge-otro');

    tr.innerHTML = `
      <td></td>
      <td>${conc.uuid || ''}</td>
      <td>${conc.tipo || ''}</td>
      <td>${conc.fecha || ''}</td>
      <td>${conc.claveProdServ || ''}</td>
      <td>${conc.descripcion || ''}</td>
      <td style="text-align:right;">${conc.cantidad.toFixed(2)}</td>
      <td>${conc.claveUnidad || conc.unidad || ''}</td>
      <td style="text-align:right;">${conc.valorUnitario.toFixed(2)}</td>
      <td style="text-align:right;">${conc.importe.toFixed(2)}</td>
      <td style="text-align:right;">${conc.descuento.toFixed(2)}</td>
      <td style="text-align:right;">${conc.ivaTrasladado.toFixed(2)}</td>
      <td style="text-align:right;">${conc.ivaRetenido.toFixed(2)}</td>
      <td style="text-align:right;">${conc.isrRetenido.toFixed(2)}</td>
    `;

    tr.cells[0].appendChild(rolBadge);
    tbody.appendChild(tr);
  });
}

function renderTablaPagosResumen() {
  const tbody = document.querySelector('#tablaPagosResumen tbody');
  tbody.innerHTML = '';

  const filtros = getFiltros();

  pagosResumen.forEach(p => {
    if (filtros.vista === 'IE') return;

    if (filtros.rol !== 'TODOS' && p.rol !== filtros.rol) return;

    if (filtros.periodo !== 'TODOS' && p.fechaEmisionRaw && !p.fechaEmisionRaw.startsWith(filtros.periodo)) return;

    if (filtros.nombreVal) {
      const nomE = (p.emisorNombre || '').toUpperCase();
      const nomR = (p.receptorNombre || '').toUpperCase();
      if (!nomE.includes(filtros.nombreVal) && !nomR.includes(filtros.nombreVal)) return;
    }

    if (filtros.rfcVal) {
      const rfcE = (p.emisorRfc || '').toUpperCase();
      const rfcR = (p.receptorRfc || '').toUpperCase();
      if (!rfcE.includes(filtros.rfcVal) && !rfcR.includes(filtros.rfcVal)) return;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      const raw = p.fechaPagoRaw || p.fechaEmisionRaw;
      const fechaPago = raw ? new Date(raw) : null;
      if (fechaPago && !isNaN(fechaPago)) {
        if (filtros.fechaDesde && fechaPago < filtros.fechaDesde) return;
        if (filtros.fechaHasta && fechaPago > filtros.fechaHasta) return;
      }
    }

    const tr = document.createElement('tr');

    const rolBadge = document.createElement('span');
    rolBadge.textContent = p.rol;
    rolBadge.classList.add('badge');
    if (p.rol === 'EMITIDO') rolBadge.classList.add('badge-emitido');
    else if (p.rol === 'RECIBIDO') rolBadge.classList.add('badge-recibido');
    else rolBadge.classList.add('badge-otro');

    tr.innerHTML = `
      <td></td>
      <td>${p.uuidPago || ''}</td>
      <td>${p.fechaEmision || ''}</td>
      <td>${p.fechaPago || ''}</td>
      <td>${p.emisorRfc || ''}</td>
      <td>${p.emisorNombre || ''}</td>
      <td>${p.receptorRfc || ''}</td>
      <td>${p.receptorNombre || ''}</td>
      <td>${p.formaPagoP || ''}</td>
      <td>${p.monedaP || ''}</td>
      <td style="text-align:right;">${p.montoPago.toFixed(2)}</td>
      <td style="text-align:right;">${p.numRelacionados}</td>
      <td>${p.uuidsRelacionados || ''}</td>
      <td style="text-align:right;">${p.totalSaldoAnt.toFixed(2)}</td>
      <td style="text-align:right;">${p.totalPagado.toFixed(2)}</td>
      <td style="text-align:right;">${p.totalSaldoInsoluto.toFixed(2)}</td>
    `;

    tr.cells[0].appendChild(rolBadge);
    tbody.appendChild(tr);
  });
}

function renderTablaPagosDetalle() {
  const tbody = document.querySelector('#tablaPagosDetalle tbody');
  const infoDiv = document.getElementById('pagosDetalleFiltroInfo');
  tbody.innerHTML = '';
  if (infoDiv) infoDiv.textContent = '';

  const filtros = getFiltros();
  let cont = 0;

  pagosDetalle.forEach(d => {
    if (filtros.vista === 'IE') return;

    if (filtros.rol !== 'TODOS' && d.rol !== filtros.rol) return;

    if (filtros.periodo !== 'TODOS' && d.fechaEmisionRaw && !d.fechaEmisionRaw.startsWith(filtros.periodo)) return;

    if (filtros.nombreVal) {
      const nomE = (d.emisorNombre || '').toUpperCase();
      const nomR = (d.receptorNombre || '').toUpperCase();
      if (!nomE.includes(filtros.nombreVal) && !nomR.includes(filtros.nombreVal)) return;
    }

    if (filtros.rfcVal) {
      const rfcE = (d.emisorRfc || '').toUpperCase();
      const rfcR = (d.receptorRfc || '').toUpperCase();
      if (!rfcE.includes(filtros.rfcVal) && !rfcR.includes(filtros.rfcVal)) return;
    }

    // Filtro por rango de fechas (fecha de pago o emisión del complemento)
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const raw = d.fechaPagoRaw || d.fechaEmisionRaw;
      const fechaPago = raw ? new Date(raw) : null;
      if (fechaPago && !isNaN(fechaPago)) {
        if (filtros.fechaDesde && fechaPago < filtros.fechaDesde) return;
        if (filtros.fechaHasta && fechaPago > filtros.fechaHasta) return;
      }
    }

    // Drill-down: si hay filtro por UUID de factura, solo mostrar esos doctos
    if (filtroUuidFacturaDetalle) {
      const idDoc = (d.idDocumento || '').toUpperCase();
      if (idDoc !== filtroUuidFacturaDetalle) return;
    }

    const tr = document.createElement('tr');

    const rolBadge = document.createElement('span');
    rolBadge.textContent = d.rol;
    rolBadge.classList.add('badge');
    if (d.rol === 'EMITIDO') rolBadge.classList.add('badge-emitido');
    else if (d.rol === 'RECIBIDO') rolBadge.classList.add('badge-recibido');
    else rolBadge.classList.add('badge-otro');

    tr.innerHTML = `
      <td></td>
      <td>${d.uuidPago || ''}</td>
      <td>${d.fechaEmision || ''}</td>
      <td>${d.fechaPago || ''}</td>
      <td>${d.emisorRfc || ''}</td>
      <td>${d.emisorNombre || ''}</td>
      <td>${d.receptorRfc || ''}</td>
      <td>${d.receptorNombre || ''}</td>
      <td>${d.idDocumento || ''}</td>
      <td>${d.serieDr || ''}</td>
      <td>${d.folioDr || ''}</td>
      <td>${d.monedaDr || ''}</td>
      <td>${d.metodoPagoDr || ''}</td>
      <td>${d.numParcialidad || ''}</td>
      <td style="text-align:right;">${d.impSaldoAnt.toFixed(2)}</td>
      <td style="text-align:right;">${d.impPagado.toFixed(2)}</td>
      <td style="text-align:right;">${d.impSaldoInsoluto.toFixed(2)}</td>
      <td style="text-align:right;">${d.montoPago.toFixed(2)}</td>
      <td>${d.monedaP || ''}</td>
      <td>${d.formaPagoP || ''}</td>
    `;

    tr.cells[0].appendChild(rolBadge);
    tbody.appendChild(tr);
    cont++;
  });

  if (infoDiv) {
    if (filtroUuidFacturaDetalle) {
      infoDiv.textContent =
        `Detalle filtrado por UUID de factura: ${filtroUuidFacturaDetalle} (registros: ${cont}). ` +
        `Haz clic en otra factura PPD o limpia filtros para ver todo.`;
    } else {
      infoDiv.textContent = `Mostrando ${cont} filas de detalle de complementos de pago.`;
    }
  }
}


function renderTablaPpd() {
  const tbody = document.querySelector('#tablaPpd tbody');
  const infoDiv = document.getElementById('ppdResumenInfo');
  if (!tbody || !infoDiv) return;

  tbody.innerHTML = '';

  const filtros = getFiltros();

  // 1) Mapear solo CFDI I/E con método PPD
  const facturasPPD = new Map(); // uuid -> cfdi
  cfdis.forEach(c => {
    if (!(c.tipo === 'I' || c.tipo === 'E')) return;

    const metodo = (c.metodoPago || '').toUpperCase();
    const metodoDesc = (c.metodoPagoDesc || '').toUpperCase();
    const esPPD = metodo === 'PPD' || metodoDesc.includes('PPD');

    if (!esPPD) return;

    facturasPPD.set((c.uuid || '').toUpperCase(), c);
  });

  // Set de todos los CFDI (para detectar complementos sin match)
  const setCfdiUuid = new Set();
  cfdis.forEach(c => {
    if (c.uuid) setCfdiUuid.add((c.uuid || '').toUpperCase());
  });

  // 2) Sumar pagos y contar complementos por UUID factura
  const pagosPorFactura = new Map(); // uuidFactura -> { totalPagado, numPagos }
  let complementosSinMatch = 0;

  pagosDetalle.forEach(d => {
    const idDoc = (d.idDocumento || '').toUpperCase();
    if (!idDoc) return;

    // Complementos sin CFDI cargado (idDocumento no está en ningun cfdi)
    if (!setCfdiUuid.has(idDoc)) {
      complementosSinMatch++;
    }

    if (facturasPPD.has(idDoc)) {
      const actual = pagosPorFactura.get(idDoc) || { totalPagado: 0, numPagos: 0 };
      actual.totalPagado += (d.impPagado || 0);
      actual.numPagos += 1;
      pagosPorFactura.set(idDoc, actual);
    }
  });

  infoDiv.textContent =
    `CFDI PPD cargados: ${facturasPPD.size} | ` +
    `Complementos de pago sin CFDI cargado: ${complementosSinMatch}`;

  // 3) Filas por CFDI PPD
  facturasPPD.forEach((c, uuid) => {
    if (filtros.rol !== 'TODOS' && c.rol !== filtros.rol) return;

    if (filtros.periodo !== 'TODOS' && c.fechaRaw && !c.fechaRaw.startsWith(filtros.periodo)) return;

    const rfcTercero = c.rol === 'EMITIDO' ? c.receptorRfc : c.emisorRfc;
    const nombreTercero = c.rol === 'EMITIDO' ? c.receptorNombre : c.emisorNombre;

    if (filtros.nombreVal) {
      const nom = (nombreTercero || '').toUpperCase();
      if (!nom.includes(filtros.nombreVal)) return;
    }

    if (filtros.rfcVal) {
      const rfc = (rfcTercero || '').toUpperCase();
      if (!rfc.includes(filtros.rfcVal)) return;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      const fechaCfdi = c.fechaRaw ? new Date(c.fechaRaw) : null;
      if (fechaCfdi && !isNaN(fechaCfdi)) {
        if (filtros.fechaDesde && fechaCfdi < filtros.fechaDesde) return;
        if (filtros.fechaHasta && fechaCfdi > filtros.fechaHasta) return;
      }
    }

    const totalCfdi = Number(c.total || 0);
    const dataPago = pagosPorFactura.get(uuid) || { totalPagado: 0, numPagos: 0 };
    let totalPagado = Number(dataPago.totalPagado || 0);
    let saldo = Number((totalCfdi - totalPagado).toFixed(2));
    const numPagos = dataPago.numPagos || 0;

    let estatus = 'Sin pago';
    const epsilon = 0.01;

    if (totalPagado > 0) {
      if (Math.abs(saldo) <= epsilon) {
        saldo = 0;
        estatus = 'Pagado';
      } else if (saldo > 0) {
        estatus = 'Parcial';
      } else if (saldo < 0) {
        estatus = 'Pagado (sobrepago)';
      }
    }

    const tr = document.createElement('tr');

    const rolBadge = document.createElement('span');
    rolBadge.textContent = c.rol;
    rolBadge.classList.add('badge');
    if (c.rol === 'EMITIDO') rolBadge.classList.add('badge-emitido');
    else if (c.rol === 'RECIBIDO') rolBadge.classList.add('badge-recibido');
    else rolBadge.classList.add('badge-otro');

    tr.innerHTML = `
      <td></td>
      <td>${c.uuid || ''}</td>
      <td>${c.fecha || ''}</td>
      <td>${rfcTercero || ''}</td>
      <td>${nombreTercero || ''}</td>
      <td style="text-align:right;">${totalCfdi.toFixed(2)}</td>
      <td>${c.metodoPagoDesc || c.metodoPago || ''}</td>
      <td>${c.formaPagoDesc || c.formaPago || ''}</td>
      <td style="text-align:right;">${totalPagado.toFixed(2)}</td>
      <td style="text-align:right;">${saldo.toFixed(2)}</td>
      <td>${estatus}</td>
      <td style="text-align:right;">${numPagos}</td>
    `;

    tr.cells[0].appendChild(rolBadge);

    // Drill-down: click para filtrar detalle por UUID factura
    tr.addEventListener('click', () => {
      filtroUuidFacturaDetalle = uuid; // uuid ya viene en mayúsculas
      renderTablaPagosDetalle();
    });

    tbody.appendChild(tr);
  });
}

function renderTablaPagosSinCfdi() {
  const tbody = document.querySelector('#tablaPagosSinCfdi tbody');
  const infoDiv = document.getElementById('pagosSinCfdiInfo');
  if (!tbody || !infoDiv) return;

  tbody.innerHTML = '';

  const filtros = getFiltros();

  // Set de todos los UUID de CFDI cargados
  const setCfdiUuid = new Set();
  cfdis.forEach(c => {
    if (c.uuid) setCfdiUuid.add((c.uuid || '').toUpperCase());
  });

  let cont = 0;

  pagosDetalle.forEach(d => {
    const idDoc = (d.idDocumento || '').toUpperCase();
    if (!idDoc) return;

    // Solo los que NO tienen CFDI asociado
    if (setCfdiUuid.has(idDoc)) return;

    // Filtros
    if (filtros.rol !== 'TODOS' && d.rol !== filtros.rol) return;

    if (filtros.nombreVal) {
      const nomE = (d.emisorNombre || '').toUpperCase();
      const nomR = (d.receptorNombre || '').toUpperCase();
      if (!nomE.includes(filtros.nombreVal) && !nomR.includes(filtros.nombreVal)) return;
    }

    if (filtros.rfcVal) {
      const rfcE = (d.emisorRfc || '').toUpperCase();
      const rfcR = (d.receptorRfc || '').toUpperCase();
      if (!rfcE.includes(filtros.rfcVal) && !rfcR.includes(filtros.rfcVal)) return;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      const raw = d.fechaPagoRaw || d.fechaEmisionRaw;
      const fechaPago = raw ? new Date(raw) : null;
      if (fechaPago && !isNaN(fechaPago)) {
        if (filtros.fechaDesde && fechaPago < filtros.fechaDesde) return;
        if (filtros.fechaHasta && fechaPago > filtros.fechaHasta) return;
      }
    }

    const tr = document.createElement('tr');

    const rolBadge = document.createElement('span');
    rolBadge.textContent = d.rol;
    rolBadge.classList.add('badge');
    if (d.rol === 'EMITIDO') rolBadge.classList.add('badge-emitido');
    else if (d.rol === 'RECIBIDO') rolBadge.classList.add('badge-recibido');
    else rolBadge.classList.add('badge-otro');

    tr.innerHTML = `
      <td></td>
      <td>${d.uuidPago || ''}</td>
      <td>${d.fechaPago || ''}</td>
      <td>${d.emisorRfc || ''}</td>
      <td>${d.emisorNombre || ''}</td>
      <td>${d.receptorRfc || ''}</td>
      <td>${d.receptorNombre || ''}</td>
      <td>${d.idDocumento || ''}</td>
      <td>${d.numParcialidad || ''}</td>
      <td style="text-align:right;">${d.impSaldoAnt.toFixed(2)}</td>
      <td style="text-align:right;">${d.impPagado.toFixed(2)}</td>
      <td style="text-align:right;">${d.impSaldoInsoluto.toFixed(2)}</td>
      <td style="text-align:right;">${d.montoPago.toFixed(2)}</td>
      <td>${d.monedaP || ''}</td>
      <td>${d.formaPagoP || ''}</td>
    `;

    tr.cells[0].appendChild(rolBadge);
    tbody.appendChild(tr);
    cont++;
  });

  infoDiv.textContent =
    `Complementos de pago sin CFDI cargado mostrados: ${cont}. ` +
    `Se filtran también por rol, nombre/RFC y fechas.`;
}



// =====================
//  UI columnas y export
// =====================

function initCfdiColumnConfigUI() {
  const container = document.getElementById('columnConfigContainer');
  if (!container) return;
  container.innerHTML = '';

  cfdiColumns.forEach(col => {
    if (col.key === 'rol') return;

    const label = document.createElement('label');
    label.style.display = 'inline-block';
    label.style.marginRight = '8px';
    label.style.marginBottom = '4px';
    label.style.fontSize = '12px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = col.visible;

    checkbox.addEventListener('change', () => {
      col.visible = checkbox.checked;
      renderTablaCfdi();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + col.label));
    container.appendChild(label);
  });
}

// CSV con BOM para que Excel respete UTF-8 y ñ/tildes (punto 1)
function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  let csv = '';
  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    const cols = row.querySelectorAll('th, td');
    const rowData = [];
    cols.forEach(cell => {
      let text = cell.innerText || '';
      text = text.replace(/\r?\n|\r/g, ' ').replace(/"/g, '""');
      rowData.push(`"${text}"`);
    });
    csv += rowData.join(',') + '\n';
  });

  const BOM = '\uFEFF';
  const blob = new Blob([BOM, csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
