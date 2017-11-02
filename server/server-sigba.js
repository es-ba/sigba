"use strict";

/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

// APP

var Path = require('path');

function inlineLog(whatEver){
    console.log(whatEver);
    return whatEver;
}

if(process.argv[2]=='--dir'){
    process.chdir(process.argv[3]);
    console.log('cwd',process.cwd());
}

var extensionServeStatic = require('extension-serve-static');

var changing = require('best-globals').changing;
var backend = require("backend-plus");
var MiniTools = require("mini-tools");
var jsToHtml=require('js-to-html');
var html=jsToHtml.html;
var Tabulator = require('tabulator');//.Tabulator;
var tabulator = new Tabulator();
var likeAr = require('like-ar');
var fs=require('fs');

class AppSIGBA extends backend.AppBackend{
    constructor(){
        super();
    }
    configList(){
        return super.configList().concat([
            'def-config.yaml',
            'local-config.yaml'
        ]);
    }
    log(condition, f){
        if(new Date(this.config.log[condition])>new Date()){
            console.log(f());
        }
    }
    getProcedures(){
        var be = this;
        return super.getProcedures().then(function(procedures){
            return procedures.concat(
                require('./procedures-sigba.js').map(be.procedureDefCompleter, be)
            );
        });
    }
    decimalesYComa(stringValue,decimales,separador) {
        return !isNaN(Number(stringValue))?Number(stringValue).toFixed(decimales).toString().replace('.',separador):stringValue;
    }
    
