import { createContext, useReducer } from "react";
import { WMSReducer } from "./WMSReducer";

//Definir la informacion a grabar
export interface WMSState {
    usuario: string,
    diario: string,
    nombreDiario: string,
    Camion: string,
    Chofer: string,
    TRANSFERIDFROM: string,
    TRANSFERIDTO: string,
    INVENTLOCATIONIDTO: string,
    recID: string,
    DespachoID: number,
    usuarioAlmacen: number
}

//Estado inicial
export const WMSInitialState: WMSState = {
    usuario: '',
    diario: '',
    nombreDiario: '',
    Camion: '',
    Chofer: '',
    TRANSFERIDFROM: '',
    TRANSFERIDTO: '',
    INVENTLOCATIONIDTO: '',
    recID: '',
    DespachoID: 0,
    usuarioAlmacen: 0
}

export interface WMSContextProps {
    WMSState: WMSState,
    changeUsuario: (usuario: string) => void;
    changeDiario: (diario: string) => void;
    changeNombreDiario: (nombreDiario: string) => void
    changeCamion: (Camion: string) => void
    changeChofer: (Chofer: string) => void
    changeTRANSFERIDFROM: (TRANSFERIDFROM: string) => void
    changeTRANSFERIDTO: (TRANSFERIDTO: string) => void
    changeINVENTLOCATIONIDTO: (INVENTLOCATIONIDTO: string) => void
    changeRecId: (RecId: string) => void
    changeDespachoID: (DespachoID: number) => void
    changeUsuarioAlmacen: (UsuarioAlmacen: number) => void
}

//crear el contexto
export const WMSContext = createContext({} as WMSContextProps)

export const WMSProvider = ({ children }: any) => {
    const [WMSState, dispatch] = useReducer(WMSReducer, WMSInitialState);

    const changeUsuario = (usuario: string) => {
        dispatch({ type: 'changeUsuario', payload: usuario })
    }

    const changeDiario = (diario: string) => {
        dispatch({ type: 'changeDiario', payload: diario })
    }
    const changeNombreDiario = (nombreDiario: string) => {
        dispatch({ type: 'changeNombreDiario', payload: nombreDiario })
    }
    const changeCamion = (Camion: string) => {
        dispatch({ type: 'changeCamion', payload: Camion })
    }
    const changeChofer = (Chofer: string) => {
        dispatch({ type: 'changeChofer', payload: Chofer })
    }
    const changeTRANSFERIDFROM = (TRANSFERIDFROM: string) => {
        dispatch({ type: 'changeTRANSFERIDFROM', payload: TRANSFERIDFROM })
    }
    const changeTRANSFERIDTO = (TRANSFERIDTO: string) => {
        dispatch({ type: 'changeTRANSFERIDTO', payload: TRANSFERIDTO })
    }
    const changeINVENTLOCATIONIDTO = (INVENTLOCATIONIDTO: string) => {
        dispatch({ type: 'changeINVENTLOCATIONIDTO', payload: INVENTLOCATIONIDTO })
    }
    const changeRecId = (RecId: string) => {
        dispatch({ type: 'changeRecId', payload: RecId })
    }
    const changeDespachoID = (DespachoID: number) => {
        dispatch({ type: 'changeDespachoID', payload: DespachoID })
    }
    const changeUsuarioAlmacen = (UsuarioAlmacen: number) => {
        dispatch({ type: 'changeUsuarioAlmacen', payload: UsuarioAlmacen })
    }

    return (
        <WMSContext.Provider
            value={{
                WMSState: WMSState,
                changeUsuario,
                changeDiario,
                changeNombreDiario,
                changeCamion,
                changeChofer,
                changeINVENTLOCATIONIDTO,
                changeTRANSFERIDFROM,
                changeTRANSFERIDTO,
                changeRecId,
                changeDespachoID,
                changeUsuarioAlmacen
            }}
        >
            {children}
        </WMSContext.Provider>
    )

}

