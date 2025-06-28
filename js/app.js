let sueldo = 0;
let porcentajeAhorro = 0;
let gastos = [];

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos si existen
    sueldo = parseFloat(localStorage.getItem('sueldo')) || 0;
    porcentajeAhorro = parseInt(localStorage.getItem('porcentajeAhorro')) || 0;
    gastos = JSON.parse(localStorage.getItem('gastos')) || [];

    if (sueldo > 0) document.getElementById('inputSueldo').value = sueldo;
    document.getElementById('porcentaje').value = porcentajeAhorro;
    document.getElementById('porcentajeValor').textContent = porcentajeAhorro + '%';

    mostrarGastos();
    actualizarResumen();
});

function guardarSueldo() {
    sueldo = parseFloat(document.getElementById('inputSueldo').value);
    localStorage.setItem('sueldo', sueldo);
    actualizarResumen();
}

function actualizarAhorro(valor) {
    porcentajeAhorro = parseInt(valor);
    document.getElementById('porcentajeValor').textContent = valor + '%';
    localStorage.setItem('porcentajeAhorro', porcentajeAhorro);
    actualizarResumen();
}

document.getElementById('formGasto').addEventListener('submit', function (e) {
    e.preventDefault();

    const descripcion = document.getElementById('descripcion').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const categoria = document.getElementById('categoria').value;

    if (descripcion && !isNaN(monto)) {
        gastos.push({ descripcion, monto, categoria });
        localStorage.setItem('gastos', JSON.stringify(gastos));
        mostrarGastos();
        actualizarResumen();

        this.reset();
    }
});

function mostrarGastos() {
    const lista = document.getElementById('listaGastos');
    lista.innerHTML = '';
    gastos.forEach(gasto => {
        const li = document.createElement('li');
        li.textContent = `${gasto.categoria}: ${gasto.descripcion} - ${formatoMoneda(gasto.monto)}`;
        lista.appendChild(li);
    });
}

function actualizarResumen() {
    const ahorro = sueldo * (porcentajeAhorro / 100);
    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const disponible = sueldo - ahorro - totalGastos;

    document.getElementById('resumen').innerHTML = `
    <p><strong>Sueldo:</strong> ${formatoMoneda(sueldo)}</p>
    <p><strong>Ahorro (${porcentajeAhorro}%):</strong> ${formatoMoneda(ahorro)}</p>
    <p><strong>Total Gastos:</strong> ${formatoMoneda(totalGastos)}</p>
    <p><strong>Disponible:</strong> ${formatoMoneda(disponible)}</p>
  `;
}


async function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const ahorro = sueldo * (porcentajeAhorro / 100);
    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const disponible = sueldo - ahorro - totalGastos;

    // Obtener la fecha actual en formato local (por ejemplo: 28/06/2025)
    const fechaActual = new Date();
    const fechaTexto = fechaActual.toLocaleDateString('es-ES');

    let y = 10;

    doc.setFontSize(16);
    doc.text("Reporte de Finanzas Personales", 10, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${fechaTexto}`, 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Sueldo: ${formatoMoneda(sueldo)}`, 10, y);
    y += 7;
    doc.text(`Ahorro (${porcentajeAhorro}%): ${formatoMoneda(ahorro)}`, 10, y);
    y += 7;
    doc.text(`Total de gastos: ${formatoMoneda(totalGastos)}`, 10, y);
    y += 7;
    doc.text(`Disponible: ${formatoMoneda(disponible)}`, 10, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Detalle de Gastos:", 10, y);
    y += 8;

    doc.setFontSize(11);
    gastos.forEach((gasto, index) => {
        if (y > 270) {
            doc.addPage();
            y = 10;
        }
        doc.text(`${gasto.fecha} - ${gasto.categoria}: ${gasto.descripcion} - ${formatoMoneda(gasto.monto)}`, 10, y);
        y += 6;
    });

    doc.save(`reporte_finanzas_${fechaActual.toISOString().split('T')[0]}.pdf`);
}
