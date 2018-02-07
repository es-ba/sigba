"use strict";
var changing = require('best-globals').changing;
function tableCreate(info, data) {
    var rows = JSON.parse(data);
    var tablaId = rows[0].indicador;
    var tabla = document.createElement('table');
    tabla.setAttribute('id', tablaId);
    // tabla.style.width = '30%';
    // tabla.setAttribute('border', '1');
    var tbdy = document.createElement('tbody');
    var thead = document.createElement('thead');
    var trThead = document.createElement('tr');
    var tr = document.createElement('tr');
    var caption = document.createElement('caption');
    caption.innerHTML = rows[0].denominacion_indicador;
    rows.forEach(function (row) {
        var valor = row.valor;
        var categoria = row.categoria;
        var td = document.createElement('td');
        var th = document.createElement('th');
        var divValor = document.createElement('div');
        var divCategoria = document.createElement('div');
        divValor.innerHTML = valor;
        divCategoria.innerHTML = categoria;
        td.appendChild(divValor);
        th.appendChild(divCategoria);
        tr.appendChild(td);
        trThead.appendChild(th)
    })
    tabla.appendChild(caption);
    thead.appendChild(trThead);
    tabla.appendChild(thead);
    tbdy.appendChild(tr);
    tabla.appendChild(tbdy);
    return tabla;
}

//Curados y validaciones particulares a sigba/sistema de indicadores 
function curarMatrix(matrix){
    matrix = borrarTotales(matrix);
    matrix.dataVariables.splice(matrix.dataVariables.indexOf('cv',1)); //descarto coeficiente de variación
    return matrix;
}

//TODO: si graficar totales depende de tabulado o indicador -> ponerle un campo en tabulado o indicador donde lo especifiquen, si depende del tipo de gráfico -> hacerlo en graphicator
//no se grafican los totales actualmente
function borrarTotales(matrix) {
    if (matrix.lines[0].titles[0] == null && matrix.lines.length > 1) {
        matrix.lines.shift(); // borro linea totales
    }

    if (matrix.columns[0].titles[0] == null && matrix.columns.length > 1){
        matrix.columns.shift();
        matrix.lines.forEach(function (line) {
            line.cells.shift(); //borro la primera celda de cada uno (de totales)
        });
    }

    return matrix;
}

function showChart() {
    var matrix = getTabulatorMatrix();
    matrix = curarMatrix(matrix);

    var generalConfig = {
        matrix: matrix,
        tipo: getTabuladoInfo().tipo_grafico,
        idElemParaBindear: generateChartContainerId(matrix),
        apilado: getTabuladoInfo().apilado,
        um: getTabuladoInfo().um_denominacion || '',
        c3Config: {
            size: { width: window.innerWidth - document.getElementById("div-pantalla-izquierda").offsetWidth - 32 },
            axis: {
                rotated: getTabuladoInfo().orientacion == 'vertical' ? true : false,
            }
        }
    };

    var specificConfig = {}; // ver interfaz graph-configuration.d.ts en graphicator
    var graficador = Graphicator.render(changing(generalConfig, specificConfig));
}

function generateChartContainerId(matrix) {
    
    var chartElementId = 'chartElement';
    var chartElement = document.createElement('div');
    chartElement.setAttribute('id', chartElementId);
    var chartTitle = document.createElement('h3');
    chartTitle.innerText = matrix.caption;
    chartTitle.style.textAlign = 'center';
    var chartContainer = document.createElement('div');
    chartContainer.setAttribute('id', 'chartContainer');
    chartContainer.appendChild(chartTitle);
    chartContainer.appendChild(chartElement);
    chartContainer.style.display = 'none';
    
    var tabuladoHtml = tabuladoElement();
    tabuladoHtml.parentNode.insertBefore(chartContainer, tabuladoHtml.nextElementSibling);
    return chartElementId
}

function getTabulatorMatrix() {
    return JSON.parse(tabuladoElement().getAttribute('para-graficador'));
}

function getTabuladoInfo() {
    return JSON.parse(tabuladoElement().getAttribute('info-tabulado'));
}

function chartContainer() {
    return document.getElementById('chartContainer');
}
function tabuladoElement() {
    return document.getElementById('tabulado-html');
}

function toggleChartTabuladoDisplay() {
    //changing url accordingly without reolading page
    var newUrl = window.location.search.includes(displayChartParamName) ? location.href.replace(displayChartParamName, '') : location.href + displayChartParamName;
    window.history.pushState("Cambiar visualización entre gráfico y tabulado", "Visualización", newUrl);

    updateVisualization();
}

// when browser back or next button are used
window.onpopstate = function (event) {
    updateVisualization();
};

