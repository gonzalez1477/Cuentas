let sueldo = 0;
let porcentajeAhorro = 0;
let gastos = [];

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos si existen
    sueldo = parseFloat(localStorage.getItem('sueldo')) || 0;
    porcentajeAhorro = parseInt(localStorage.getItem('porcentajeAhorro')) || 0;
    gastos = JSON.parse(localStorage.getItem('gastos')) || [];

    if (sueldo > 0) {
        document.getElementById('inputSueldo').value = sueldo;
        habilitarControles(true);
        document.getElementById('mensajeInicial').textContent = '';
    } else {
        habilitarControles(false);
        document.getElementById('mensajeInicial').textContent = 'Bienvenido, ingresa tu sueldo para comenzar.';
    }

    document.getElementById('porcentaje').value = porcentajeAhorro;
    document.getElementById('porcentajeValor').textContent = porcentajeAhorro + '%';

    mostrarGastos();
    actualizarResumen();
});

function guardarSueldo() {
    sueldo = parseFloat(document.getElementById('inputSueldo').value);

    if (!isNaN(sueldo) && sueldo > 0) {
        localStorage.setItem('sueldo', sueldo);
        habilitarControles(true);
        actualizarResumen();

        // Limpiar mensaje inicial
        document.getElementById('mensajeInicial').textContent = '';
    } else {
        alert('Por favor ingresa un sueldo válido antes de continuar.');
    }
}

function actualizarAhorro(valor) {
    if (sueldo <= 0) {
        alert('Debes ingresar un sueldo primero.');
        return;
    }

    if (gastos.length > 0) {
        alert('No puedes modificar el porcentaje de ahorro después de haber registrado gastos.');
        document.getElementById('porcentaje').value = porcentajeAhorro; // revertir al valor original
        return;
    }

    porcentajeAhorro = parseInt(valor);
    document.getElementById('porcentajeValor').textContent = valor + '%';
    localStorage.setItem('porcentajeAhorro', porcentajeAhorro);
    actualizarResumen();
}

document.getElementById('formGasto').addEventListener('submit', function (e) {
    e.preventDefault();

    if (sueldo <= 0) {
        alert('Debes ingresar un sueldo antes de registrar gastos.');
        return;
    }

    const descripcion = document.getElementById('descripcion').value.trim();
    const monto = parseFloat(document.getElementById('monto').value);
    const categoria = document.getElementById('categoria').value;

    if (!descripcion || isNaN(monto) || monto <= 0) {
        alert('Por favor ingresa una descripción válida y un monto positivo.');
        return;
    }

    const ahorro = sueldo * (porcentajeAhorro / 100);
    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const disponible = sueldo - ahorro - totalGastos;

    if (monto > disponible) {
        alert(`No puedes realizar este gasto. Monto disponible: ${formatoMoneda(disponible)}.`);
        return;
    }

    const fecha = new Date().toLocaleDateString('es-ES');
    gastos.push({ descripcion, monto, categoria, fecha });
    localStorage.setItem('gastos', JSON.stringify(gastos));
    mostrarGastos();
    actualizarResumen();
    this.reset();
});

function mostrarGastos() {
    const lista = document.getElementById('listaGastos');
    lista.innerHTML = '';

    gastos.forEach((gasto, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${gasto.categoria}: ${gasto.descripcion} - ${formatoMoneda(gasto.monto)}
            <button onclick="eliminarGasto(${index})" class="btn-eliminar">Eliminar</button>
        `;
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
    // Validar sueldo válido y mayor que cero
    if (!sueldo || sueldo <= 0) {
        alert('Por favor, ingresa un sueldo válido antes de exportar el reporte.');
        return;
    }

    // Validar porcentaje de ahorro válido
    if (porcentajeAhorro < 0 || porcentajeAhorro > 100) {
        alert('Por favor, selecciona un porcentaje de ahorro válido antes de exportar el reporte.');
        return;
    }

    // Validar existencia de gastos
    if (!gastos || gastos.length === 0) {
        const confirmar = confirm('No hay gastos registrados. ¿Deseas generar el reporte igual?');
        if (!confirmar) return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const ahorro = sueldo * (porcentajeAhorro / 100);
    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const disponible = sueldo - ahorro - totalGastos;

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
    gastos.forEach((gasto) => {
        if (y > 270) {
            doc.addPage();
            y = 10;
        }
        doc.text(`${gasto.categoria}: ${gasto.descripcion} - ${formatoMoneda(gasto.monto)}`, 10, y);
        y += 6;
    });

    doc.save(`reporte_finanzas_${fechaActual.toISOString().split('T')[0]}.pdf`);
    limpiarPagina();
}

function limpiarPagina() {
    sueldo = 0;
    porcentajeAhorro = 0;
    gastos = [];

    localStorage.removeItem('sueldo');
    localStorage.removeItem('porcentajeAhorro');
    localStorage.removeItem('gastos');

    document.getElementById('inputSueldo').value = '';
    document.getElementById('porcentaje').value = 0;
    document.getElementById('porcentajeValor').textContent = '0%';
    document.getElementById('listaGastos').innerHTML = '';
    document.getElementById('resumen').innerHTML = '';

    habilitarControles(false);

    // Mostrar mensaje de bienvenida
    document.getElementById('mensajeInicial').textContent = 'Bienvenido, ingresa tu sueldo para comenzar.';
}

function eliminarGasto(index) {
    if (confirm('¿Deseas eliminar este gasto?')) {
        gastos.splice(index, 1);
        localStorage.setItem('gastos', JSON.stringify(gastos));
        mostrarGastos();
        actualizarResumen();
    }
}

function habilitarControles(habilitado) {
    document.getElementById('porcentaje').disabled = !habilitado;
    document.getElementById('descripcion').disabled = !habilitado;
    document.getElementById('monto').disabled = !habilitado;
    document.getElementById('categoria').disabled = !habilitado;
    document.querySelector('#formGasto button[type="submit"]').disabled = !habilitado;
}

// Formateador para moneda
function formatoMoneda(valor) {
    return valor.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
}

document.getElementById('btnReiniciar').addEventListener('click', () => {
    if (confirm('¿Estás seguro que deseas reiniciar todos los datos? Esta acción no se puede deshacer.')) {
        limpiarPagina();
        alert('Los datos han sido eliminados. Puedes empezar de nuevo.');
    }
});
