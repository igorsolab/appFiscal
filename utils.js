
function filtroPorLoja(param){

    let sql = `SELECT CODEMP, NOMEFANTASIA FROM TSIEMP WHERE CODEMP < 100`;
    console.log(sql)
    let dadosSelect = getDadosSql(sql,true);
    console.log(dadosSelect)


    let menuComLojas = `<div class="dropdown mt-2 col-12" id="dropdown-lojas">
        <button class="btn btn-success dropdown-toggle w-100" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Selecionar Lojas
        </button>
        <div class="dropdown-menu" style="height:500px;overflow-y:scroll;" aria-labelledby="dropdownMenuButton">`

            dadosSelect.map(e=>{
                menuComLojas+=`<label class="dropdown-item">
                                    <input type="checkbox" class="checkbox-item ${param}" value="${e.CODEMP}"> ${e.NOMEFANTASIA}
                                </label>`
            })

        menuComLojas+=`</div></div>`


    return menuComLojas
}

function formatandoData(data){
    return data.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3")
}

 // formata dados para sankhya
function formatData(data){

    let dataSplit = data.split("-")
    let mes = dataSplit[1];
    let ano = dataSplit[0];
    let dia = ""
    let betweenData={};
    if(mes=="04" || mes =="06" || mes == "09" || mes == "11"){
        dia = 30;
    }else if(mes =="01" || mes == "03" || mes === "05" || mes === "07" || mes === "08" || mes === "10" ||  mes === "12" ){
       dia = 31;
    }else{
       dia = 29;
    }
    betweenData.mes = mes;
    betweenData.ano = ano;
    betweenData.dia = dia;
    let dataObj = {
        "dataPesquisa":`'01/${betweenData.mes}/${betweenData.ano}' AND '${betweenData.dia}/${betweenData.mes}/${betweenData.ano}'`,
        "dataCompleto": [
            betweenData.mes,
            betweenData.ano
        ]
    }
    return dataObj;
}

function modalLoading() {
    let modal = `
    <div class="modal fade d-flex justify-content-center" id="modalLoading" >
        <div class="modal-dialog modal-dialog-centered" style="width:100px;">
            <div class="modal-content">
                <!-- Modal Header -->

                <!-- Modal body com spinner Bootstrap -->
                <div class="modal-body text-center">
                    <div class="spinner-border spinner-green text-success" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    `
    console.log("Abrindo modal")

    $("body").append(modal);
}

function abrirLoading(){
    modalLoading();

    var modal_bootstrap = new bootstrap.Modal(document.getElementById('modalLoading'), {
        backdrop:'static',
        keyboard: false
    })
    modal_bootstrap.show()
    setTimeout(() => {
        results_table_fiscal()
    },2000)
}

function stopLoading(){
    setTimeout(() => {
        console.log("stopLoading")
        var modal_bootstrap = $('#modalLoading');
        modal_bootstrap.remove();
        $(".modal-backdrop").remove()
    },2000)
}

function retorna_zero_para_nan(data){
    return parseFloat(data[0].SOMA) !== null && !isNaN(parseFloat(data[0].SOMA)) ? parseFloat(data[0].SOMA) : 0
}


function formatarNumero(numero) {
    const numeroArredondado = Number(numero).toFixed(2);
    const mudandoCentavos = String(numeroArredondado).replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace('.', '/');
    // console.log(mudandoCentavos)
    return mudandoCentavos.replace(',','.').replace('/',',')
}


function retornaNomeMes(data){
    // console.log(data)
    switch (data) {
        case '01':
            return 'Janeiro';
        case '02':
            return 'Fevereiro';
        case '03':
            return 'Marco';
        case '04':
            return 'Abril';
        case '05':
            return 'Maio';
        case '06':
            return 'Junho';
        case '07':
            return 'Julho';
        case '08':
            return 'Agosto';
        case '09':
            return 'Setembro';
        case '10':
            return 'Outubro';
        case '11':
            return 'Novembro';
        case '12':
            return 'Dezembro';
        default:
            return 'Mês Inválido';
    }
}