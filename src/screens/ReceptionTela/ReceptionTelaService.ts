import { ApiAxios } from "../../api/apiAxios";
import { ListTelas } from "./ReceptionTela.types";


export class ReceptionTelaService {
    ///MWMS_RecTela/GetListTelas/-
    async getListTelas(journalId:string) {
        try {
            const response = await ApiAxios.get<ListTelas[]>(`MWMS_RecTela/GetListTelas/${journalId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching list of telas", error);
            throw error;
        }
    }
}