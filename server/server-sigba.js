"use strict";

/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

// APP

var Path = require('path');

var absolutePath = '';

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
            str = value===null?'':value.toString();
        }
       return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    // FALTA IMPLEMENTAR ESTO
    nombreDelHome(client){
        return Promise.resolve([]).then(function(){return 'principal';});
        return  client.query(
            'SELECT nombre_home FROM parametros;'
        ).fetchOneRowIfExists().then(function(result){
            //var nombreHome=(result.row && result.row.nombre_home)||'principal';
            return 'principal';
        });
    }
    
    reporteBonito(client, defTables, annios, where,color) {
//        var urlYClasesTabulados='principal';
        var urlYClasesTabulados;
        if(!defTables.length){
            return Promise.resolve([]);
        }
        var table=defTables[0].tabla;
        var be = this;
        return be.nombreDelHome(client).then(function(homeName){
            urlYClasesTabulados=homeName;
            return client.query(
                'SELECT * FROM '+be.db.quoteObject(table)+
                ' WHERE '+(where||'true')+
                ' ORDER BY '+(defTables[0].orderBy||["orden", "denominacion"]).map(function(campoOrden){ return be.db.quoteObject(campoOrden); }).join(',')
            ).fetchAll();
        }).then(function(result){
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
                            FROM celdas 
                            WHERE indicador=$1`
                            ,[registro.indicador]
                    ).fetchOneRowIfExists().then(function(resultCortantes){
                        result=resultCortantes;
                        return client.query(`
                        SELECT i.dimension,i.indicador,i.denominacion,i.def_con,i.def_ope,i.cob,i.desagregaciones,i.uso_alc_lim,i.universo,i.metas,f.denominacion fte,u.denominacion um
                            FROM indicadores i LEFT JOIN fte f ON i.fte=f.fte LEFT JOIN um u ON u.um=i.um
                            WHERE i.indicador=$1
                            ORDER BY i.indicador,i.dimension
                        `,[registro.indicador]).fetchOneRowIfExists().then(function(resultado){
                            registro.ficha=resultado.row;
                    })}).then(function(){
                        listaTd=[html.td({class:'td-'+urlYClasesTabulados+'-renglones',colspan:4-defTables.length},[html.div({class:'espacio-reserva'},'-')])].concat(
                            defTables[0].camposAMostrar.map(function(nombreCampo,i){
                                var id=registro[defTables[0].campoId];
                                var attributes={colspan:i?1:defTables.length+1,class:'campo_'+nombreCampo};
                                var skin=be.config['client-setup'].skin;
                                var skinUrl=(skin?skin+'/':'');
                                if(registro.indicador ){
                                    attributes.id=id;
                                    if(registro.def_con){
                                        attributes.title=registro.def_con;
                                    }
                                    var informacionIndicador=html.span({id:'ficha_'+registro.indicador,class:'info-indicador','ficha-indicador':JSON.stringify(registro.ficha)},[
                                        html.a({class:'link-info-indicador',href:''+absolutePath+''+urlYClasesTabulados+'-info-indicador?indicador='+registro.indicador,title:'Ficha técnica'},[
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
                                            html.a({class:'link-ley-agrupacion_principal',href:''+absolutePath+''+urlYClasesTabulados+'-ley-agrupacion_principal?agrupacion_principal='+registro.agrupacion_principal,title:'Leyes'},[
                                                html.img({class:'img-ley-agrupacion_principal', src:skinUrl+'img/img-ley-agrupacion_principal.png'})
                                            ])
                                        ]);
                                    }
                                }
                                var sufijoTab=defTables[0].tabla||'';
                                var htmlIcono= html.span({class:'span-img-icono'+sufijoTab},
                                    registro.icono?html.img({class:'img-icono-'+sufijoTab,src:skinUrl+'img/'+registro.icono}):null);
                                var htmlA={href:''+absolutePath+''+urlYClasesTabulados+'-indicador?indicador='+(registro.indicador||''),class:'es-link' ,'cant-cortantes':result.row.cant_cortantes};
                            return html.td(attributes,[
                                    htmlIcono,
                                    html.span({id:id, class:'ancla'},"\u00a0"),
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
                                    var aAtribute={class:'link-cortantes',href:''+absolutePath+''+urlYClasesTabulados+'-indicador?annio='+annioRow+'&indicador='+(registro.indicador||'')};
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
                                        var aAttributes={class:'link-cortantes',href:''+absolutePath+''+urlYClasesTabulados+'-indicador?annio='+annioRow+'&indicador='+(registro.indicador||'')}
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
                    cortantes: fila.cortantes,
                    annioCortante:annio?annio:'TRUE',
                    cuadro:fila.cuadro,
                    grafico:fila.grafico,
                    tipo_grafico:fila.tipo_grafico,
                    orientacion:fila.orientacion
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
                    be.defs_annio(annio).f_param_cortantes_posibles([indicador,fila.cortantes,annio])
                ).fetchAll();
            }).then(function(result){
                //Si el annio está fijo lo quito de las variables
                datum.list=result.rows;
                //datum.list=annio?result.rows.map(function(row){delete row.annio;return row;}):result.rows;
                datum.vars.push({name:'valor', place:'data'});
                datum.vars.push({name:'cv', place:'data'});
                datum.list.forEach(function(row){
                    if(row.desagr=='tcaba'){
                        row.desagr=null;
                    }
                })
                //falta testear! sacar annio si viene como parametro
                //datum.vars=annio?datum.vars.filter(function(variable){if(variable.name !=='annio'){return variable}}):datum.vars;
                //console.log('------------'+ stringify(datum.vars));
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
            { type: 'js', module: 'best-globals', path:'best-globals'},
            { type: 'js', module: 'require-bro'},
            { type: 'js', module: 'codenautas-xlsx', modPath: 'dist', file:'xlsx.full.min.js'},
            { type: 'js', module: 'like-ar' },
            { type: 'js', module: 'file-saver' },
            { type: 'js', module: 'js-to-html' },
            { type: 'js', module: 'tabulator', path:'tabulator'},
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
    mostrarError(admin,mensajeError,res){
        return res.send(html.div(admin?mensajeError:'').toHtmlText({pretty:true}));
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
            //var respuestas=
            return be.getDbClient(req).then(function(cli){
                var esAdmin=be.esAdminSigba(req);
                var usuarioRevisor=false; // true si tiene permiso de revisor
                client=cli;
                var queryStr=
                    "select c.cor cortantes , count(*) as cantidad_cortantes,c.count,c.var arr_cortantes from ( "+
                        "select cortantes cor,jsonb_object_keys(cortantes) cor_keys,count(*),ARRAY(select jsonb_object_keys(cortantes)) var  "+
                        "from celdas where indicador=$1 group by cortantes "+
                    ") c group by cortantes, c.count,arr_cortantes order by cortantes"
                return client.query(queryStr, [indicador]).fetchAll().then(function(result){
                    var tabuladosPorIndicador=result.rows;
                        tabuladosPorIndicador.forEach(function(tabuladoPorIndicador){
                            tabuladoPorIndicador.indicador=indicador;
                        });
                    return Promise.all(result.rows.map(function(tabulado){
                        return client.query(
                        "select string_agg(v.denominacion,'|' ORDER BY v.orden, v.variable) as denominacion, "+
                            "string_agg(iv.variable, ',' ORDER BY v.orden, v.variable) AS variables, "+
                            "min(v.orden) AS orden, "+
                            "string_agg( iv.variable ,',' ORDER BY iv.ubicacion,iv.orden, iv.variable) AS var_ordfilcol, "+
                            "string_agg(v.denominacion,'|' ORDER BY iv.ubicacion,iv.orden, iv.variable) as var_denomfilcol, "+
                            "string_agg( iv.ubicacion,',' ORDER BY iv.ubicacion,iv.orden, iv.variable) AS var_ubifilcol, "+
                            "count(iv.ubicacion) AS cant_filcol , "+
                            "coalesce(string_agg(iv.variable::text||'-'||v.orden::text||'-'||v.variable::text, ',' "+
                                "ORDER BY v.orden, v.variable),'/')||'--'|| "+
                            "coalesce(string_agg( iv.ubicacion||'-'||iv.orden||'-'||iv.variable ,',' "+
                                "ORDER BY iv.ubicacion,iv.orden, iv.variable),'/') AS variables_info "+
                          "from indicadores_variables iv left join variables v on iv.variable=v.variable "+
                          "where iv.indicador=$1 and iv.variable in ("+tabulado.arr_cortantes.map(function(cortante){return "'"+cortante+"'"}).join(',')+")",
                        [indicador]).fetchAll().then(function(result){
                            result.rows.forEach(function(rowInfo){
                                tabulado.variables_info=rowInfo.variables_info;
                                tabulado.denominacion=(rowInfo.cant_filcol==tabulado.cantidad_cortantes)?
                                    rowInfo.var_denomfilcol:rowInfo.denominacion;
                                tabulado.variables=(rowInfo.cant_filcol==tabulado.cantidad_cortantes)?
                                    rowInfo.var_ordfilcol:rowInfo.variables;
                                tabulado.orden=rowInfo.orden;
                                tabulado.ubicacion=(rowInfo.cant_filcol==tabulado.cantidad_cortantes)?rowInfo.var_ubifilcol:'';
                                tabulado.cant_filcol=rowInfo.cant_filcol;
                            })
                           return tabulado;
                        }).then(function(tabulado){
                            return client.query(
                                "SELECT habilitado,mostrar_cuadro cuadro,mostrar_grafico grafico, tipo_grafico,orientacion "+
                                  "FROM tabulados WHERE indicador=$1 AND cortantes=$2"
                            ,[indicador,tabulado.cortantes]).fetchAll().then(function(result){
                                var caracteristicasTabulado=result.rows;
                                caracteristicasTabulado.forEach(function(caracteristica){
                                    tabulado.habilitado=caracteristica.habilitado;
                                    tabulado.cuadro=caracteristica.cuadro;
                                    tabulado.grafico=caracteristica.grafico;
                                    tabulado.tipo_grafico=caracteristica.tipo_grafico;
                                    tabulado.orientacion=caracteristica.orientacion;
                                })
                                return tabulado;
                            })
                        });
                    })).then(function(){
                        var cortantesPosibles = tabuladosPorIndicador.filter(row => (row.habilitado || esAdmin));
                        if (cortantesPosibles.length > 1){
                            cortantesPosibles = cortantesPosibles.filter(row => row.variables != 'annio');
                        }
                        //parametro GET (CSV con todos los cortantes que hay que mostrar, lo cual define un tabulado) //cortantes por defecto son las del primer tabulado
                        var cortante = !req.query.cortante?cortantesPosibles[0].variables:req.query.cortante;
                        // tabulado que se va as mostrar
                        var fila = cortantesPosibles.filter(tabulado => tabulado.variables == cortante)[0];
                        var descripcionTabulado={};
                        return be.armarUnTabulado(client, fila, annio, indicador,descripcionTabulado).then(function(tabuladoHtmlYDescripcion){
                            var trCortantes=cortantesPosibles.map(function(cortanteAElegir){
                                var denominaciones=cortanteAElegir.denominacion.split('|');
                                annio?denominaciones.splice(cortanteAElegir.variables.split(',').indexOf('annio'),1):true;
                                var href=''+absolutePath+''+urlYClasesTabulados+'-indicador?'+(annio?'annio='+annio+'&':'')+'indicador='+indicador+'&cortante='+cortanteAElegir.variables;
                                return html.tr({class:'tr-cortante-posible','esta-habilitado':cortanteAElegir.habilitado?'si':'no'},[
                                    html.td({class:'td-cortante-posible', 'menu-item-selected':cortanteAElegir.variables==cortante},[
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
                                    var href=''+absolutePath+''+urlYClasesTabulados+'-indicador?annio='+annioAElegir+'&indicador='+indicador+
                                    '&cortante='+cortante;
                                    return html.span([
                                        html.a({class:'annio-cortante-posible',href:href,'menu-item-selected':annioAElegir==annio},annioAElegir),
                                    ]);
                                }).concat(
                                    html.span([
                                        html.a({class:'annio-cortante-posible',href:''+absolutePath+''+urlYClasesTabulados+'-indicador?indicador='+indicador,'menu-item-selected':annio?false:true},'Serie')
                                    ])
                                );
                            }).then(function(){
                                var skin=be.config['client-setup'].skin;
                                var skinUrl=(skin?skin+'/':'');
                                var pantalla=html.div({id:'total-layout','menu-type':'hidden'},[
                                    be.encabezado(skinUrl,false,req),
                                    html.div({class:'annios-links-container',id:'annios-links'},[
                                        html.div({id:'barra-annios'},anniosLinks),
                                        html.div({id:'link-signos-convencionales'},[html.a({id:'signos_convencionales-link',href:''+absolutePath+'principal-signos_convencionales'},'Signos convencionales')])
                                    ]),
                                    html.table({class:'tabla-links-tabulado-grafico'},[
                                    html.tr({class:'tr-links-tabulado-grafico'},[
                                        html.td({class:'td-links'},[
                                            html.div({class:'div-pantallas',id:'div-pantalla-izquierda'},[
                                                html.h2('Tabulados'),
                                                html.table({id:'tabla-izquierda'},trCortantes)
                                            ]),
                                        ]),
                                        html.td({class:'td-tabulado-grafico'},[
                                            html.div({class:'div-pantallas',id:'div-pantalla-derecha'},[
                                                html.h2({class:'tabulado-descripcion'},[
                                                    html.div({class:'tabulado-descripcion-annio'},annio),
                                                    html.div({class:'botones-tabulado-descripcion'})
                                                ]),
                                                ((fila.habilitado) || esAdmin)?html.div({
                                                    id:'tabulado-html',
                                                    'para-graficador':JSON.stringify(tabuladoHtmlYDescripcion.matrix),
                                                    'info-tabulado':JSON.stringify(tabuladoHtmlYDescripcion.descripcionTabulado.info)
                                                },[tabuladoHtmlYDescripcion.tabuladoHtml]):null,
                                                esAdmin?html.div([
                                                    validationButton,
                                                    habilitationButton
                                                ]):null,
                                                html.div({class:'tabulado-descripcion',id:'tabulado-descripcion-um'},[
                                                    (fila.habilitado || esAdmin)?html.span({id:"tabulado-um"},"Unidad de Medida: "):null,
                                                    (fila.habilitado || esAdmin)?html.span({id:"tabulado-um-descripcion"},tabuladoHtmlYDescripcion.descripcionTabulado.um_denominacion):null
                                                ]),
                                                html.div({class:'tabulado-descripcion',id:'tabulado-descripcion-nota'},[
                                                    ((fila.habilitado || esAdmin)&&tabuladoHtmlYDescripcion.descripcionTabulado.nota_pie)?html.span({id:"nota-porcentaje-label"},'Nota: '):null,
                                                    ((fila.habilitado || esAdmin)&&tabuladoHtmlYDescripcion.descripcionTabulado.nota_pie)?html.span({id:"nota-porcentaje"},tabuladoHtmlYDescripcion.descripcionTabulado.nota_pie):null,
                                                ]),
                                                html.div({class:'tabulado-descripcion',id:'tabulado-descripcion-fuente'},[
                                                    (fila.habilitado || esAdmin)?html.span({id:"tabulado-fuente"},'Fuente: '):null,
                                                    (fila.habilitado || esAdmin)?html.span({id:"tabulado-fuente-descripcion"},tabuladoHtmlYDescripcion.descripcionTabulado.fuente):null,
                                                ]),
                                            ])
                                        ])
                                    ])
                                ])
                                ]);
                                var pagina=html.html([
                                    be.headSigba(false,req,descripcionTabulado.indicador),
                                    html.body([pantalla,be.foot(skinUrl)])
                                ]);
                                res.send(pagina.toHtmlText({pretty:true}));
                                res.end();
                            })
                        });
                    })
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
                        campoId:"agrupacion_principal",
                        camposAMostrar:["denominacion"],
                        joinSiguiente:["agrupacion_principal"],
                        color:true,
                        condicion: ['ocultar IS NOT TRUE']
                    },{
                        tabla:"dimension",
                        campoId:"dimension",
                        camposAMostrar:["denominacion"],
                        joinSiguiente:["dimension"],
                        condicion: ['ocultar IS NOT TRUE'],
                    },{
                        tabla:"indicadores",
                        campoId:"indicador",
                        camposAMostrar:["denominacion"],
                        mostrarIndicadoresYLinks:true,
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
                            html.div({id:'div-encabezado-titulo-tabulado',class:'titulo-tabulados'},[
                                html.div({class:'encabezado-interno'},[
                                    html.div({id:'indicadores-titulo',class:'titulo-tabulados'},'Indicadores'),
                                    html.div({id:'titulo-signos_convencionales',class:'titulo-tabulados'},[html.a({id:'signos_convencionales-link',href:''+absolutePath+'principal-signos_convencionales'},'Signos convencionales')]),
                                    html.div({class:'float-clear'},"")
                                ]),
                            ]),
                            html.table({class:'tabla-inicio', id:'tabla-inicio'},[
                                html.thead([
                                    html.tr([
                                        html.th(""),
                                        html.th({class:'head-inicio',style:"text-align:left" },be.config['client-setup'].labels['agrupacion-principal']),
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
                            ]),
                            be.foot(skinUrl)
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
                    "SELECT i.dimension,i.indicador,i.denominacion,i.def_con,i.def_ope,i.cob,i.desagregaciones,i.uso_alc_lim,i.universo, i.metas, v.variable variable_principal, "+
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
                    var camposAFicha=['denominacion','def_con','def_ope','metas','um','universo','cob','fte'];
                    var camposLabels=['Nombre del indicador','Definición conceptual','Definición operativa','Metas','Unidad de medida','Universo','Cobertura','Fuente'];
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
                            ]),
                            be.foot(skinUrl)
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
                                ),
                                be.foot(skinUrl)
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
                                ]),
                                be.foot(skinUrl)
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
        var be = this;
        return html.div({id:'id-encabezado','volver-a-home':true},[
            html.div({class:'encabezado',id:'barra-superior','volver-a-home':true},[
                html.div({class:'encabezado-interno'},[
                    html.img({class:'encabezado',id:'bs-izq',src:skinUrl+'img/logo-ciudad.png','volver-a-home':true}),
                    html.img({class:'encabezado',id:'bs-der',src:skinUrl+'img/logo-BA.png','volver-a-home':true})
                ]),
            ]),
            html.div({class:'encabezado',id:'barra-inferior','volver-a-home':true},[
                html.div({class:'encabezado-interno'},[
                    html.img({class:'encabezado',id:'img-logo',src:skinUrl+'img/img-logo.png','volver-a-home':true}),
                ].concat(be.config['client-setup'].logos.map(function(logoName){
                    return html.img({class:'encabezado',id:'logo-'+logoName,src:skinUrl+'img/img-logo-'+logoName+'.png','volver-a-home':true});
                })).concat([
                    be.config['client-setup'].conTextoPrincipal?html.div({class:'encabezado',id:'texto-encabezado-grande','volver-a-home':true}):null
                ]).concat([html.div(
                    ['logo1','logo2','logo3','logo4','logo5'].map(function(logo){return html.a({class:'autonomia-a'},[html.img({class:'autonomia-img'})])})
                )]))
            ])
        ]);
    }
    foot(skinUrl){
        return html.div({class:'footer',id:'foot'},[
            html.div({class:'footer',id:'foot-div-img'},[html.img({class:'footer',id:'foot-img',src:skinUrl+'img/foot-logo-BA.png'})]),
            html.div({class:'footer',id:'contiene-textos-foot'},[
                html.div({class:'footer',id:'foot-texto'}),
                html.div({class:'footer',id:'foot-texto-2'})
            ])
        ])
    }
    getMenu(context){
        var be = this;
        return {menu:[
            {menuType:'menu', name:'Indicadores', menuContent:[
                {menuType:'table', name:'agrupacion_principal', label:be.config['client-setup'].labels['agrupacion-principal'], },
                {menuType:'table', name:'dimension'       , label:'Dimensión'                             },
                {menuType:'table', name:'indicadores'     , label:'Indicadores'                           },
                {menuType:'table', name:'tabulados'       , label:'Tabulados'                           },
                {menuType:'table', name:'fte'             , label:'Fuente de datos '                      },
                {menuType:'table', name:'um'              , label:'Unidad de medida'                      },
                {menuType:'table', name:'cv'              , label:'Coeficientes de variación'             },
                {menuType:'table', name:'indicador_annio' , label:'Cobertura'                             },
                {menuType:'proc' , name:'alta/tabulados'  , label:'Dar de alta nuevos tabulados'                             },
            ]},
            {menuType:'menu'    , name:'Variables de corte' , menuContent:[
                {menuType:'table', name:'variables'       , label:'Variables'            },
                {menuType:'table', name:'cortes'          , label:'Cortes'                                },
            ]},
            {menuType:'menu'    , name:'Ubicación Variables'   , menuContent:[
                {menuType:'table'    , name:'Indicadores-Variables'   , table:'indicadores_variables'},
                {menuType:'table'    , name:'Tabulados-Variables'     , table:'tabulados_variables'},
            ]},
            
            {menuType:'menu'     , name:'Valores'                 , menuContent:[
                {menuType:'proc', label:'Borrar datos valores', name:'borrar/valores'},
                {menuType:'table'    , name:'Valores'                 , table:'valores'              },
            ]},
            // {menuType:'table'    , name:'Celdas'                  , table:'celdas'               },
            // {menuType:'table'    , name:'Cortes-Celdas'           , table:'cortes_celdas'        },
            {menuType:'path'     , name:'Tabulados'               , path:'/principal'            },
            {menuType:'menu'     , name:'Totales'                 , menuContent:[
                {menuType:'calculaTotales' , name:'Calcular totales'},
                {menuType:'table'          , name:'Discrepancias'         , table:'diferencia_totales'},
            ]},
            {menuType:'menu'     , name:'configuración'                 , menuContent:[
                {menuType:'table'    , name:'signos_convencionales', label:'signos convencionales'},
                //{menuType:'table'    , name:'parametros'           , label:'Parámetros del home'},
                {menuType:'table'    , name:'usuarios'},
            ]},
        ]}
    }
    getTables(){
        return super.getTables().concat([
            //'parametros',
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
            'cortes',
            'valores',
            'celdas',
            'tabulados',
            'cortes_celdas',
            'tabulados_variables',
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
    