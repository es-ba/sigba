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

function showChart() {
    var tabulatorMatrix = getMatrix();
    if (!(tabulatorMatrix.columns.length > 1 && tabulatorMatrix.lineVariables.length == tabulatorMatrix.columnVariables.length == 1)) {
        throw 'no cumple las condiciones requeridas';
    }
    tabulatorMatrix.dataVariables = [tabulatorMatrix.dataVariables[0]]; //descarto coeficiente de variación

<<<<<<< HEAD
    //TODO: pasar esto a un template por favor! y a graphicator
    var chartElementId = chartElementId;
=======
    //TODO: pasar esto a un template por favor!
>>>>>>> 294df2cab0f78180cdf61d880de3bf018ec91df1
    var chartElement = document.createElement('div');
    chartElement.setAttribute('id', chartElementId);

    var chartTitle = document.createElement('h3');
<<<<<<< HEAD
    chartTitle.innerText = matrix.caption;
    chartTitle.style.textAlign = 'center';
=======
    chartTitle.innerText = tabulatorMatrix.caption;
    chartTitle.style.textAlign='center';
>>>>>>> 294df2cab0f78180cdf61d880de3bf018ec91df1

    var chartContainer = document.createElement('div');
    chartContainer.setAttribute('id', 'chartContainer');
    chartContainer.appendChild(chartTitle);
    chartContainer.appendChild(chartElement);
    chartContainer.style.display = 'none';
    // chartContainer.style.width = '500px';

    var tabuladoHtml = tabuladoElement();
    tabuladoHtml.parentNode.insertBefore(chartContainer, tabuladoHtml.nextElementSibling);

<<<<<<< HEAD
    setTimeout(function () {
        //TODO: pasar este curado a Graphicator
        if (matrix.lines.length > 1 && matrix.lines[0].titles[0] == null) {
            matrix.lines.shift();
        }
        
        var generalConfig = {
            matrix: matrix,
            tipo: getTabuladoInfo().info.tipo_grafico,
            idElemParaBindear: chartElementId,
            apilado: false,
            um: getTabuladoInfo().um_denominacion || '',
            c3Config: {
                size: { width: window.innerWidth - document.getElementById("div-pantalla-izquierda").offsetWidth - 32 },
                axis: {
                    rotated: getTabuladoInfo().info.orientacion == 'vertical' ? true : false,
                }
            }
        };

        var specificConfig = {};
        // if (getTabuladoInfo().info.tipo_grafico == 'barra') {
        //     specificConfig = {
        //         apilado: true
        //     };
        // } else {
        //     specificConfig = {
        //     };
        // }
        var graficador = Graphicator.render(changing(generalConfig, specificConfig));

    }, 100);
=======
    setTimeout(function(){
    var graficador;
        var specificOptions={};
        var esHorizontal=getTabuladoInfo().orientacion=='vertical'?true:false;
        
        var ancho=window.innerWidth - document.getElementById("div-pantalla-izquierda").offsetWidth - 32;
        var max=Number.MIN_VALUE;
        var minCellValue=Number.MAX_VALUE;
        var minYValue=0; //default min Y value
        if(tabulatorMatrix.lines.length>1&&tabulatorMatrix.lines[0].titles[0]==null){
            tabulatorMatrix.lines.shift();
        }
        tabulatorMatrix.lines.forEach(function(line, i_line){
            line.cells.forEach(function(cell, i_cell){
                if (cell && cell.valor){
                    max = Math.max(cell.valor,max);
                    minCellValue = Math.min(cell.valor,minCellValue);
                }
            });
        });
        minYValue = minCellValue<0?minCellValue:(2*minCellValue-max>0?2*minCellValue-max:0); // acomoda el 0 automáticamente, si los datos útiles ocupan menos de la mitad cambio el 0        

        if(getTabuladoInfo().tipo_grafico=='barra'){
            graficador = new BarChartGraphicator('chartElement', tabulatorMatrix);
            specificOptions={
                axis:{
                    x:{
                        type: 'category',
                        tick:{values: false}
                    }              
                }
            };
        }else{
            graficador = new LineChartGraphicator('chartElement', tabulatorMatrix);
            specificOptions={
                axis:{
                    y:{
                        min: minYValue // en line charts si todas las lineas están tiradas para arriba le subimos un poco el minValue para que no quede tanto espacio entre el cero y las lineas
                    }
                }
            };
        }

        graficador.renderTabulation(changing(
            {
                size:{width:ancho},
                axis:{
                    rotated:esHorizontal,
                    x:{
                        label: {position:'outer-center', text:tabulatorMatrix.vars[tabulatorMatrix.columnVariables[0]].label},
                        tick: { culling: false }
                    },
                    y:{ 
                        label: {position:'outer-middle', text:(document.getElementById('tabulado-um-descripcion')||{}).textContent||''},
                        padding: minYValue<=0?{bottom: 0}:null,
                    },
                },
                data:{
                     groups:false
                },
                tooltip: {
                    order:false
                }
            },
            specificOptions, 
        ));
    },100);
>>>>>>> 294df2cab0f78180cdf61d880de3bf018ec91df1
}

