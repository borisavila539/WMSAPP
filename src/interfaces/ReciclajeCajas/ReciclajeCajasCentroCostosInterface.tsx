export interface ReciclajeCajasCentroCostosInterface {
    iM_CENTRO_DE_COSTOS: string,
    name: string
}

export interface ReciclajeCajasPendientes{
    id: number,
    camion: string,
    chofer: string,
    centroCostos: string,
    qty: number,
    fecha: Date,
    usuario: string,
    diario: string
}