export interface myAlertInterface {
    visible: boolean,
    tipoMensaje: boolean,
    mensajeAlerta: string,
    onPress: () => void,
    onPressCancel?: () => void
}