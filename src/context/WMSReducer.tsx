import { WMSState } from "./WMSContext"

type WMSAction =
    | { type: 'changeUsuario', payload: string }
    | { type: 'changeDiario', payload: string }
    | { type: 'changeNombreDiario', payload: string }
    | { type: 'changeCamion', payload: string }
    | { type: 'changeChofer', payload: string }
    | { type: 'changeINVENTLOCATIONIDTO', payload: string }
    | { type: 'changeTRANSFERIDFROM', payload: string }
    | { type: 'changeTRANSFERIDTO', payload: string }
    | { type: 'changeRecId', payload: string }
    | { type: 'changeDespachoID', payload: number }
    | { type: 'changeUsuarioAlmacen', payload: number }
    | { type: 'changeBox', payload: number }
    | { type: 'changeProdID', payload: string }


export const WMSReducer = (state: WMSState, action: WMSAction): WMSState => {
    switch (action.type) {
        case "changeUsuario":
            return {
                ...state,
                usuario: action.payload
            }
        case "changeDiario":
            return {
                ...state,
                diario: action.payload
            }
        case "changeNombreDiario":
            return {
                ...state,
                nombreDiario: action.payload
            }
        case "changeCamion":
            return {
                ...state,
                Camion: action.payload
            }
        case "changeChofer":
            return {
                ...state,
                Chofer: action.payload
            }
        case "changeTRANSFERIDFROM":
            return {
                ...state,
                TRANSFERIDFROM: action.payload
            }
        case "changeTRANSFERIDTO":
            return {
                ...state,
                TRANSFERIDTO: action.payload
            }
        case "changeINVENTLOCATIONIDTO":
            return {
                ...state,
                INVENTLOCATIONIDTO: action.payload
            }
        case "changeRecId":
            return {
                ...state,
                recID: action.payload
            }
        case "changeDespachoID":
            return {
                ...state,
                DespachoID: action.payload
            }
        case "changeUsuarioAlmacen":
            return {
                ...state,
                usuarioAlmacen: action.payload
            }
        case "changeBox":
            return {
                ...state,
                Box: action.payload
            }
        case "changeProdID":
            return {
                ...state,
                ProdID: action.payload
            }

        default:
            return state;
    }
}