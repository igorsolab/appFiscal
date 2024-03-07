const hostname = location.hostname;
const port = location.port;
const user = getUserLogado();
var jnid = getJNID();

function getJNID() {

    let JSESSIONID = document.cookie.split('; ').find(row => row.startsWith('JSESSIONID=')).split('=')[1];
    JSESSIONID = JSESSIONID.split('.');
    JSESSIONID = JSESSIONID[0];
    return JSESSIONID;

}

// função para capturar codigo do usuario logado
function getUserLogado() {

    let userLogado = document.cookie.split('; ').find(row => row.startsWith('userIDLogado=')).split('=')[1];
    return userLogado;

}


function IniciarApp() {
    scriptHTML();
}


function scriptHTML() {
    let tela = $("#exibe");
    // modalLoading()
    tela.append(filtro_fiscal())
}


function filtro_fiscal(){
    let filtro_fiscal = `
        <div class="container d-flex justify-content-center align-items-center w-100" style="height:100vh">
            <div class="col d-flex justify-content-center text-left">
                <div class="card mb-3 card-filtro">
                    <div class="card-header bg-success"><h5>Contribuicao fiscal</h5></div>
                    <div class="card-body">

                        <div class="d-flex flex-column justify-content-center p-3">
                            <div class="col-12 mb-3">
                                <label for="buscar-data">Selecione a data:</label>
                                <input type="month" style="padding:5px;border-radius:7px" class="mt-3 form-control text-left" id="buscar_data" />
                            </div>
                            <div class="col-12">
                                <label for="dropdown-lojas">Selecione a(s) loja(s):</label>
                                ${filtroPorLoja('lojas-item')}
                                <span class="custom-message-alert">* Caso nenhuma loja seja selecionada, ele executara a busca em todas</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button type="submit" onclick="abrirLoading()" id="acao_buscar" style="width:100%;" class="btn btn-success mb-3 mt-3">Buscar</button>
                    </div>
                </div>
            </div>
        </div>
    `

    let tela = $('#exibe')
    tela.empty()
    tela.append(filtro_fiscal);
}

function results_table_fiscal() {
    let buscar_data  = $("#buscar_data");
    let valoresLojas = document.querySelectorAll(".lojas-item:checked");
    let valoresSelecionados = []
    if(valoresLojas.length === 0) {
        let sql = "SELECT CODEMP FROM TSIEMP WHERE CODEMP < 100"
        let todasLojas = getDadosSql(sql,true)
        todasLojas.forEach(loja => {
            valoresSelecionados.push(loja.CODEMP)
        })
    }
    else {
        valoresSelecionados = Array.from(valoresLojas).map(e => e.value);
    }
    // console.log(valoresSelecionados)
    verifica_se_existe(valoresSelecionados, buscar_data.val());
    stopLoading()
}

function verifica_se_existe(lojas,data){
    // console.log(data)
    let dataSplit = data.split('-')
    let mes = dataSplit[1];
    let ano = dataSplit[0];
    lojas.map((loja) => {

        let sql = `SELECT * FROM AD_MOVCONTRIB am WHERE CODEMP = ${loja} AND IDMES = ${mes} AND IDANO = ${ano}`
        // console.log(sql)
        let movimentacao_do_dia = getDadosSql(sql)
        // console.log(movimentacao_do_dia)
        if(movimentacao_do_dia.length === 0) {
            // console.log("Entrei na validação, estou criando no banco o dado para loja "+loja+" do mes: "+mes+" e do ano: "+ano)
            return salvarDados(loja, formatData(data));
        }
        // return console.log("Valor já existe na tabela")
    })
    // console.log(lojas)
    construcao_tabela(lojas,formatData(data))
}