function updateVisualization() {
    if (window.location.search.includes(displayChartParamName)) {
        chartContainer().style.display = 'block';
        tabuladoElement().style.display = 'none';
        document.getElementById('toogleButton').src = 'img/tabulado.png';
    } else {
        chartContainer().style.display = 'none';
        tabuladoElement().style.display = 'block';
        document.getElementById('toogleButton').src = 'img/grafico.png';
    }
}

window.displayChartParamName = '&type=grafico';

function buildToggleButton() {
    var toggleButton = document.createElement('input');
    toggleButton.type = 'image';
    toggleButton.id = 'toogleButton';
    toggleButton.className += "boton_tabulados";
    toggleButton.width = '40';
    toggleButton.style.margin = '5';
    toggleButton.onclick = function () {
        toggleChartTabuladoDisplay();
    }
    return toggleButton;
}

function copyInputToClipboard(inputToCopy) {
    inputToCopy.value = window.location.href;
    inputToCopy.focus();
    inputToCopy.select();
    document.execCommand("Copy");
}

function buildCopyUrlButton() {
    var copyUrlButton = document.createElement('input');
    copyUrlButton.type = 'image';
    copyUrlButton.src = 'img/copiarlink.png';
    copyUrlButton.className += "boton_tabulados";
    copyUrlButton.width = "40";
    copyUrlButton.style.margin = '5';
    copyUrlButton.onclick = copyUrlFunc;
    return copyUrlButton;
}

function copyUrlFunc() {
    var inputUrl = document.getElementById("pasteBox");
    inputUrl.hidden = false;
    copyInputToClipboard(inputUrl);
    inputUrl.hidden = true;
}

function buildHiddenInputUrl() {
    var inputUrl = document.createElement('input');
    inputUrl.type = 'text';
    inputUrl.id = 'pasteBox';
    inputUrl.hidden = true;
    return inputUrl;
}

function insertNewButton(newButton) {
    // tabuladoElement().parentNode.insertBefore(newButton, tabuladoElement().nextElementSibling);
    tabuladoElement().parentNode.insertBefore(newButton, tabuladoElement())
}

function buildExportExcelButton() {
    var exportButton = document.createElement('input');
    exportButton.type = 'image';
    exportButton.src = 'img/exportar.png';
    exportButton.className += "boton_tabulados";
    exportButton.style.margin = '5';
    exportButton.width = "40";
    exportButton.onclick = function () {
        var t = new Tabulator();
        t.toExcel(tabuladoElement(), {
            filename: getTabulatorMatrix().caption,
            username: (window.my) ? window.my.config.username : null
        });
    };
    return exportButton
}

function insertCopyUrlButton() {
    insertNewButton(buildHiddenInputUrl());
    insertNewButton(buildCopyUrlButton());
}

window.addEventListener('load', function () {
    if (tabuladoElement()) {
        try {
            showChart();
            insertNewButton(buildToggleButton());
            updateVisualization();
        } catch (error) {
            console.error('No es posible graficar el tabulado. '+error);
        }
        insertNewButton(buildExportExcelButton());
        insertCopyUrlButton();
    }

    var encabezadoChico = document.getElementById('id-encabezado-chico');
    var encabezado = document.getElementById('id-encabezado');
    var textoGrande = document.getElementById('texto-encabezado-grande');
    if (textoGrande) {
        textoGrande.innerHTML =
            'En esta página se presenta la totalidad de los indicadores agrupados por dimensión y autonomía, junto con su serie histórica.' +
            ' Los números indican los valores totales para cada indicador. Haciendo clic en el mismo puede verse la desagregación por sexo.';
        textoGrande.style.paddingTop = '40px';
    }
    var textoChico = document.getElementById('texto-encabezado-chico');
    var logoEstadistica = document.getElementById('logo-estadistica');
    var logoConsejo = document.getElementById('logo-consejo');

    var foot = document.getElementById('foot-texto');
    var footOtroRenglon = document.getElementById('foot-texto-2');
    if (foot) {
        foot.textContent = 'Dirección General de Estadística y Censos';
    }
    if (footOtroRenglon) {
        footOtroRenglon.textContent = 'Gobierno de la Ciudad de Buenos Aires';
    }
    var despliegueEspecialDiv = document.querySelectorAll('[div-despliegue-especial]');
    var despliegueEspecialTd = document.querySelectorAll('[despliegue-especial]');
    despliegueEspecialDiv.forEach(function (div, i) {
        var info = div.getAttribute('especial-info');
        var tablaEspecialData = div.getAttribute('valores-especiales');
        var tablaEspecial = tableCreate(info, tablaEspecialData);
        tablaEspecial.setAttribute('class', 'tabla-desp-especial');
        tablaEspecial.setAttribute('id', info);
        var divPorId = document.getElementById(info);
        despliegueEspecialTd[i].addEventListener('mouseover', function () {
            divPorId.appendChild(tablaEspecial);
        });
        despliegueEspecialTd[i].addEventListener('mouseleave', function () {
            divPorId.removeChild(tablaEspecial);
        });
    })
});
