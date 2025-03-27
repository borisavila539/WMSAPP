import { ApiAxios } from "../../api/apiAxios";
import { Impresoras, ListTelas, TelaPickingDefecto, TelaPickingIsScanning, TelaPickingMerge, TelaPickingRule, TelaPickingUpdate } from "./ReceptionTela.types";


export class ReceptionTelaService {
    
    async getListTelas(journalId:string) {
        try {
            const response = await ApiAxios.get<ListTelas[]>(`MWMS_RecTela/GetListTelas/${journalId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching list of telas", error);
            throw error;
        }
    }


    async postTelaPickingMerge(journalId:string) {
        try {
            const response = await ApiAxios.post<TelaPickingMerge[]>(`MWMS_RecTela/PostTelaPickingMerge/${journalId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching list of telas", error);
            throw error;
        }
    }

    async putTelaPickingIsScanning(telaPickingIsScanning:TelaPickingIsScanning[]) {
        try {
            const response = await ApiAxios.post<TelaPickingUpdate[]>(`MWMS_RecTela/UpdateTelaPickingIsScanning`, telaPickingIsScanning);

            
            return response.data;
        } catch (error) {
            console.error("Error fetching list of telas", error);
            throw error;
        }
    }

    private async getTelaPickingDefecto() {
        try {
            const response = await ApiAxios.get<TelaPickingDefecto[]>(`MWMS_RecTela/GetTelaPickingDefecto`);
            return response.data;
        } catch (error) {
            console.error("Error fetching list of defecto", error);
            throw error;
        }
    }

    private async GetTelaPickingRule() {
        try {
            const response = await ApiAxios.get<TelaPickingRule[]>(`MWMS_RecTela/GetTelaPickingRule`);
            return response.data;
        } catch (error) {
            console.error("Error fetching list of rule", error);
            throw error;
        }
    }

    async getDataList(){
        const rules = await this.GetTelaPickingRule();
        const defecto = await this.getTelaPickingDefecto();
        const impresoras = await this.getImpresoras();

        return {rules, defecto, impresoras};
    }

    public async EnviarCorreoDeRecepcionDeTela(journalId: string) {
        try {
            const response = await ApiAxios.get<string>(`MWMS_RecTela/EnviarCorreoDeRecepcionDeTela/${journalId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    private async getImpresoras() {
        try {
            const response = await ApiAxios.get<Impresoras[]>('Impresoras');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    public async postPrintEtiquetasTela(ipImpresora:string, telaScanning: TelaPickingMerge[]){
        try {
            const response = await ApiAxios.post<string>(`MWMS_RecTela/PostPrintEtiquetasTela/${ipImpresora}`, telaScanning);
            return response.data;
        } catch (error) {
            
            throw error;
        }
    }
    

}