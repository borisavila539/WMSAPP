import { createContext, useReducer } from "react";
import { WMSReducer } from "./WMSReducer";

//Definir la informacion a grabar
export interface WMSState {
    usuario: string,
    diario: string,
    nombreDiario: string
}

//Estado inicial
export const WMSInitialState: WMSState = {
    usuario: '',
    diario: '',
    nombreDiario: ''
}

export interface WMSContextProps {
    WMSState: WMSState,
    changeUsuario: (usuario: string) => void;
    changeDiario: (diario: string) => void;
    changeNombreDiario: (nombreDiario: string) => void
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


    return (
        <WMSContext.Provider
            value={{
                WMSState: WMSState,
                changeUsuario,
                changeDiario,
                changeNombreDiario
            }}
        >
            {children}
        </WMSContext.Provider>
    )

}

