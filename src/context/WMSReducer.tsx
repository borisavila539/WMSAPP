import { WMSState } from "./WMSContext"

type WMSAction =
| { type: 'changeUsuario', payload: string }
| { type: 'changeDiario', payload: string }

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
        default:
            return state;
    }
}