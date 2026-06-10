import { listarTasks, salvarDB } from "../storage/db";

const historico = new Stack();
//push

export function pushAcao(acao){
    const tamanho = historico.size();

    if (tamanho > 50){
        const historicoTMP = historico.toArray();
        historico = historicoTMP.splice(0);
    }
    
    const tarefasAntes = await listarTasks();
    historico.push({ acao: acao, estado: JSON.stringify(tarefasAntes) });
    
} 
//undo
export function undo(){
    const ultimaAcao = historico.pop()
    if(ultimaAcao){
        const estadoAnterior = JSON.parse(ultimaAcao.estado);
        await salvarDB(estadoAnterior);
        console.log(chalk.yellow("Ação desfeita: " + ultimaAcao.acao));
        return ultimaAcao;
    }
    console.log("Não foi possível executar.");
    return
}

//redo
export function redo(ultimaAcao){
    if(ultimaAcao){
        historico.push(ultimaAcao);
        await salvarDB(historico);
        return ultimaAcao;
    }
    console.log("Não foi possível executar.");
    return 
}