function construcao_tabela(lojas_selecionadas,data) {
    let sql = "SELECT * FROM AD_GRUPOCONTRIB"
    let dadosGrupo = getDadosSql(sql,true)
    let tabela = ""
    
    tabela+= `
        <div class="tabela_contribuicoes" id="tabela_contribuicoes">
        <table class="table table-hover mb-5" id="table_export">
            <thead >
                <tr>    
                    <th class="fixed-table id-table">ID</th>
                    <th class="fixed-table desc-table">Descricao</th>`
                        lojas_selecionadas.forEach((loja) => {
                            tabela+=`<th class="lojas-row">Loja ${loja}</th>`
                        })
        tabela+=`  
                    <th class="lojas-row">Total</th>
                <tr>     
            </thead>`
        // console.log(dadosGrupo)
    dadosGrupo.forEach(grupo => {

        tabela+=`<tr class="title-fixed"><td></td><td class="fixed-table desc-table">${grupo.DESCRICAO}</td>`
        lojas_selecionadas.forEach(e => {
            tabela+="<td></td>"
        })
        tabela+=`</tr>`
        tabela+=`<tbody>`
                    let query = `
                    SELECT 
                        CODIGO,
                        DESCRICAO,`
                        let apresentacaodados = "";
                        lojas_selecionadas.forEach((loja) => {
                             apresentacaodados += ` MAX(VALOR_LOJA${loja}) AS VALOR_LOJA${loja},
                              `
                        })
                        apresentacaodados+="("
                        lojas_selecionadas.forEach((loja) => {
                            apresentacaodados += ` MAX(VALOR_LOJA${loja})+`
                       })
                    query+=apresentacaodados.slice(0,-1);
                    query+=`) AS SOMA_TOTAL
                    FROM (
                        SELECT 
                            sgrp.CODIGO,
                            sgrp.DESCRICAO,`
                        let stringquery = ""
                        lojas_selecionadas.forEach((loja) => {
                            stringquery += ` MAX(CASE WHEN cte.CODEMP = ${loja} THEN cte.VALOR END) AS VALOR_LOJA${loja},`
                        })
        
                        query += stringquery.slice(0,-1)
                        query+= ` FROM 
                            AD_SGRUPOCONTRIB sgrp
                        LEFT JOIN 
                            AD_MOVCONTRIB cte ON sgrp.IDGRP = cte.IDGRP AND sgrp.IDSGRP = cte.IDSGRP
                        WHERE
                            sgrp.IDGRP = ${grupo.IDGRP}
                        AND
                            cte.IDANO = ${data.dataCompleto[1]}
                        AND 
                            cte.IDMES = ${data.dataCompleto[0]}
                        GROUP BY 
                            sgrp.IDGRP, sgrp.IDSGRP, sgrp.CODIGO, sgrp.DESCRICAO
                    ) AS subquery
                    GROUP BY 
                        CODIGO, DESCRICAO
                    ORDER BY 
                        CODIGO, DESCRICAO;
                    `

                    let dados_subgrupo = getDadosSql(query,true)
                    dados_subgrupo.forEach((subgrupo) => {

                    tabela+=`
                        <tr>
                            <td class="fixed-table id-table">${subgrupo.CODIGO}</td>
                            <td class="fixed-table desc-table">${subgrupo.DESCRICAO}</td>
                            `
                    lojas_selecionadas.forEach(loja => {
                        tabela+=`<td class="lojas-row">${subgrupo['VALOR_LOJA'+loja] !== null ? formatarNumero(subgrupo['VALOR_LOJA'+loja]) : "-" }</td>
                        `
                    })
                    tabela+=`
                    <td class="lojas-row">${subgrupo.SOMA_TOTAL === null ? "-" : (formatarNumero(subgrupo.SOMA_TOTAL))}</td>
                    </tr>`
                    });
        tabela+=`
                </tbody>`
    });

    tabela+=`</table></div>`
    // console.log(tabela)

    let tela = $('#exibe')
    tela.empty()
    
    let button_excel = `
        <nav class="navbar fixed-bottom navbar-light bg-light" style="width:100vw!important">
            <div class="container d-flex justify-content-around">
                <input type="button" id="btnExport" class="btn btn-custom-excel" onclick="exportToExcel()" value="Exportar tabela" title="Exportar tabela para excel" />
                <span>Contribuicoes do mes de ${retornaNomeMes(data.dataCompleto[0])} do ano ${data.dataCompleto[1]}</span>
                <a class="btn btn-secondary" onclick="window.location.reload()">Sair</a>
            </div>
        </nav>
            `
    tela.append(button_excel)
    tela.append(tabela);



    // Colocando o id e a descrição fixos

    $(document).ready(function () {
        $(".tabela_contribuicoes table").wrap("<div class='table-wrapper'></div>");
    
        // $(".tabela_contribuicoes table").clone(true).appendTo(".table-wrapper").addClass("clone");
    
        $(".tabela_contribuicoes th").each(function (index) {
        $(this).addClass("original-" + index);
        });
    
        $(".tabela_contribuicoes td").each(function (index) {
        $(this).addClass("original-" + index);
        });
    
        $(".clone th").each(function (index) {
        $(this).addClass("cloned-" + index);
        });
    
        $(".clone td").each(function (index) {
        $(this).addClass("cloned-" + index);
        });
    
        $(".tabela_contribuicoes th, .tabela_contribuicoes td").on("scroll", function () {
        $(".tabela_contribuicoes th, .tabela_contribuicoes .title-fixed").offset({
            left: -1 * $(".tabela_contribuicoes table").scrollLeft(),
        });
        $(".tabela_contribuicoes td").offset({
            left: -1 * $(".tabela_contribuicoes table").scrollLeft(),
        });
        });
    });
}

