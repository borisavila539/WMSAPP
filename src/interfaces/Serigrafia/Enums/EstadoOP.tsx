export enum EstadoOp {
  Creado,
  Estimado,
  Programado,
  Liberado,
  Iniciado,
  NotificadoTerminado,
  Terminado = 7
}

const estadoMap: Record<EstadoOp, string> = {
    [EstadoOp.Creado]: "Creado",
    [EstadoOp.Estimado]: "Estimado",
    [EstadoOp.Programado]: "Programado",
    [EstadoOp.Liberado]: "Liberado",
    [EstadoOp.Iniciado]: "Iniciado",
    [EstadoOp.NotificadoTerminado]: "Notificado Terminado",
    [EstadoOp.Terminado]: "Terminado",
};
export function getEstadoTexto(estado: EstadoOp): string {
    return estadoMap[estado] || "Desconocido";
}
