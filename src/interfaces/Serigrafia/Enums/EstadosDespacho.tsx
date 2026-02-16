export enum EstadoDespachoSended {
  Creado,
  ParcialmenteEnviado,
  Enviado,
}

const estadoMapS: Record<EstadoDespachoSended, string> = {
    [EstadoDespachoSended.Creado]: "Creado",
    [EstadoDespachoSended.ParcialmenteEnviado]: "Parcialmente Enviado",
    [EstadoDespachoSended.Enviado]: "Enviado",
};
export function getEstadoTextoSended(estado: EstadoDespachoSended): string {
    return estadoMapS[estado] || "Desconocido";
}


export enum EstadoDespachoReceived {
  Creado,
  ParcialmenteEnviado,
  Enviado,
}

const estadoMapR: Record<EstadoDespachoReceived, string> = {
    [EstadoDespachoReceived.Creado]: "Creado",
    [EstadoDespachoReceived.ParcialmenteEnviado]: "Parcialmente Recibido",
    [EstadoDespachoReceived.Enviado]: "Recibido",
};
export function getEstadoTextoReceived(estado: EstadoDespachoReceived): string {
    return estadoMapR[estado] || "Desconocido";
}