import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { actualizarDefecto, DefectosAuditoria, ListaAuditoria } from '../../../../interfaces/Devoluciones/areasDevolucion';
import { WmSApi } from '../../../../api/WMSApi'
import { WMSContext } from '../../../../context/WMSContext'
import { Alert, SliderComponent, Text, TouchableOpacity, View } from 'react-native'
import Header from '../../../../components/Header'
import { black, grey, orange } from '../../../../constants/Colors'
import { SelectList } from 'react-native-dropdown-select-list'
import Icon from 'react-native-vector-icons/FontAwesome5'


type props = StackScreenProps<RootStackParams, "AuditoriaDevolucionDefecto">
export const AuditoriaDevolucionDefecto: FC<props> = ({ navigation }) => {

    const [data, setData] = useState<DefectosAuditoria[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const { WMSState } = useContext(WMSContext)
    const [tipo, setTipo] = useState<{ key: string, value: string }[]>(
        [
            { key: 'Primera', value: 'Primera' },
            { key: 'Irregular', value: 'Irregular' },
            { key: 'Tercera', value: 'Tercera' }
        ]
    )
    const [areas, setAreas] = useState<ListaAuditoria[]>([])
    const [operaciones, setOperaciones] = useState<ListaAuditoria[]>([])
    const [defectos, setDefectos] = useState<ListaAuditoria[]>([])

    const [area, setArea] = useState<string>('')
    const [operacion, setOperacion] = useState<string>('')
    const [defecto, setDefecto] = useState<string>('')
    const [tiposelected, settiposelected] = useState<string>('')
    const [actualizando, setActualizando] = useState<boolean>(false)
    const [reparacion, setReparacion] = useState<boolean>(false)

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<DefectosAuditoria[]>(`Devolucion/Defectos/${WMSState.devolucion.id}`)
                    .then(resp => {
                        setData(resp.data)
                        let lista: ListaAuditoria[] = []
                        resp.data.forEach(element => {
                            let tmp: ListaAuditoria = {
                                id: element.id,
                                key: element.key,
                                value: element.value
                            };
                            lista.push(tmp);

                        })
                        setAreas(lista)
                    })
            } catch (err) {
                Alert.alert('err1')
            }
            setCargando(false)
        }
    }

    const llenarOperacionesDefectos = () => {
        setOperaciones(data.find(x => x.key == area)?.operacion)
        setDefectos(data.find(x => x.key == area)?.defecto)

    }

    const actualizarDefecto = () => {
        if (!actualizando) {
            setActualizando(true)
            let tmp: DefectosAuditoria | undefined = data.find(x => x.key == area)
            if (tmp) {
                let areaid: number = tmp.id
                let operacionid: number = tmp.operacion.find(x => x.key == operacion)?.id
                let defetoID: number = tmp.defecto.find(x => x.key == defecto)?.id
                console.log(defetoID)
                try {
                    WmSApi.get<actualizarDefecto>(`Devolucion/DefectosDetalle/${WMSState.recID}/${defetoID ? defetoID : 0}/${tiposelected}/${reparacion}/${operacionid ? operacionid : 0}`)
                        .then(resp => {
                            if (resp.data.id != 0) {
                                navigation.goBack()
                            }
                        })
                } catch (err) {
                    console.log(err)
                }
            } else {
                try {
                    WmSApi.get<actualizarDefecto>(`Devolucion/DefectosDetalle/${WMSState.recID}/0/${tiposelected}/${reparacion}/0`)
                        .then(resp => {
                            if (resp.data.id != 0) {
                                navigation.goBack()
                            }
                        })
                } catch (err) {
                    console.log(err)
                }
            }



            setActualizando(false)

        }

    }

    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        if (area.length > 0) {
            setOperacion('')
            setDefecto('')
            llenarOperacionesDefectos()

        }
    }, [area])


    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Auditoria' texto2={WMSState.devolucion.numDevolucion}
                texto3={'Defectos'}
            />
            <View style={{ width: '80%', padding: 2 }}>
                <SelectList
                    setSelected={(val: string) => {
                        settiposelected(val)
                        setArea('')
                        setOperacion('')
                        setDefecto('')
                        setReparacion(false)
                    }}
                    data={tipo}
                    save='key'
                    placeholder='Seleccione Tipo'
                    search={false}
                    dropdownShown={false}
                    defaultOption={{ key: tiposelected, value: tiposelected }}
                    boxStyles={{ backgroundColor: grey, borderColor: tiposelected ? black : orange }}
                    dropdownStyles={{ backgroundColor: grey }}
                />
            </View>

            <View style={{ width: '80%', padding: 2 }}>
                <SelectList
                    setSelected={(val: string) => {
                        setArea(val)
                    }}
                    data={areas}
                    save='key'
                    placeholder='Seleccione Area'
                    search={true}
                    dropdownShown={false}
                    boxStyles={{ backgroundColor: grey, borderColor: area ? black : orange }}
                    dropdownStyles={{ backgroundColor: grey }}
                />
            </View>

            {
                operaciones.length > 0 &&
                <View style={{ width: '80%', padding: 2 }}>
                    <SelectList
                        setSelected={(val: string) => {
                            setOperacion(val)
                        }}
                        data={operaciones}
                        save='key'
                        placeholder='Seleccione Operacion'
                        search={true}
                        dropdownShown={false}
                        defaultOption={{ key: operacion, value: operacion }}
                        boxStyles={{ backgroundColor: grey, borderColor: operacion ? black : orange }}
                        dropdownStyles={{ backgroundColor: grey }}
                    />
                </View>
            }

            {
                defectos.length > 0 &&
                <View style={{ width: '80%', padding: 2 }}>
                    <SelectList
                        setSelected={(val: string) => {
                            setDefecto(val)
                        }}
                        data={defectos}
                        save='key'
                        placeholder='Seleccione Defecto'
                        search={true}
                        dropdownShown={false}
                        defaultOption={{ key: defecto, value: defecto }}
                        boxStyles={{ backgroundColor: grey, borderColor: defecto ? black : orange }}
                        dropdownStyles={{ backgroundColor: grey, }}
                    />
                </View>
            }

            <View style={{ width: '80%', flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => {
                    setReparacion(!reparacion)
                }} style={{ alignItems: 'center' }} >
                    {
                        reparacion ?
                            <Icon name='check-square' size={30} color={black} />
                            :
                            <Icon name='square' size={30} color={black} />
                    }
                </TouchableOpacity>
                <Text style={{ fontWeight: 'bold', color: black }}>Reparado</Text>
            </View>

            {
                (area && operacion && defecto && tiposelected) &&
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity disabled={actualizando} onPress={() => actualizarDefecto()} style={{ backgroundColor: orange, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', color: grey }}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            }

        </View>
    )
}