    puntosEnMiles(value){
        var str=value;
        if(typeof value!='string'){
            str = typedValue.toString();
        }
       return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    
    reporteBonito(client, defTables, annios, where,color) {
        var urlYClasesTabulados='principal';
        if(!defTables.length){
            return Promise.resolve([]);
        }
        var table=defTables[0].tabla;
        var be = this;
        return client.query(
            'SELECT * FROM '+be.db.quoteObject(table)+
            ' WHERE '+(where||'true')+
            ' ORDER BY '+(defTables[0].orderBy||["orden", "denominacion"]).map(function(campoOrden){ return be.db.quoteObject(campoOrden); }).join(',')
        ).fetchAll().then(function(result){
            var tablaHija=(defTables[1]||{}).tabla;
            return Promise.all(result.rows.map(function(registro){
                if(defTables[0].color){
                        color=registro.agrupacion_principal;
                }
                var whereHija=(defTables[0].joinSiguiente||[]).map(function(nombreCampo){
                    return be.db.quoteObject(nombreCampo)+" = "+be.db.quoteText(registro[nombreCampo]);
                }).join(" and ").concat((defTables[0].condicion)?' and '+defTables[0].condicion:'');
                return be.reporteBonito(client, defTables.slice(1), annios, whereHija,color).then(function(listaTrHijos){
                    var listaTd;
                    var result;
                    var paraFicha;
                    return client.query(
                        `SELECT  count(distinct cortantes) cant_cortantes 
                            FROM sigba.celdas 
                            WHERE indicador=$1`,[registro.indicador]
                    ).fetchOneRowIfExists().then(function(resultCortantes){
                        result=resultCortantes;
                        return client.query(`
                        SELECT i.dimension,i.indicador,i.denominacion,i.def_con,i.def_ope,i.cob,i.desagregaciones,i.uso_alc_lim,i.universo,f.denominacion fte,u.denominacion um
                            FROM indicadores i LEFT JOIN fte f ON i.fte=f.fte LEFT JOIN um u ON u.um=i.um
                            WHERE i.indicador=$1
                            ORDER BY i.indicador,i.dimension
                        `,[registro.indicador]).fetchOneRowIfExists().then(function(resultado){
                            registro.ficha=resultado.row;
                    })}).then(function(){
                        listaTd=[html.td({class:'td-'+urlYClasesTabulados+'-renglones',colspan:4-defTables.length},[html.div({class:'espacio-reserva'},'-')])].concat(
                            defTables[0].camposAMostrar.map(function(nombreCampo,i){
                                var id=registro.indicador?registro.indicador:registro[nombreCampo];
                                var attributes={colspan:i?1:defTables.length+1,class:'campo_'+nombreCampo,id:id};
                                var skin=be.config['client-setup'].skin;
                                var skinUrl=(skin?skin+'/':'');
                                if(registro.indicador ){
                                    if(registro.def_con){
                                        attributes.title=registro.def_con;
                                    }
                                    var informacionIndicador=html.span({id:'ficha_'+registro.indicador,class:'info-indicador','ficha-indicador':JSON.stringify(registro.ficha)},[
                                        html.a({class:'link-info-indicador',href:'/sigba/'+urlYClasesTabulados+'-info-indicador?indicador='+registro.indicador,title:'Ficha técnica'},[
                                            html.img({class:'img-info-indicador', src:skinUrl+'img/img-info-indicador.png'})
                                        ]),
                                    ])
                                }
                                if(registro.agrupacion_principal ){
                                    if(registro.descripcion){
                                        attributes.title=registro.descripcion
                                    }
                                    var ley=registro.leyes;
                                    if(ley){
                                        var informacionAgrupacionPrincipal=html.span({id:'ley_'+registro.agrupacion_principal,class:'ley-agrupacion_principal'},[
                                            html.a({class:'link-ley-agrupacion_principal',href:'/sigba/'+urlYClasesTabulados+'-ley-agrupacion_principal?agrupacion_principal='+registro.agrupacion_principal,title:'Leyes'},[
                                                html.img({class:'img-ley-agrupacion_principal', src:skinUrl+'img/img-ley-agrupacion_principal.png'})
                                            ])
                                        ]);
                                    }
                                }
                                var htmlA=(
                                    defTables[0].mostrarIndicadoresYLinks && result.row.cant_cortantes!=1
                                )?{href:'/sigba/'+urlYClasesTabulados+'-indicador?indicador='+(registro.indicador||''),class:'es-link'}:{class:'no-es-link'};
                                return html.td(attributes,[
                                    html.a(htmlA,registro[nombreCampo]),
                                    registro.indicador?informacionIndicador:null,
                                    registro.agrupacion_principal?informacionAgrupacionPrincipal:null
                                ]);
                            })
                        );
                        return listaTd;
                    }).then(function(listaTd){
                        var obtenerValores=Promise.resolve([]);
                        if(defTables[0].mostrarIndicadoresYLinks){
                            var decimales=registro.decimales||'';
                            obtenerValores=client.query(
                                `with 
                                annios as (
                                    SELECT valor_corte annio from cortes where variable = 'annio'                                    
                                    ),
                                data as (
                                    SELECT cc.valor_corte annio, v.valor , ct.cant_cortantes, i.despliegue_especial,i.var_despliegue_especial
                                        FROM sigba.celdas v
                                         LEFT JOIN cortes_celdas cc ON cc.indicador=v.indicador and cc.cortes=v.cortes
                                         LEFT JOIN indicadores i ON i.indicador=v.indicador, LATERAL 
                                            (SELECT ccc.valor_corte ,count(distinct cortantes) cant_cortantes FROM sigba.celdas vv
                                            LEFT JOIN cortes_celdas ccc ON ccc.indicador=vv.indicador and ccc.cortes=vv.cortes
                                            WHERE ccc.valor_corte=cc.valor_corte and vv.indicador=$1 group by ccc.valor_corte ) ct
                                        WHERE v.indicador=$1 AND cortantes = '{"annio":true}'::jsonb order by annio
                                    ),
                                indic_annio as (select indicador,annio from indicador_annio where indicador=$1 )
                                SELECT a.annio, d.valor, d.cant_cortantes,d.despliegue_especial,d.var_despliegue_especial,indic_annio.indicador
                                from annios a left join data d on a.annio=d.annio left join indic_annio on a.annio=indic_annio.annio
                                order by a.annio desc                                   ;`,
                               [registro.indicador||'']
                           ).fetchAll().then(function(result){
                               return result.rows;
                           });
                        }
                        return obtenerValores.then(function(valores){
                            var listaTdValores=[];
                            return Promise.all(valores.map(function(rowValor){
                                return Promise.resolve().then(function(){
                                    var valorRow=rowValor.valor;
                                    var annioRow=rowValor.annio;
                                    var indicadorAnnio=rowValor.indicador;
                                    var despliegueEspecial=rowValor.despliegue_especial;
                                    var valorFormateado=be.decimalesYComa(valorRow,decimales,',');
                                    var aAtribute={class:'link-cortantes',href:'/sigba/'+urlYClasesTabulados+'-indicador?annio='+annioRow+'&indicador='+(registro.indicador||'')};
                                    var divAttribute={class:'cortante-no-dato'};
                                    var tdAttribute={class:'td-valores'};
                                    var divDespliegueEspecial=null;
                                    return Promise.resolve().then(function(){
                                        if(despliegueEspecial){
                                            var var_despliegueEspecial=rowValor.var_despliegue_especial;
                                            return client.query(
                                                "SELECT i.indicador indicador, i.denominacion denominacion_indicador,i.decimales, valor,i.var_despliegue_especial variable,z.cortes, c.denominacion categoria "+
                                                    "FROM celdas z "+
                                                    "LEFT JOIN indicadores i ON z.indicador=i.indicador "+
                                                    "LEFT JOIN cortes_celdas cc on cc.indicador=z.indicador AND cc.cortes=z.cortes AND cc.variable=$3"+
                                                    "LEFT JOIN cortes_celdas ca on ca.indicador=z.indicador AND ca.cortes=z.cortes AND ca.variable='annio'"+
                                                    "LEFT JOIN cortes c on c.variable=$3 AND cc.valor_corte=c.valor_corte "+
                                                    "WHERE i.indicador=$1 AND ca.valor_corte=$2 AND "+
                                                        "ARRAY['annio',i.var_despliegue_especial]=ARRAY(SELECT jsonb_object_keys(z.cortantes))"+
                                                        "ORDER BY c.orden",
                                                [registro.indicador,rowValor.annio, var_despliegueEspecial]
                                            )
                                            .fetchAll().then(function(datos){
                                                return datos 
                                            }).then(function(datos){
                                                datos.rows.forEach(function(row){
                                                    row.valor=be.puntosEnMiles(be.decimalesYComa(row.valor,row.decimales,','));
                                                })
                                                tdAttribute['despliegue-especial']=true;
                                                divDespliegueEspecial=html.div({
                                                    id:registro.indicador+'_'+rowValor.annio,
                                                    'div-despliegue-especial':true,
                                                    'especial-info':registro.indicador+'_'+rowValor.annio,
                                                    'valores-especiales':JSON.stringify(datos.rows)
                                                });
                                                return divDespliegueEspecial
                                            });
                                        }else{
                                            return divDespliegueEspecial;
                                        }
                                    }).then(function(){
                                        var valorReporteBonito;
                                        valorReporteBonito=(valorRow==null)?(!indicadorAnnio?'///':'...'):be.puntosEnMiles(valorFormateado);
                                        var aAttributes={class:'link-cortantes',href:'/sigba/'+urlYClasesTabulados+'-indicador?annio='+annioRow+'&indicador='+(registro.indicador||'')}
                                        var divAttributes={class:'cortante-no-dato'};
                                        if(despliegueEspecial){
                                            aAttributes['a-despliegue-especial']=true;
                                            divAttributes['div-externo-despliegue-especial']=true;
                                        }
                                        var aODiv=(rowValor.cant_cortantes>1)?
                                            html.a(aAttributes,valorReporteBonito):
                                            html.div(divAttributes,valorReporteBonito);
                                            listaTdValores[annios[annioRow]]=html.td(/*{class:'td-valores'}*/tdAttribute,[aODiv,despliegueEspecial?divDespliegueEspecial:null]);
                                    });
                                });
                            })).then(function(){
                                if(defTables[0].color){
                                    color=registro.agrupacion_principal;
                                }
                                if(listaTrHijos.length==0 && defTables.length==3){
                                    listaTrHijos=[html.tr({class:'renglon-vacio'},[
                                        html.td({colspan:5,class:'renglon-vacio'}),
                                        html.td({colspan:likeAr(annios).array().length,class:'renglon-vacio'})])];
                                }
                                return [
                                    html.tr({class:'nivel-titulo',"nivel-titulo": defTables.length, "color-agrupacion_principal":color||'otro'},listaTd.concat(listaTdValores))
                                ].concat(listaTrHijos);
                            });
                        });
                    })
                });
            })).then(function(listaDeListaTr){
                return [].concat.apply([], listaDeListaTr);
            });
        });
    }
    armarUnTabulado(client, fila,annio,indicador,descripcionTabulado){
        var be = this;
        return Promise.resolve().then(function(){
            var datum={};
            var variables=fila.variables.split(',');
            var var_ubiFilCol=fila.ubicacion.split(',');
            var def_var_usu=fila.cant_filcol ==fila.cantidad_cortantes;    
            var armaVars= function armaVars(filaVars){
                var labels=filaVars.denominacion.split('|');
                var vars=[];
                for(var i=0;i<labels.length;i++){
                    vars.push({
                        name: variables[i],
                        label:labels[i],
                        place: def_var_usu?(var_ubiFilCol[i]=='col'?'top':'left'):((i===labels.length-1)?'top':'left')
                    });
                }
                return vars;
            };
            var devolverValues=function devolverValues(filas){
                var vValores={};
                filas.forEach(function(fila){
                    vValores[fila.valor_corte]={label:fila.denominacion}; 
                });
                vValores[null]={label:'TOTAL'};
                return vValores;
            };
            datum.vars=armaVars(fila);
            
            return Promise.all(
                datum.vars.map(function(info){
                    return (client.query(
                        "SELECT * FROM cortes c WHERE c.variable = '" +info.name+ "' ORDER BY orden"
                    ).fetchAll().then(function(result){
                        return devolverValues(result.rows);
                    }));
                })
            ).then(function(valuesOfVars){
                datum.vars.forEach(function(variable,i){
                    variable.values=valuesOfVars[i];
                });
            }).then(function(){                
                var conOSinAnnio=(annio?"cortantes - 'annio'":"cortantes");
                descripcionTabulado.info={
                    indicador:indicador,
                    camposCortantes:be.defs_annio(annio).cortantes,
                    cortantes: fila.crt,
                    annioCortante:annio?annio:'TRUE',
                };
                return client.query(
                    "SELECT "+ variables.map(function(varInv){
                        return 'cc_'+varInv+'.valor_corte '+varInv;
                    }).join(',') +", valor, cv " + 
                        "\n  FROM celdas v  LEFT JOIN "+ variables.map(function(varInv){
                            return (" cortes_celdas cc_"+varInv +
                                " ON v.indicador=cc_"+varInv+".indicador AND v.cortes=cc_"+varInv+".cortes AND cc_"+varInv+".variable='"+varInv+"'" +
                                "\n LEFT JOIN cortes corte_"+varInv+" ON cc_"+varInv+".variable=corte_"+varInv+".variable AND "+ "cc_"+varInv+".valor_corte="+"corte_"+varInv+".valor_corte");
                        }).join('\n    LEFT JOIN ')+
                        "\n  WHERE v.indicador=$1 AND "+be.defs_annio(annio).cortantes+" <@ $2 AND "+be.defs_annio(annio).cond_annio_en_cortante+
                        "\n  ORDER BY " + variables.map(function(varInv){
                                
                                return ((varInv!='annio')?'corte_'+varInv+'.orden NULLS FIRST':varInv+' desc');
                        }).join(' , '),
                    be.defs_annio(annio).f_param_cortantes_posibles([indicador,fila.crt,annio])
                ).fetchAll();
            }).then(function(result){
                datum.list=result.rows;
                datum.vars.push({name:'valor', place:'data'});
                datum.vars.push({name:'cv', place:'data'});
                datum.list.forEach(function(row){
                    if(row.desagr=='tcaba'){
                        row.desagr=null;
                    }
                })
                tabulator.defaultShowAttribute='valor';
                //fs.writeFile('C:/compartida/datum/'+indicador+'_'+Date.now()+'_datum.json',JSON.stringify(datum),{encoding:'utf8'})
                var matrix=tabulator.toMatrix(datum);
                return client.query(
                    "SELECT i.denominacion as i_denom ,i.con_nota_pie con_nota, f.denominacion as f_denom, u.denominacion as u_denom,u.um as um,u.nota_pie nota_pie, i.decimales FROM indicadores i " 
                        +"\n INNER JOIN fte f ON f.fte=i.fte " 
                        +"\n INNER JOIN um u ON u.um=i.um "
                        +"\n WHERE indicador=$1",
                    [indicador]
                ).fetchOneRowIfExists().then(function(result){
                    descripcionTabulado.indicador=result.row.i_denom;
                    descripcionTabulado.nota_pie=result.row.con_nota?result.row.nota_pie:null;
                    descripcionTabulado.fuente=result.row.f_denom;
                    descripcionTabulado.um_denominacion=result.row.u_denom;
                    descripcionTabulado.um=result.row.um;
                    descripcionTabulado.decimales=result.row.decimales;
                    matrix.caption=result.row.i_denom;
                    return {matrix,descripcionTabulado};
                });
            }).then(function(result){
                tabulator.toCellTable=function(cell){
                    var cellValor=(cell && cell.valor)?cellValor=be.decimalesYComa(cell.valor,result.descripcionTabulado.decimales,','):(cell?cell.valor:cell)
                    return html.td({class:'tabulator-cell'},[
                        html.div({id:'valor-cv'},[
                            html.div({id:'valor-en-tabulado'},cell?be.puntosEnMiles(cellValor):'///'),
                            html.div({id:'cv-en-tabulado'},(cell && cell.cv)?cell.cv:null)
                        ])
                    ]);
                };
                var tabuladoHtml=tabulator.toHtmlTable(result.matrix)
                return {tabuladoHtml,descripcionTabulado, matrix:result.matrix};
            });
        });
    }
    anniosCortantes(client,annios,anniosA,indicador){
        var sql = "SELECT distinct valor_corte annio FROM cortes_celdas "+
            "WHERE variable = 'annio'"+ (indicador?" and indicador = $1": "")+
            "ORDER BY annio desc";
        return client.query(sql,indicador?[indicador]:[]).then(function(result){
            result.rows.forEach(function(row,i){
                annios[row.annio]=i;
                anniosA.push(row.annio);
            });
        });
    }
    defs_annio(annio){
        if(annio){
            return {
                cortantes:"v.cortantes - 'annio'", 
                cond_cortantes_posibles:"cortes ->> 'annio' = $2", 
                cond_annio_en_cortante:" cc_annio.valor_corte=$3",
                f_param_cortantes_posibles: function(arra){return arra;}
            };
        }else{
            return {
                cortantes:'v.cortantes', 
                cond_cortantes_posibles:"TRUE", 
                cond_annio_en_cortante:"TRUE",
                f_param_cortantes_posibles: function(arra){return arra.slice(0,-1)}
            };
        }
    }
    esAdminSigba(req){
        return (req && req.user && (req.user.usu_rol=='admin'|| req.user.usu_rol=='programador') && req.user.active==true);
    }

    ownClientIncludes(){
        return [
            { type: 'js', module: 'graphicator', path:'graphicator'},
            { type: 'css', module: 'c3' }
        ];
    }

    clientIncludes(req, hideBEPlusInclusions) {
        return this.ownClientIncludes(req).concat(super.clientIncludes(req, hideBEPlusInclusions));
    }

    headSigba(esPrincipal,req,title){
        var be=this;
        var esAdmin=be.esAdminSigba(req);
        var hideBEPlusInclusions = !this.esAdminSigba(req);
        var listaJS=be.clientModules(req, hideBEPlusInclusions).scripts.map(function(module){ return html.script(module); });
        listaJS.push(html.script({src:'menu-2.js'}));
        if(esAdmin){
            listaJS.push(html.script({src:'menu-3.js'}));
        }
        var listaCSS = be.csss(hideBEPlusInclusions);
        return html.head([
            html.title(title),
           // html.title(esPrincipal?'Tabulados':'Tabulado'),
            html.link({rel:"stylesheet", type:"text/css", href:"css/tabulados.css"}),
        ].concat(listaJS).concat(listaCSS.map(function(css){
            return html.link({href: css, rel: "stylesheet"});
        })).concat(listaCSS.map(function(css){
            var skin=be.config['client-setup'].skin;
            var skinUrl=(skin?skin+'/':'');
            return esAdmin && skin?html.link({href: skinUrl+css, rel: "stylesheet"}):null;
        })));
    }
    addSchrödingerServices(mainApp, baseUrl){
        mainApp.use(baseUrl+'/',function(req, res, next) {
            if (req.path.substr(-1) == '/' && req.path.length > 1) {
                var query = req.url.slice(req.path.length);
                res.redirect(301, req.path.slice(0, -1) + query);
            } else {
                next();
            }
        });
        var be = this;
        var urlYClasesTabulados='principal';
        super.addSchrödingerServices(mainApp, baseUrl);
        mainApp.get(baseUrl+'/'+urlYClasesTabulados+'-indicador', function(req,res){
            var client;
            var annio=req.query.annio;
            var indicador=req.query.indicador;
            var cortante=req.query.cortante;
            return be.getDbClient(req).then(function(cli){
                var esAdmin=be.esAdminSigba(req);
                var usuarioRevisor=false; // true si tiene permiso de revisor
                client=cli;
                var queryStr = "SELECT v.indicador, v.cortantes crt, COUNT(*), cantidad_cortantes, variables_info, "+
                "\n case when cant_filcol=cantidad_cortantes then var_ordFilCol else variables end variables, "+
                "\n c.orden, case when cant_filcol=cantidad_cortantes then var_denomFilCol else c.denominacion end denominacion ,"+
                "\n case when cant_filcol=cantidad_cortantes then var_ubiFilCol else '' end ubicacion, cant_filcol "+
                "\n , ARRAY[v.cortantes] <@ i.nohabilitados is not true habilitado, v.cortantes cortante_orig" +
                "\n FROM celdas v, LATERAL ( "+ 
                        "\n SELECT COUNT(*) as cantidad_cortantes, string_agg(c.c, ',' ORDER BY vc.orden, vc.variable) AS variables,"+
                            "\n string_agg(vc.denominacion,'|' ORDER BY vc.orden, vc.variable) as denominacion, " + 
                            "\n min(vc.orden) AS orden, "+
                            "\n string_agg( iv.variable ,',' ORDER BY iv.ubicacion,iv.orden, iv.variable) AS var_ordFilCol, "+
                            "\n string_agg(vc.denominacion,'|' ORDER BY iv.ubicacion,iv.orden, iv.variable) as var_denomFilCol, " + 
                            "\n string_agg( iv.ubicacion,',' ORDER BY iv.ubicacion,iv.orden, iv.variable) AS var_ubiFilCol, "+
                            "\n count(iv.ubicacion) AS cant_FilCol , coalesce(string_agg(c.c::text||'-'||vc.orden::text||'-'||vc.variable::text, ',' ORDER BY vc.orden, vc.variable),'/')||'--'||coalesce(string_agg( iv.ubicacion||'-'||iv.orden||'-'||iv.variable ,',' ORDER BY iv.ubicacion,iv.orden, iv.variable),'/') AS variables_info " +
                            "\n FROM jsonb_object_keys(v.cortantes) c INNER JOIN variables vc ON c.c = vc.variable "+
                            "\n    INNER JOIN indicadores_variables iv ON iv.indicador=v.indicador AND iv.variable= vc.variable "+
                    "\n ) c , indicadores i " +
                "\n WHERE cortes ? 'annio' AND v.indicador = $1"+
                    "\n  AND i.indicador=v.indicador AND " + be.defs_annio(annio).cond_cortantes_posibles/*" cortes ->> 'annio' = $2":" TRUE")*/+
                "\n GROUP BY v.indicador, cortantes, cantidad_cortantes, variables, c.orden,c.denominacion, "+
                "\n     var_ordFilCol,var_denomFilCol,var_ubiFilCol, cant_filcol, habilitado, variables_info " +
                "\n ORDER BY v.indicador, c.orden, cantidad_cortantes;";
                return client.query(queryStr, be.defs_annio(annio).f_param_cortantes_posibles([indicador,annio])
                ).fetchAll().then(function(result){
                    var fila;
                    var cortantesPosibles=[];
                    result.rows.forEach(function(filar){
                        if(cortante && filar.variables==cortante){
                            fila=filar;
                        }
                        if((filar.cantidad_cortantes!=1 )&&(esAdmin || filar.habilitado )){
                            cortantesPosibles.push({    
                                variable: filar.variables,
                                denominacion: filar.denominacion,
                                fila:filar,
                                cantidad:filar.cantidad_cortantes
                            });
                        }
                    });
                    if(!cortante){
                        fila=cortantesPosibles[0].fila;
                        cortante=cortantesPosibles[0].variable;
                    }
                    var descripcionTabulado={};
                    return be.armarUnTabulado(client, fila, annio, indicador,descripcionTabulado).then(function(tabuladoHtmlYDescripcion){
                        var trCortantes=cortantesPosibles.map(function(cortanteAElegir){
                            var denominaciones=cortanteAElegir.denominacion.split('|');
                            annio?denominaciones.splice(cortanteAElegir.variable.split(',').indexOf('annio'),1):true;
                            var href='/sigba/'+urlYClasesTabulados+'-indicador?'+(annio?'annio='+annio+'&':'')+'indicador='+indicador+'&cortante='+cortanteAElegir.variable;
                            return html.tr({class:'tr-cortante-posible'},[
                                html.td({class:'td-cortante-posible', 'menu-item-selected':cortanteAElegir.variable==cortante},[
                                    html.a({class:'a-cortante-posible',href:href},denominaciones.join('-'))
                                ])
                            ]);
                        });
                        var annios={};
                        var anniosA=[];
                        var anniosLinks=[];
                        tabuladoHtmlYDescripcion.descripcionTabulado.info.usuario=req.user?req.user.usu_usu:{};
                        tabuladoHtmlYDescripcion.descripcionTabulado.info.habilitar=!fila.habilitado;
                        tabuladoHtmlYDescripcion.descripcionTabulado.info.cortante_orig=fila.cortante_orig;
                        var validationButton=html.button({id:'validacion-tabulado',type:'button','more-info':JSON.stringify(tabuladoHtmlYDescripcion.descripcionTabulado.info)},'Validar tabulado')
                        var habilitationButton=html.button({id:'habilitacion-tabulado',type:'button','more-info':JSON.stringify(tabuladoHtmlYDescripcion.descripcionTabulado.info)}/*,bb*/);
                        be.anniosCortantes(client,annios,anniosA,indicador).then(function(){
                            anniosLinks=anniosA.map(function(annioAElegir){
                                var href='/sigba/'+urlYClasesTabulados+'-indicador?annio='+annioAElegir+'&indicador='+indicador+
                                '&cortante='+cortante;
                                return html.span([
                                    html.a({class:'annio-cortante-posible',href:href,'menu-item-selected':annioAElegir==annio},annioAElegir),
                                ]);
                            }).concat(
                                html.span([
                                    html.a({class:'annio-cortante-posible',href:'/sigba/'+urlYClasesTabulados+'-indicador?indicador='+indicador,'menu-item-selected':annio?false:true},'Serie')
                                ])
                            );
                        }).then(function(){
                            var skin=be.config['client-setup'].skin;
                            var skinUrl=(skin?skin+'/':'');
                            var pantalla=html.div({id:'total-layout','menu-type':'hidden'},[
                                be.encabezado(skinUrl,false,req),
                                html.div({class:'annios-links-container',id:'annios-links'},[
                                    html.div({id:'barra-annios'},anniosLinks),
                                    html.div({id:'link-signos-convencionales'},[html.a({id:'signos_convencionales-link',href:'/sigba/principal-signos_convencionales'},'Signos convencionales')])
                                ]),
                                html.div({class:'div-pantallas',id:'div-pantalla-izquierda'},[
                                    html.h2('Tabulados'),
                                    html.table({id:'tabla-izquierda'},trCortantes)]),
                                html.div({class:'div-pantallas',id:'div-pantalla-derecha'},[
                                    html.h2({class:'tabulado-descripcion'},annio),
                                    fila.habilitado?html.div({id:'tabulado-html','para-graficador':JSON.stringify(tabuladoHtmlYDescripcion.matrix)},[tabuladoHtmlYDescripcion.tabuladoHtml]):null,                                    
                                    esAdmin?html.div([
                                        validationButton,
                                        habilitationButton
                                    ]):null,
                                    html.div({class:'tabulado-descripcion',id:'tabulado-descripcion-um'},[
                                        fila.habilitado?html.span({id:"tabulado-um"},"Unidad de Medida: "):null,
                                        fila.habilitado?html.span({id:"tabulado-um-descripcion"},tabuladoHtmlYDescripcion.descripcionTabulado.um_denominacion):null
                                    ]),
                                    html.div({class:'tabulado-descripcion',id:'tabulado-descripcion-nota'},[
                                        (fila.habilitado&&tabuladoHtmlYDescripcion.descripcionTabulado.nota_pie)?html.span({id:"nota-porcentaje-label"},'Nota: '):null,
                                        (fila.habilitado&&tabuladoHtmlYDescripcion.descripcionTabulado.nota_pie)?html.span({id:"nota-porcentaje"},tabuladoHtmlYDescripcion.descripcionTabulado.nota_pie):null,
                                    ]),
                                    html.div({class:'tabulado-descripcion',id:'tabulado-descripcion-fuente'},[
                                        fila.habilitado?html.span({id:"tabulado-fuente"},'Fuente: '):null,
                                        fila.habilitado?html.span({id:"tabulado-fuente-descripcion"},tabuladoHtmlYDescripcion.descripcionTabulado.fuente):null,
                                    ]),
                                ])
                            ]);
                            var pagina=html.html([
                                be.headSigba(false,req,descripcionTabulado.indicador),
                                html.body([pantalla])
                            ]);
                            res.send(pagina.toHtmlText({pretty:true}));
                            res.end();
                        })
                    });
                });
            }).catch(MiniTools.serveErr(req,res)).then(function(){
                if(client){
                    client.done();
                }
            });
        });
        mainApp.get(baseUrl+'/principal', function(req,res){
            var annios={};
            var anniosA=[];
            var client;
            return be.getDbClient(req).then(function(cli){
                client=cli;
                return be.anniosCortantes(client,annios,anniosA).then(function(){
                    return be.reporteBonito(client,[{
                        tabla:"agrupacion_principal",
                        camposAMostrar:["denominacion"],
                        joinSiguiente:["agrupacion_principal"],
                        color:true,
                        condicion: ['ocultar IS NOT TRUE']
                    },{
                        tabla:"dimension",
                        camposAMostrar:["denominacion"],
                        joinSiguiente:["dimension"],
                    },{
                        tabla:"indicadores",
                        camposAMostrar:["denominacion"],
                        mostrarIndicadoresYLinks:true
                    }], annios,'ocultar IS NOT TRUE');
                });
            }).then(function(listaDeTr){
                var skin=be.config['client-setup'].skin;
                var skinUrl=(skin?skin+'/':'');
                var htmlTag=html.html([
                    be.headSigba(false,req,'Indicadores'),
                    html.body([
                        html.div({id:'total-layout', 'menu-type':'hidden'},[
                            be.encabezado(skinUrl,true,req),
                            html.div({id:'div-encabezado-titutlo-tabulado',class:'titulo-tabulados'},[
                                html.div({id:'indicadores-titulo',class:'titulo-tabulados'},'Indicadores'),
                                html.div({id:'titulo-signos_convencionales',class:'titulo-tabulados'},[html.a({id:'signos_convencionales-link',href:'/sigba/principal-signos_convencionales'},'Signos convencionales')])
                            ]),
                            html.table({class:'tabla-inicio'},[
                                html.thead([
                                    html.tr([
                                        html.th(""),
                                        html.th({class:'head-inicio',style:"text-align:left" },"Agrupacion Principal"),
                                        html.th({class:'head-inicio',style:"text-align:left" },"Dimensión"),
                                        html.th({class:'head-inicio',style:"text-align:left" },"Indicador"),
                                        html.th({class:'head-inicio',style:"text-align:right"},"año"),
                                    ].concat(
                                        anniosA.map(function(annio){
                                            return html.th(annio);
                                        })
                                    ))
                                ]),
                                html.tbody(listaDeTr)
                            ])
                        ])
                    ])
                ]);
                res.send(
                    htmlTag.toHtmlText({pretty:true})
                );
                res.end();
            }).catch(MiniTools.serveErr(req,res)).then(function(){
                client.done();
            });
        });
        mainApp.get(baseUrl+'/principal-info-indicador', function(req,res){
            var indicador=req.query.indicador;
            return be.getDbClient(req).then(function(cli){
                var skin=be.config['client-setup'].skin;
                var skinUrl=(skin?skin+'/':'');
                var client=cli;
                var filasDeVariablesPrincipales={};
                var variablePrincipal={};
                var infoIndicador={};
                return client.query(
                    "SELECT i.dimension,i.indicador,i.denominacion,i.def_con,i.def_ope,i.cob,i.desagregaciones,i.uso_alc_lim,i.universo, v.variable variable_principal, "+
                           "f.denominacion fte,u.denominacion um "+
                        "FROM indicadores i LEFT JOIN fte f ON i.fte=f.fte LEFT JOIN um u ON u.um=i.um LEFT JOIN variables v ON i.variable_principal=v.variable "+
                        "WHERE i.indicador=$1 ORDER BY i.indicador,i.dimension",[indicador]
                ).fetchOneRowIfExists().then(function(result){
                    infoIndicador=result.row||{};
                    variablePrincipal=infoIndicador.variable_principal;
                }).then(function(){
                    if(variablePrincipal){
                        return client.query(
                            "select denominacion, descripcion from cortes c WHERE c.variable = '"+variablePrincipal+"' ORDER BY orden"
                        ).fetchAll().then(function(result){
                            filasDeVariablesPrincipales=result.rows;
                            return filasDeVariablesPrincipales;
                        })
                    }else{
                        return [];
                    }
                }).then(function(filasDeVariablesPrincipales){
                    var camposAFicha=['denominacion','def_con','def_ope','um','universo','cob','fte'];
                    var camposLabels=['Nombre del indicador','Definición conceptual','Definición operativa','Unidad de medida','Universo','Cobertura','Fuente'];
                    var objetosCamposDef={};
                    camposAFicha.forEach(function(campo,icampo){
                        objetosCamposDef[campo]={
                            label:camposLabels[icampo], 
                            value:infoIndicador[camposAFicha[icampo]],
                            variablePrincipal:filasDeVariablesPrincipales,
                            tienePrinc:(campo=='def_con')?true:false
                        }
                    });
                    var arrayCamposDef=[];
                    for(var elemento in objetosCamposDef){
                        arrayCamposDef.push(objetosCamposDef[elemento])
                    }
                    var tablaVariablesPrincipales=html.table({id:'tabla-var-princ-id',class:'tabla-var-princ-class'},
                        filasDeVariablesPrincipales.map(function(variable){
                            return html.tr({class:'fila-variables-princ-tr'},[
                                html.td({class:'fila-variables-princ-td'},[
                                    html.span({class:'span-var-princ',id:'denominacion-var-princ-id'},variable.denominacion+': '),
                                    html.span({class:'span-var-princ',id:'descripcion-var-princ-id'},variable.descripcion)
                                ])
                            ])
                        })
                    )
                    var tablaFicha=html.table({id:'info-ind-dim'},
                        arrayCamposDef.map(function(campoDef){
                            return html.tr({class:'fila-info-ind-dim'},[
                                campoDef.value?html.td({class:'ficha-label'},[campoDef.label]):null,
                                campoDef.value?html.td({class:'ficha-value'},[
                                    html.div({id:'info-ind-ficha-div'},[
                                        html.div({class:'fila-info-ind-dim',id:'fila-info-ind-dim-id'},campoDef.value),
                                        campoDef.tienePrinc?tablaVariablesPrincipales:null
                                    ])
                                ]):null
                            ])
                        })
                    );
                    var paginaInfoIndicador=html.html([
                        be.headSigba(false,req,'Ficha técnica'),
                        html.body([
                            html.div({id:'total-layout', 'menu-type':'hidden'},[
                                be.encabezado(skinUrl,false,req),
                                tablaFicha
                            ])
                        ])
                    ]);
                    res.send(paginaInfoIndicador.toHtmlText({pretty:true}));
                    res.end();
                    
                }).catch(MiniTools.serveErr(req,res)).then(function(){client.done()});
            })
        });
        mainApp.get(baseUrl+'/principal-ley-agrupacion_principal', function(req,res){
            var agrupacion_principal=req.query.agrupacion_principal;
            var skin=be.config['client-setup'].skin;
            var skinUrl=(skin?skin+'/':'');
            return be.getDbClient(req).then(function(cli){
                var client=cli;
                return client.query(`SELECT denominacion,leyes FROM agrupacion_principal WHERE agrupacion_principal=$1`,[agrupacion_principal]).fetchOneRowIfExists().then(function(result){
                    var arregloLeyes=result.row.leyes.split('; ');
                    var paginaLey=html.html([
                        be.headSigba(false,req,'Leyes'),
                        html.body([
                            html.div({id:'total-layout','menu-type':'hidden'},[
                                be.encabezado(skinUrl,false,req),
                                html.h2({id:'agrupacion_principal_'+agrupacion_principal},result.row.denominacion),
                                html.div({id:'ley_agrupacion_principal_'+agrupacion_principal},
                                    arregloLeyes.map(function(ley){
                                        return html.div({class:'leyes'},ley);
                                    })
                                )
                            ])
                        ])
                    ]);
                    res.send(paginaLey.toHtmlText({pretty:true}));
                    res.end();
                }).catch(MiniTools.serveErr(req,res)).then(function(){client.done()});
            })
        });
        mainApp.get(baseUrl+'/principal-signos_convencionales',function(req,res){
            return be.getDbClient(req).then(function(cli){
                var client=cli;
                var skin=be.config['client-setup'].skin;
                var skinUrl=(skin?skin+'/':'');
                return client.query(`SELECT signo,denominacion,orden FROM signos_convencionales ORDER BY orden`).fetchAll().then(function(result){
                    var filasSignos=result.rows;
                    var pantalla=html.html([
                        be.headSigba(false,req,'Signos convencionales'),
                        html.body([
                            be.encabezado(skinUrl,false,req),
                            html.div({id:'total-layout','menu-type':'hidden'},[
                                html.table({id:'tabla-signos_convencionales',class:'signos-convencionales-encabezado'},[
                                    html.caption({id:'caption-signos_convencionales',class:'signos-convencionales-encabezado'},'SIGNOS CONVENCIONALES'),
                                    html.thead({id:'thead-signos_convencionales',class:'signos-convencionales-encabezado'},[
                                        html.tr({id:'thead-tr-signos_convencionales',class:'signos-convencionales-encabezado'},[
                                            html.th({id:'th-signo',class:'signos_convencionales-encabezado'},'Signo'),
                                            html.th({id:'th-dnominacion',class:'signos_convencionales-encabezado'},'Descripción')
                                        ])
                                    ]),
                                    html.tbody({id:'tbody-signos-convencionales'},
                                        filasSignos.map(function(filaSigno){
                                            return html.tr({class:'fila-signos_convencionales'},[
                                                html.td({class:'td-signos_convencionales'},[filaSigno.signo]),
                                                html.td({class:'td-signos_convencionales'},[filaSigno.denominacion]),
                                            ])
                                        })
                                    )
                                ])
                            ])
                        ])
                    ])
                    res.send(pantalla.toHtmlText({pretty:true}));
                    res.end();
                }).catch(MiniTools.serveErr(req,res)).then(function(){client.done()});
            })
        })
    }
    encabezado(skinUrl,esPrincipal,req){
        var paraIdOClase=esPrincipal?'':'-chico';
        return html.div({id:'id-encabezado'+paraIdOClase,'volver-a-home':true},[
            html.div({class:'encabezado'+paraIdOClase,id:'div-logo'+paraIdOClase,'volver-a-home':true},[
                html.div({class:'encabezado'+paraIdOClase,id:'div-img-logo'+paraIdOClase,'volver-a-home':true},[
                    html.img({class:'encabezado'+paraIdOClase,id:'img-logo'+paraIdOClase, src:skinUrl+'img/img-logo.png','volver-a-home':true})
                ]),
                html.div({id:'textos'+paraIdOClase,'volver-a-home':true},[
                    esPrincipal?html.div({id:'texto-encabezado-grande','volver-a-home':true}):null,
                    html.div({class:'encabezado',id:'estadistica-consejo'+paraIdOClase},[
                        html.img({class:'encabezado'+paraIdOClase,id:'logo-consejo'+paraIdOClase, src:skinUrl+'img/img-logo-consejo.png','volver-a-home':true}),
                        html.img({id:'logo-estadistica'+paraIdOClase,class:'encabezado', src:skinUrl+'img/img-logo-estadistica.png','volver-a-home':true}),
                    ]),
                    !esPrincipal?html.div({id:'texto-encabezado-chico','volver-a-home':true}):null,
                ])
            ])
        ]);
    }
    getMenu(context){
        return {menu:[
            {menuType:'menu', name:'Variables de Indicadores', menuContent:[
                {menuType:'table', name:'fte'             , label:'Fuente de datos '                      },
                {menuType:'table', name:'um'              , label:'Unidad de medida'                      },
                {menuType:'table', name:'cv'              , label:'Coeficientes de variación'             },
                {menuType:'table'    , name:'Cortes'                  , table:'cortes'               },
            ]},
            {menuType:'table'    , name:'Cobertura de indicadores', table:'indicador_annio'      },
            {menuType:'table'    , name:'Agrupacion Principal'                 , table:'agrupacion_principal'              },
            {menuType:'table'    , name:'Dimensión'               , table:'dimension'            },
            {menuType:'table'    , name:'Indicadores'             , table:'indicadores'          },
            {menuType:'table'    , name:'Variables'               , table:'variables'            },
            {menuType:'table'    , name:'Indicadores-Variables'   , table:'indicadores_variables'},
            {menuType:'table'    , name:'Valores'                 , table:'valores'              },
            {menuType:'table'    , name:'Celdas'                  , table:'celdas'               },
            {menuType:'table'    , name:'Cortes-Celdas'           , table:'cortes_celdas'        },
            {menuType:'path'     , name:'Tabulados'               , path:'/principal'            },
            {menuType:'menu'     , name:'Totales'                 , menuContent:[
                {menuType:'calculaTotales' , name:'Calcular totales'},
                {menuType:'table'          , name:'Discrepancias'         , table:'diferencia_totales'},
            ]},
            {menuType:'table'    ,name:'Signos convencionales'   , table:'signos_convencionales'}
        ]}
    }
    getTables(){
        return super.getTables().concat([
            'usuarios',
            'fte',
            'um',
            'cv',
            'indicador_annio',
            'agrupacion_principal',
            'dimension',
            'indicadores',
            'variables',
            'indicadores_variables',
            'valores',
            'cortes',
            'celdas',
            'cortes_celdas',
            'diferencia_totales',
            'signos_convencionales'
        ]);
    }
}

process.on('uncaughtException', function(err){
  console.log("Caught exception:",err);
  console.log(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', function(err){
  console.log("unhandledRejection:",err);
  console.log(err.stack);
});

new AppSIGBA().start();