function exportToExcel(){
    var dt = new Date();
    var day = dt.getDate();
    var month = dt.getMonth() + 1;
    var year = dt.getFullYear();
    var hour = dt.getHours();
    var mins = dt.getMinutes();
    var postfix = day + "." + month + "." + year + "_" + hour + "." + mins;
    //creating a temporary HTML link element (they support setting file names)
    var a = document.createElement('a');
    //getting data from our div that contains the HTML table
    var data_type = 'data:application/vnd.ms-excel;charset=utf-8';
    
    var table_html = $('#table_export')[0].outerHTML;
//    table_html = table_html.replace(/ /g, '%20');
    table_html = table_html.replace(/<tfoot[\s\S.]*tfoot>/gmi, '');
    table_html = table_html.replace(/<tr class="title-fixed"/g, '<tr style="text-align:left;font-size:20pt;background-color:#17683d;color:#fff"');
    table_html = table_html.replace(/class="fixed-table desc-table"/g, 'style="width:1000pt;"');
    
    var css_html = '<style>td {border: 0.5pt solid #c0c0c0} .lojas-row { text-align:right;font-size:10pt}</style>';
//    css_html = css_html.replace(/ /g, '%20');
    
    a.href = data_type + ',' + encodeURIComponent('<html><head>' + css_html + '</' + 'head><body>' + table_html + '</body></html>');
    
    //setting the file name
    a.download = 'exported_table_' + postfix + '.xls';
    //triggering the function
    a.click();
}

