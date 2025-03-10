import { ApiAxios } from "../../api/apiAxios";
import { ListTelas, TelaPickingIsScanning, TelaPickingMerge, TelaPickingUpdate } from "./ReceptionTela.types";


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

    async putTelaPickingIsScanning(telaPickingIsScanning:TelaPickingIsScanning) {
        try {
            const response = await ApiAxios.put<TelaPickingUpdate>(`MWMS_RecTela/UpdateTelaPickingIsScanning`, {...telaPickingIsScanning});

            
            return response.data;
        } catch (error) {
            console.error("Error fetching list of telas", error);
            throw error;
        }
    }

}