function getMatrix() {
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
<<<<<<< HEAD
            filename: getTabulatorMatrix().caption,
            username: (window.my) ? window.my.config.username : null
=======
            filename:getMatrix().caption, 
            username: (window.my)?window.my.config.username: null
>>>>>>> 294df2cab0f78180cdf61d880de3bf018ec91df1
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
            console.error('No es posible graficar el tabulado en pantalla');
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
<<<<<<< HEAD
    var textoChico = document.getElementById('texto-encabezado-chico');
    var logoEstadistica = document.getElementById('logo-estadistica');
    var logoConsejo = document.getElementById('logo-consejo');

    var foot = document.getElementById('foot-texto');
    var footOtroRenglon = document.getElementById('foot-texto-2');
    if (foot) {
        foot.textContent = 'Dirección General de Estadística y Censos';
=======
    var textoChico =document.getElementById('texto-encabezado-chico');
    var logoEstadistica=document.getElementById('logo-estadistica');
    var logoConsejo=document.getElementById('logo-consejo');
    window.addEventListener('scroll', function(e){
        var distanceY = window.pageYOffset || document.documentElement.scrollTop;
        var shrinkOn = 0;
        if (distanceY > shrinkOn) {
            if(encabezadoChico){encabezadoChico.classList.add('al-reducir');}
            if(encabezado){encabezado.classList.add('al-reducir');}
            textoGrande?textoGrande.classList.add('al-reducir'):true;
            logoEstadistica?logoEstadistica.classList.add('al-reducir'):true;
            logoConsejo?logoConsejo.classList.add('al-reducir'):true;
        } else {
            if (encabezadoChico && encabezadoChico.getAttribute('class','al-reducir')) {
                encabezadoChico.classList.remove('al-reducir');
                textoGrande?textoGrande.innerHTML='El Sistema Integrado de Indicadores de Derechos de Niñas, Niños y Adolescentes, Ley Nº5.463/15, tiene por objetivo proveer información válida, relevante, mensurable y confiable, acorde con los nuevos estándares definidos en la Convención sobre los Derechos del Niño (CDN), la Ley Nacional Nº 26.061 y la Ley CABA Nº 114; así como la perspectiva de género y el respeto de los principios de intersectorialidad, transversalidad, integralidad, accesibilidad, transparencia y objetividad de la información. El Sistema presenta un conjunto de indicadores que establecen correspondencia con los derechos consagrados por la CDN, que permiten medir y cuantificar el acceso de dicha población a sus derechos. En tal sentido, constituye una herramienta eficaz que permite el monitoreo del cumplimiento de los derechos reconocidos a la población de 0 a 17 años de edad, residente en la Ciudad Autónoma de Buenos Aires, a través de la disponibilización sistemática.':true
            }
            if(textoGrande && textoGrande.getAttribute('class','al-reducir')){
                textoGrande.classList.remove('al-reducir');
            }
            if(logoEstadistica && logoEstadistica.getAttribute('class','al-reducir')){
                logoEstadistica.classList.add('al-reducir');
            }
            if(logoConsejo && logoConsejo.getAttribute('class','al-reducir')){
                logoConsejo.classList.add('al-reducir');
            }
            if(encabezado && encabezado.getAttribute('class','al-reducir')){
                encabezado.classList.remove('al-reducir');
            }
        }
    });
    var foot=document.getElementById('foot-texto');
    var footOtroRenglon=document.getElementById('foot-texto-2');
    if(foot){
        foot.textContent='Dirección General de Estadística y Censos';
>>>>>>> 294df2cab0f78180cdf61d880de3bf018ec91df1
    }
    if (footOtroRenglon) {
        footOtroRenglon.textContent = 'Gobierno de la Ciudad de Buenos Aires';
    }
    var volverAHomeElements = document.querySelectorAll('[volver-a-home]');
    volverAHomeElements.forEach(function (elemento) {
        elemento.addEventListener('click', function () {
            window.location.href = 'principal';
        });
    })
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