function salvarDados (codemp, data) {
    console.log("Entrei no salvado de dados")
      
    // Receita de Revenda de Mercadorias 
    let sql = `
        SELECT SUM(VLRCTB) as SOMA 
        FROM TGFLIV 
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND CODEMP = ${codemp}
        AND CODCFO IN (5102,5403,5405,5922,6102,6403,6405,6108,6922)
        `   

    let receita_revenda = getDadosSql(sql,true)

    // Bonificações 
    sql = `SELECT SUM(VLRCTB) as SOMA 
        FROM TGFLIV  
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND CODEMP = ${codemp}
        AND CODCFO IN (2910,1910)` 
    let bonificacoes = getDadosSql(sql,true)

    // -- Receita de prestação de servicos
    sql = `SELECT SUM(VLRNOTA) as SOMA 
    FROM TGFCAB 
    WHERE DTNEG BETWEEN ${data.dataPesquisa} 
    AND CODTIPOPER = 2001
    AND CODEMP = ${codemp}`
    let prestacao_servicos = getDadosSql(sql,true)

    // -- Devolução de compras

    sql = `SELECT SUM(VLRCTB) AS SOMA 
        FROM TGFLIV  
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND CODEMP = ${codemp}
        AND CODCFO IN (5411,6411,5202,6202) `
    let devolucao_compras = getDadosSql(sql,true)

    // -- Baixa de estoque/Estorno de crédito
    sql = `SELECT SUM(liv.VLRCTB) as SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFLIV liv ON cab.NUNOTA = liv.NUNOTA  
        WHERE cab.CODTIPOPER in (2120,2110)
        AND liv.CODEMP = ${codemp}
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `   
    let baixa_estoque = getDadosSql(sql,true)

    // -- ICMS normal/ICMS ST recolhido
    sql = `SELECT SUM(VLRICMS) AS SOMA 
        FROM TGFLIV  
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND CODEMP = ${codemp}
        AND CODCFO IN (5102,5403,5405,5117,6102,6403,6405,6108,6117)` 

    let icms_normal = getDadosSql(sql,true)
    // console.log(icms_normal)

    // -- Aquisição de bens para revenda
    sql = `SELECT SUM(VLRCTB) AS SOMA 
        FROM TGFLIV liv 
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND CODEMP = ${codemp}
        AND CODCFO IN (2403,2102,1403,1102)
        AND UFORIGEM NOT IN ('AC','AM','RR', 'RO')`   
    let aquisicao_bens_revenda = getDadosSql(sql,true)

    // -- Aquisição de bens compra região SUFRAMA
    sql = `SELECT SUM(VLRCTB) AS SOMA 
        FROM TGFLIV  
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND CODEMP = ${codemp}
        AND CODCFO IN (2403,2102,1403,1102)
        AND UFORIGEM IN ('AC','AM','RR', 'RO')` 
    let aquisicao_bens_compra = getDadosSql(sql,true)

    // -- Frete sobre compras (Ônus do comprador)
    sql = `SELECT SUM(VLRCTB) AS SOMA 
        FROM TGFLIV  
        WHERE DHMOV BETWEEN ${data.dataPesquisa} 
        AND CODEMP = ${codemp} 
        AND CODCFO IN (1353,2353,2352,1352)` 


    let frete_compras = getDadosSql(sql,true)

    // -- Fretes sobre Vendas (Ônus do vendedor)
    sql = `SELECT SUM(cab.VLRNOTA) as SOMA 
        FROM TGFCAB cab 
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA 
        INNER JOIN TGFPAR par ON par.CODPARC = cab.CODPARC 
        WHERE cab.CODTIPOPER = 1001  
        AND ite.CODPROD in (2327)
        AND par.TIPPESSOA = 'J'
        AND cab.CODEMP = ${codemp}
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let frete_vendas = getDadosSql(sql,true)
    console.log(sql)
    console.log(frete_vendas)

    // -- Despesas e custos com energia elétrica
    sql = `SELECT SUM(liv.VLRCTB) AS SOMA 
        FROM TGFLIV liv  
        INNER JOIN TGFITE ite ON ite.NUNOTA = liv.NUNOTA 
        WHERE liv.DHMOV BETWEEN ${data.dataPesquisa}
        AND liv.CODEMP = ${codemp}
        AND liv.CODCFO IN (1253) 
        AND ite.CODPROD = 3691`
    let despesas_custos = getDadosSql(sql,true)

    // -- 20 - ALUGUEIS DE PRÉDIOS
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD
        WHERE cab.CODTIPOPER = 1553  
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (3701) 
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let alugueis_predios = getDadosSql(sql,true)

    // -- Despesas com máquinas e equipamentos / Aluguéis de veículos
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD 
        WHERE cab.CODTIPOPER = 1001   
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (2309,2324) AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let despesas_maquinas_alugueis_veiculos = getDadosSql(sql,true)

    // -- 22 -  MONTAGEM
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD 
        WHERE cab.CODTIPOPER = 1001  
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (2326,2067) AND cab.DTNEG BETWEEN ${data.dataPesquisa}
     `
    //
    let montagem = getDadosSql(sql,true)
    // console.log(montagem)

    // -- 24 - PUBLICIDADE E PROPAGANDA
    sql = `SELECT SUM(cab.VLRNOTA) as SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD 
        WHERE cab.CODTIPOPER = 1001  
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (2358) AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let publicidade_propaganda = getDadosSql(sql,true)

    // -- 25 - RADIO
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD
        WHERE cab.CODTIPOPER = 1001  
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (2354)
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let radio = getDadosSql(sql,true)
    console.log(radio)

    // -- 27 - IMPRESSÃO DE MATERIAL
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD
        WHERE cab.CODTIPOPER IN (1001,1512,1501) 
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (2359) 
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let impressao = getDadosSql(sql,true)

    // -- 28 - CARGA E DESCARGA
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA 
        FROM TGFCAB cab  
        INNER JOIN TGFITE ite ON ite.NUNOTA = cab.NUNOTA  
        INNER JOIN TGFPRO pro ON pro.CODPROD = ite.CODPROD 
        WHERE cab.CODTIPOPER = 1001   
        AND cab.CODEMP = ${codemp}
        AND ite.CODPROD in (2330) 
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
    `
    let carga_descarga = getDadosSql(sql,true)

    // --30 - DEVOLUÇÃO DE VENDAS
    sql = `SELECT SUM(cab.VLRNOTA) AS SOMA 
        FROM TGFCAB cab 
        WHERE cab.TIPMOV = 'D' 
        AND cab.CODEMP = ${codemp}
        AND CODTIPOPER not in (1106,1102,1104)
        AND cab.DTNEG BETWEEN ${data.dataPesquisa}
     `
    let devolucao_vendas = getDadosSql(sql,true)

    // -- ICMS Sobre aquisição de bens para revenda / Devolução
    sql = `SELECT SUM(VLRICMS) AS SOMA 
        FROM TGFLIV liv 
        WHERE DHMOV BETWEEN ${data.dataPesquisa}
        AND liv.CODEMP = ${codemp}
        AND CODCFO IN (1411,2202,2411,1202)` 
    let icms_revenda = getDadosSql(sql,true)


    // Calculos extras do débito de contribuição
    let d_receita_total = retorna_zero_para_nan(receita_revenda)+retorna_zero_para_nan(bonificacoes)+retorna_zero_para_nan(prestacao_servicos)
    let d_calculo_com_icms = (d_receita_total - retorna_zero_para_nan(devolucao_compras)+retorna_zero_para_nan(baixa_estoque))
    let d_calculo_sem_icms = d_calculo_com_icms - retorna_zero_para_nan(icms_normal)
    let d_pis_nao_cumulativo = d_calculo_sem_icms * 0.0165;
    let d_cofins_nao_cumulativo = d_calculo_sem_icms * 0.076;

    // Débito da contribuição

    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(receita_revenda),1,1)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(bonificacoes),1,2)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(prestacao_servicos),1,3)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_receita_total,1,4);
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(devolucao_compras),1,7)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(baixa_estoque),1,8)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_calculo_com_icms,1,9)

    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(icms_normal),1,10)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_calculo_sem_icms,1,11)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_pis_nao_cumulativo,1,12)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_cofins_nao_cumulativo,1,13)


    // Calculos extras do débito de contribuição
    let c_calculo_com_icms =
        retorna_zero_para_nan(aquisicao_bens_revenda) +
        retorna_zero_para_nan(aquisicao_bens_compra) +
        retorna_zero_para_nan(frete_compras)+
        retorna_zero_para_nan(frete_vendas)+
        retorna_zero_para_nan(despesas_custos)+
        retorna_zero_para_nan(alugueis_predios)+
        retorna_zero_para_nan(despesas_maquinas_alugueis_veiculos)+
        retorna_zero_para_nan(montagem)+
        retorna_zero_para_nan(publicidade_propaganda)+
        retorna_zero_para_nan(radio)+
        retorna_zero_para_nan(impressao)+
        retorna_zero_para_nan(carga_descarga)+
        retorna_zero_para_nan(devolucao_vendas);

    let c_calculo_sem_icms = c_calculo_com_icms - retorna_zero_para_nan(icms_revenda);
    let credito_pis = c_calculo_sem_icms * 0.0165;
    let credito_cofins = c_calculo_sem_icms * 0.076;
    let c_pis_zfm = retorna_zero_para_nan(aquisicao_bens_compra)*0.01
    let c_cofins_zfm = retorna_zero_para_nan(aquisicao_bens_compra)*0.046
    let c_pis_nao_cumulativo = credito_pis + c_pis_zfm
    let c_cofins_nao_cumulativo = credito_cofins + c_cofins_zfm




    // Crédito da contribuição
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(aquisicao_bens_revenda),2,1)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(aquisicao_bens_compra),2,2)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(frete_compras),2,3)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(frete_vendas),2,4)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(despesas_custos),2,5)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(alugueis_predios),2,6)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(despesas_maquinas_alugueis_veiculos),2,7)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(montagem),2,8)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(publicidade_propaganda),2,9)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(radio),2,10)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(impressao),2,11)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(carga_descarga),2,12)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(devolucao_vendas),2,13)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_calculo_com_icms,2,14)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(icms_revenda),2,15)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_calculo_sem_icms,2,16)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,credito_pis,2,17)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,credito_cofins,2,18)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(aquisicao_bens_compra),2,19)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,retorna_zero_para_nan(aquisicao_bens_compra),2,20)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_pis_zfm,2,21)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_cofins_zfm,2,22)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_pis_nao_cumulativo,2,23)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_cofins_nao_cumulativo,2,24)


    // Apuração das contribuições

    let total_pis_nao_cumulativo = d_pis_nao_cumulativo-c_pis_nao_cumulativo
    let total_cofins_nao_cumulativo = d_cofins_nao_cumulativo-c_cofins_nao_cumulativo
    // PIS
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_pis_nao_cumulativo,3,1)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_pis_nao_cumulativo,3,3)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,total_pis_nao_cumulativo,3,4)

    // COFINS
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,d_cofins_nao_cumulativo,3,9)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,c_cofins_nao_cumulativo,3,11)
    salvarDadosEmMassa(data.dataCompleto[0],data.dataCompleto[1],codemp,total_cofins_nao_cumulativo,3,12)


}

function salvarDadosEmMassa(mes,ano,codemp,valor,idgrp,idsgrp)
{
    let entity = "AD_MOVCONTRIB"
    let fields = {}
    fields.IDMES = formatDataSankhya(mes)
    fields.IDANO = formatDataSankhya(ano)
    fields.CODEMP = formatDataSankhya(codemp)
    fields.VALOR = formatDataSankhya(valor.toFixed(2))
    fields.IDGRP = formatDataSankhya(idgrp)
    fields.IDSGRP = formatDataSankhya(idsgrp)
    saveRecord(entity,fields)
}