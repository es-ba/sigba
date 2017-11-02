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

window.addEventListener('load',function(){
    try {
        var tabuladoId = 'tabulado-html';
        var tabulado = document.getElementById(tabuladoId);
        if (tabulado){
            var tabulatorMatrix = JSON.parse(tabulado.getAttribute('para-graficador'));
            if (tabulatorMatrix.columns.length > 1 && tabulatorMatrix.lineVariables.length == 1){

                tabulatorMatrix.dataVariables = [tabulatorMatrix.dataVariables[0]]; //descarto coeficiente de variación
                
                var chartNewElement = document.createElement('div');
                chartNewElement.setAttribute('id', 'newChartElement');

                var chartTitle = document.createElement('h3');
                chartTitle.innerText = tabulatorMatrix.caption;
                
                tabulado.parentNode.appendChild(chartTitle);
                tabulado.parentNode.appendChild(chartNewElement);
                
                var graficador=new LineChartGraphicator('newChartElement', tabulatorMatrix);
                graficador.renderTabulation();
            }
        }
    } catch (error) {
        console.error('No es posible graficar el tabulado en pantalla');
    }
    
    var encabezadoChico =document.getElementById('id-encabezado-chico');
    var encabezado =document.getElementById('id-encabezado');
    var textoGrande=document.getElementById('texto-encabezado-grande');
    if(textoGrande){
        textoGrande.innerHTML=
        'El Sistema Integrado de Indicadores de Derechos de Niñas, Niños y Adolescentes, Ley Nº5.463/15, tiene por objetivo proveer información válida, '+
        'relevante, mensurable y confiable, acorde con los nuevos estándares definidos en la Convención sobre los Derechos del Niño (CDN), la Ley '+
        'Nacional Nº 26.061 y la Ley CABA Nº 114; así como la perspectiva de género y el respeto de los principios de intersectorialidad, '+
        'transversalidad, integralidad, accesibilidad, transparencia y objetividad de la información. El Sistema presenta un conjunto de indicadores que '+
        'establecen correspondencia con los derechos consagrados por la CDN, que permiten medir y cuantificar el acceso de dicha población a sus '+
        'derechos. La información se presenta en series con cortes anuales en incluye, para su consulta, las fichas técnicas de cada indicador. En tal '+
        'sentido, constituye una herramienta eficaz que permite el monitoreo del cumplimiento de los derechos reconocidos a la población de 0 a 17 años, '+
        'residente en la Ciudad Autónoma de Buenos Aires, a través de la disponibilización sistemática y actualización continua.'
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