import { ApiAxios } from '../../../api/apiAxios';
import { BodyTelaPickingByVendroll, ListaProveedores, RolloByUUID, TipoDeTela, TopTelaPickingByVendroll } from './ReceptionTelaVendroll.types';

export class ReceptionTelaVendrollService {

    async topTelaPickingByVendroll(nombreProveedor: string | null){

        try {
            const response = await ApiAxios.get<TopTelaPickingByVendroll[]>(`MWMS_RecTela/TopTelaPickingByVendroll?nombreProveedor=${nombreProveedor}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async getListaProveedores(nombreProveedor: string | null){

        try {
            const response = await ApiAxios.get<ListaProveedores[]>(`MWMS_RecTela/GetListaProveedores?nombreProveedor=${nombreProveedor}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async GetListaDeTipoDeTela(proveedorId: string | null){

        try {
            const response = await ApiAxios.get<TipoDeTela[]>(`MWMS_RecTela/GetListaDeTipoDeTela/${proveedorId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    
    async GetRolloByUUID(activityUUID:string){

        try {
            const response = await ApiAxios.get<RolloByUUID[]>(`MWMS_RecTela/GetRolloByUUID/${activityUUID}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async PostTelaPickingByVendroll(body:BodyTelaPickingByVendroll){

        try {
            const response = await ApiAxios.post<RolloByUUID>(`MWMS_RecTela/PostTelaPickingByVendroll`, {...body});
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async PostCorreoTelaPickingByVendroll(body:RolloByUUID[]){

        try {
            const response = await ApiAxios.post<string>(`MWMS_RecTela/PostCorreoTelaPickingByVendroll`, body);
            return response.data;
        } catch (error) {
            console.error('Error enviando correo:', JSON.stringify(error));
            throw error;
        }
    }
}
