"use strict";

module.exports = function(context){
    var puedeEditar = context.user.usu_rol === 'ingresador'  || context.user.usu_rol ==='admin'  || context.user.usu_rol ==='programador';
    return context.be.tableDefAdapt({
        name:'valores',
        editable: puedeEditar,
        fields: [
            {name: 'indicador'     ,               label:'Código indicador'                      , typeName:'text' ,nullable:false},
            {name:'valor'          ,               label:'Valor'                                 , typeName:'text'},
            {name:'cv'             ,               label:'Coeficiente de variación'              , typeName:'text'},
            {name:'num'            ,               label:'Numerador'                             , typeName:'text'},
            {name:'dem'            ,               label:'Denominador'                           , typeName:'text'},
            {name:'annio'          ,isSlicer:true, label:'Año'                                   , typeName:'text'},        
            {name:'sexo'           ,isSlicer:true, label:'Sexo'                                                            , typeName:'text'},
            {name:'t_a_par'        ,isSlicer:true, label:'Tipo de atención en el parto'                                    , typeName:'text'},
            {name:'s_jefe'         ,isSlicer:true, label:'Sexo del jefe'                                                   , typeName:'text'},
            {name:'s_gest'         ,isSlicer:true, label:'Sector de gestión'                                               , typeName:'text'},
            {name:'cat_ocup'       ,isSlicer:true, label:'Categoría ocupacional'                                           , typeName:'text'},
            {name:'n_instruc'      ,isSlicer:true, label:'Nivel de Instrucción alcanzado'                                  , typeName:'text'},
            {name:'prec_lab'       ,isSlicer:true, label:'Precariedad laboral'                                             , typeName:'text'},
            {name:'calif_tarea'    ,isSlicer:true, label:'Calificación de la tarea'                                        , typeName:'text'},
            {name:'l_residen'      ,isSlicer:true, label:'Lugar de residencia'                                             , typeName:'text'},
            {name:'t_hog'          ,isSlicer:true, label:'Tipo de hogar'                                                   , typeName:'text'},
            {name:'sit_conv_dm'    ,isSlicer:true, label:'Situación de convivencia de la madre'                            , typeName:'text'},
            {name:'peri'           ,isSlicer:true, label:'Período'                                                         , typeName:'text'},
            {name:'l_ocu'          ,isSlicer:true, label:'Local de ocurrencia'                                             , typeName:'text'},
            {name:'n_ens'          ,isSlicer:true, label:'Nivel de enseñanza'                                              , typeName:'text'},
            {name:'jer_ocup'       ,isSlicer:true, label:'Jerarquia ocupacional'                                           , typeName:'text'},
            {name:'ringr_ctotcaba' ,isSlicer:true, label:'Relación ingresos - Canasta Total de la Ciudad de Buenos Aires'  , typeName:'text'},
            {name:'desagr'         ,isSlicer:true, label:'Desagregación territorial'                                       , typeName:'text'},
            {name:'t_viol_obs'     ,isSlicer:true, label:'Tipo de violencia observada'                                     , typeName:'text'},
            {name:'calif_ocup'     ,isSlicer:true, label:'Calificación ocupacional'                                        , typeName:'text'},
            {name:'c_labor'        ,isSlicer:true, label:'Condición laboral'                                               , typeName:'text'},
            {name:'r_ten_viv'      ,isSlicer:true, label:'Regimen de tenencia de la vivienda'                              , typeName:'text'},
            {name:'dom'            ,isSlicer:true, label:'Dominio'                                                         , typeName:'text'},
            {name:'g_edad'         ,isSlicer:true, label:'Grupo de Edad (en años)'                                         , typeName:'text'},
            {name:'edad'           ,isSlicer:true, label:'Edad '                                                           , typeName:'text'},
            {name:'reg_seg_soc'    ,isSlicer:true, label:'Registro en la seguridad social'                                 , typeName:'text'},
            {name:'c_asist'        ,isSlicer:true, label:'Condición de asistencia escolar'                                 , typeName:'text'},
            {name:'quin_ingr_fliar',isSlicer:true, label:'Quintil de ingreso per cápita familiar'                          , typeName:'text'},
            {name:'l_nac'          ,isSlicer:true, label:'Lugar de nacimiento'                                             , typeName:'text'},
            {name:'t_cob_sal'      ,isSlicer:true, label:'Tipo de cobertura de salud'                                      , typeName:'text'},
            {name:'c_activ'        ,isSlicer:true, label:'Condición de actividad'                                          , typeName:'text'},
            {name:'t_activ'        ,isSlicer:true, label:'Tipo de actividad'                                               , typeName:'text'},
            {name:'t_pres'         ,isSlicer:true, label:'T_PRES'                                                          , typeName:'text'},
            {name:'fte_ingr'       ,isSlicer:true, label:'Fuente de ingreso'                                               , typeName:'text'},
            {name:'g_g_activ'      ,isSlicer:true, label:'Grandes grupos de actividad'                                     , typeName:'text'},
            {name:'cortes'         ,isSlicer:true, label:'Cortes'                                , typeName:'jsonb', allow:{select: true,insert:false, update:false}},
            {name:'cortantes'      ,isSlicer:true, label:'Cortantes'                             , typeName:'jsonb', allow:{select: true,insert:false, update:false}},
            {name:'usu_validacion'                                                               , typeName:'text' , allow:{select: true,insert:false, update:false}},
            {name:'fecha_validacion'                                                             , typeName:'timestamp', allow:{select: true,insert:false, update:false}},
            {name:'origen_validacion'                                                            , typeName:'text'     , allow:{select: true,insert:false, update:false}},
            {name:'es_automatico'                                                                , typeName:'boolean'  , allow:{select: true,insert:false, update:false}}
        ],
        slicerField:'cortes',
        primaryKey:['indicador','cortes'], // poner acá el autonumérico
        foreignKeys:[
            {references:'indicadores'      , fields:['indicador']},
        ]
    },context);
}