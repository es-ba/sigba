"use strict";

function tableCreate(info,data) {
    var rows=JSON.parse(data);
    var tablaId=rows[0].indicador;
    var tabla = document.createElement('table');
    tabla.setAttribute('id',tablaId);
   // tabla.style.width = '30%';
   // tabla.setAttribute('border', '1');
    var tbdy = document.createElement('tbody');
    var thead = document.createElement('thead');
    var trThead = document.createElement('tr');
    var tr = document.createElement('tr');
    var caption=document.createElement('caption');
    caption.innerHTML=rows[0].denominacion_indicador;
    rows.forEach(function(row){
        var valor=row.valor;
        var categoria=row.categoria;
        var td = document.createElement('td');
        var th = document.createElement('th');
        var divValor=document.createElement('div');
        var divCategoria=document.createElement('div');
        divValor.innerHTML=valor;
        divCategoria.innerHTML=categoria;
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

    //TODO: pasar esto a un template por favor!
    var chartElement = document.createElement('div');
    chartElement.setAttribute('id', 'chartElement');

    var chartTitle = document.createElement('h3');
    chartTitle.innerText = tabulatorMatrix.caption;
    chartTitle.style.textAlign='center';

    var chartContainer = document.createElement('div');
    chartContainer.setAttribute('id', 'chartContainer');
    chartContainer.appendChild(chartTitle);
    chartContainer.appendChild(chartElement);
    chartContainer.style.display = 'none';
    // chartContainer.style.width = '500px';

    var tabuladoHtml = tabuladoElement();
    tabuladoHtml.parentNode.insertBefore(chartContainer, tabuladoHtml.nextElementSibling);

    setTimeout(function(){
        var graficador = new LineChartGraphicator('chartElement', tabulatorMatrix);
        var ancho=window.innerWidth - document.getElementById("div-pantalla-izquierda").offsetWidth - 32;
        var max=Number.MIN_VALUE;
        var min=Number.MAX_VALUE;
        if(tabulatorMatrix.lines.length>1&&tabulatorMatrix.lines[0].titles[0]==null){
            tabulatorMatrix.lines.shift();
        }
        tabulatorMatrix.lines.forEach(function(line, i_line){
            line.cells.forEach(function(cell, i_cell){
                max = Math.max(cell.valor,max);
                min = Math.min(cell.valor,min);
            });
        });
        graficador.renderTabulation({
            size:{width:ancho},
            axis:{
                x:{
                    label: {position:'outer-center', text:tabulatorMatrix.vars[tabulatorMatrix.columnVariables[0]].label},
                    tick: { fit: false }
                },
                y:{ 
                    label: {position:'outer-middle', text:(document.getElementById('tabulado-um-descripcion')||{}).textContent||''},
                    min: min<0?min:(max-2*min>0?max-2*min:0) // acomoda el 0 automáticamente, si los datos útiles ocupan menos de la mitad cambio el 0
                },
            }
        });
    },100);
}

function getMatrix() {
    return JSON.parse(tabuladoElement().getAttribute('para-graficador'));
}

function chartElement(){ 
    return document.getElementById('chartContainer');
}
function tabuladoElement(){ 
    return document.getElementById('tabulado-html');
}

function toggleChartTabuladoDisplay(){
    //changing url accordingly without reolading page
    var newUrl = window.location.search.includes(displayChartParamName)? location.href.replace(displayChartParamName, ''): location.href+displayChartParamName;  
    window.history.pushState("Cambiar visualización entre gráfico y tabulado", "Visualización", newUrl);

    updateVisualization();
}

// when browser back or next button are used
window.onpopstate = function (event) {
    updateVisualization();
};

function updateVisualization(){
    if (window.location.search.includes(displayChartParamName)) {
        chartElement().style.display='block';
        tabuladoElement().style.display='none';
        document.getElementById('toogleButton').src = 'img/tabulado.png';
    } else {
        chartElement().style.display='none';
        tabuladoElement().style.display='block';
        document.getElementById('toogleButton').src= 'img/grafico.png';
    }
}

window.displayChartParamName = '&type=grafico';

function buildToggleButton(){
    var toggleButton = document.createElement('input');
    toggleButton.type='image';
    toggleButton.id = 'toogleButton';
    toggleButton.className += "boton_tabulados";
    toggleButton.width='40';
    toggleButton.style.margin='5';
    toggleButton.onclick= function(){
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

function buildCopyUrlButton(){
    var copyUrlButton = document.createElement('input');
    copyUrlButton.type='image';
    copyUrlButton.src='img/copiarlink.png';
    copyUrlButton.className += "boton_tabulados";
    copyUrlButton.width="40";
    copyUrlButton.style.margin='5';
    copyUrlButton.onclick= copyUrlFunc;
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

function insertNewButton(newButton){
    // tabuladoElement().parentNode.insertBefore(newButton, tabuladoElement().nextElementSibling);
    tabuladoElement().parentNode.insertBefore(newButton, tabuladoElement())
}

function buildExportExcelButton(){
    var exportButton = document.createElement('input');
    exportButton.type='image';
    exportButton.src='img/exportar.png';
    exportButton.className += "boton_tabulados";
    exportButton.style.margin='5';
    exportButton.width="40";
    exportButton.onclick = function(){
        var t = new Tabulator();
        t.toExcel(tabuladoElement(), {
            filename:getMatrix().caption, 
            username: (window.my)?window.my.config.username: null
        });
    };
    return exportButton
}

function insertCopyUrlButton(){
    insertNewButton(buildHiddenInputUrl());
    insertNewButton(buildCopyUrlButton());
}

window.addEventListener('load', function () {
    if (tabuladoElement()){       
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

    var encabezadoChico =document.getElementById('id-encabezado-chico');
    var encabezado =document.getElementById('id-encabezado');
    var textoGrande=document.getElementById('texto-encabezado-grande');
    if(textoGrande){
        textoGrande.innerHTML=
        'En esta página se presenta la totalidad de los indicadores agrupados por dimensión y autonomía, junto con su serie histórica.'+
        ' Los números indican los valores totales para cada indicador. Haciendo clic en el mismo puede verse la desagregación por sexo.';
        textoGrande.style.paddingTop='40px';
    }
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
    }
    if(footOtroRenglon){
        footOtroRenglon.textContent='Gobierno de la Ciudad de Buenos Aires';
    }
    var volverAHomeElements=document.querySelectorAll('[volver-a-home]');
    volverAHomeElements.forEach(function(elemento){
        elemento.addEventListener('click',function(){
            window.location.href='principal';
        });
    })
    var despliegueEspecialDiv=document.querySelectorAll('[div-despliegue-especial]');
    var despliegueEspecialTd=document.querySelectorAll('[despliegue-especial]');
    despliegueEspecialDiv.forEach(function(div,i){
        var info=div.getAttribute('especial-info');
        var tablaEspecialData=div.getAttribute('valores-especiales');
        var tablaEspecial=tableCreate(info,tablaEspecialData);
        tablaEspecial.setAttribute('class','tabla-desp-especial');
        tablaEspecial.setAttribute('id',info);
        var divPorId=document.getElementById(info);
        despliegueEspecialTd[i].addEventListener('mouseover',function(){
            divPorId.appendChild(tablaEspecial);
        });
        despliegueEspecialTd[i].addEventListener('mouseleave',function(){
            divPorId.removeChild(tablaEspecial);
        });
    })
});