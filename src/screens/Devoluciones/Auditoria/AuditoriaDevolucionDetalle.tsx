import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { black, green, grey } from '../../../constants/Colors'
import Header from '../../../components/Header'
import { WMSContext } from '../../../context/WMSContext'
import { DevolucionDefectoDetalleINterface, DevolucionDetalleinterface, DevolucionesDefectosInterface, DevolucionesInterface } from '../../../interfaces/Devoluciones/Devoluciones';
import { WmSApi } from '../../../api/WMSApi'
import { SelectList } from 'react-native-dropdown-select-list'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'


type props = StackScreenProps<RootStackParams, "AuditoriaDevolucionDetalle">
export const AuditoriaDevolucionDetalle: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [data, setData] = useState<DevolucionDetalleinterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [defectos, setDefectos] = useState<DevolucionesDefectosInterface[]>([])
    const [defectoSelected, setDefectoSeleted] = useState<{ key: string, value: string }[]>([])
    const [id, setId] = useState<number>(0)
    const [tipo, setTipo] = useState<{ key: string, value: string }[]>(
        [
            { key: 'Primera', value: 'Primera' },
            { key: 'Irregular', value: 'Irregular' },
            { key: 'Tercera', value: 'Tercera' }
        ]
    )
    const [enviandoEstado, setEnviandoEstado] = useState<boolean>(false)

    const [itemBarcode, setItembarcode] = useState<string>('')


    const getDefectos = async () => {
        try {
            await WmSApi.get<DevolucionesDefectosInterface[]>('Devolucion/Defectos').then(resp => {
                setDefectos(resp.data)
            })
        } catch (err) {

        }
    }

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                console.log(WMSState.devolucion.id)
                await WmSApi.get<DevolucionDetalleinterface[]>(`DevolucionDetalle/auditoria/${WMSState.devolucion.id}`)
                    .then(resp => {
                        setData(resp.data)

                    })
            } catch (err) {
                Alert.alert('err1')
            }
            setCargando(false)
        }
    }

    const setShowList = (item: string) => {
        let list: { key: string, value: string }[] = [{ key: '0', value: 'Ninguno' }]
        defectos.forEach(element => {
            if (item.startsWith(element.estructura)) {
                list.push({ key: element.id.toString(), value: element.defecto })
            }

            setDefectoSeleted(list)
        })
    }

    const actualizarDefectos = async (item: DevolucionDefectoDetalleINterface) => {
        console.log(item)
        if (item.idDefecto != 0 && item.tipo != '') {
            try {
                await WmSApi.get<DevolucionDefectoDetalleINterface>(`Devolucion/DefectosDetalle/${item.id}/${item.idDefecto}/${item.tipo}`).then(resp => {
                    getData()
                })
            } catch (err) {

            }
        }

    }

    const ActualizarEstado = async (tipo: string) => {
        if (!enviandoEstado) {
            setEnviandoEstado(true)

            let cont: number = 0

            data.forEach(linea => {
                linea.defecto?.forEach(def => {
                    if (def.idDefecto == 0 || def.tipo == '') {
                        cont++;
                    }
                })
            })
            if (cont == 0) {
                try {
                    await WmSApi.get<DevolucionesInterface>(`Devolucion/Estado/${WMSState.devolucion.id}/${tipo}/${WMSState.usuario}`)
                        .then(resp => {
                            if (resp.data.descricpcion == tipo) {
                                PlaySound('success')
                                navigation.goBack()
                                navigation.goBack()

                            } else {
                                PlaySound('error')
                            }
                        })
                } catch (err) {

                }
            } else {
                PlaySound('error')
            }

            setEnviandoEstado(false)

        }

    }
    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const renderItem = (item: DevolucionDetalleinterface, show: boolean) => {
        const getCantidad = (): number => {
            let cant: number = 0
            item.defecto?.forEach(element => {
                if (element.idDefecto && element.tipo) {
                    cant++;
                }
            })
            return cant
        }

        const getColor = (): string => {

            let cant = getCantidad()
            if ((cant / item.cantidad) == 0) {
                return '#FFE61B'
            } else if ((cant / item.cantidad) == 1) {

                return '#B5FE83'
            } else {
                return '#FFB72B'
            }
        }
        return (
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 3 }}>

                <TouchableOpacity
                    disabled={show}
                    onPress={() => {
                        setShowList(item.articulo)
                        setId(item.id)
                    }}
                    style={{ backgroundColor: getColor(), width: '90%', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5 }}
                >
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={style.textRender}>Articulo: {item.articulo}</Text>
                        <Text style={style.textRender}>{getCantidad()}/{item.cantidad}</Text>
                    </View>
                    <Text style={style.textRender}>Cod. Barra: {item.itembarcode}</Text>
                    <Text style={style.textRender}>Talla: {item.talla}</Text>
                    <View style={{ maxHeight: 180, width: '100%' }}>
                        <ScrollView>
                            {
                                item.id == id && show &&
                                item.defecto?.map(element => (
                                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ width: '9%', textAlign: 'center', fontWeight: 'bold' }}>{((item.defecto?.indexOf(element)) ?? 0) + 1}</Text>
                                        <View style={{ width: '45%', padding: 2 }}>
                                            <SelectList
                                                setSelected={(val: string) => {
                                                    element.idDefecto = parseInt(val)
                                                    actualizarDefectos(element)
                                                }}
                                                data={defectoSelected}
                                                save='key'
                                                placeholder='Defecto'
                                                search={false}
                                                dropdownShown={false}
                                                defaultOption={defectoSelected.find(x => x.key == element.idDefecto?.toString())}
                                                boxStyles={{ backgroundColor: grey }}
                                                dropdownStyles={{ backgroundColor: grey }}
                                            />
                                        </View>
                                        <View style={{ width: '45%', padding: 2 }}>
                                            <SelectList
                                                setSelected={(val: string) => {
                                                    element.tipo = val
                                                    actualizarDefectos(element)
                                                }}
                                                data={tipo}
                                                save='key'
                                                placeholder='Tipo'
                                                search={false}
                                                dropdownShown={false}
                                                defaultOption={tipo.find(x => x.key == element.tipo?.toString())}
                                                boxStyles={{ backgroundColor: grey }}
                                                dropdownStyles={{ backgroundColor: grey }}
                                            />
                                        </View>

                                    </View>
                                ))
                            }
                        </ScrollView>
                    </View>

                </TouchableOpacity>
            </View>
        )
    }


    useEffect(() => {
        getData()
        getDefectos()
    }, [])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Auditoria' texto2={WMSState.devolucion.numDevolucion} texto3={data.length + ''} />
            <View style={{ width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-evenly' }}>
                <TextInput
                    style={style.textInput}
                    onChangeText={(value) => {
                        setId(data.find(x => x.itembarcode == value)?.id ?? 0)
                    }}
                    value={itemBarcode}
                    autoFocus

                />
                <TouchableOpacity onPress={() => ActualizarEstado('Auditado')} disabled={enviandoEstado} style={{ backgroundColor: green, paddingVertical: 5, paddingHorizontal: 5, borderRadius: 10, width: '15%', height: '85%', alignItems: 'center' }}>
                    {
                        !enviandoEstado ?
                            <Icon name='check' size={35} color={black} />
                            :
                            <ActivityIndicator size={20} />
                    }
                </TouchableOpacity>
            </View>
            {
                cargando ?
                    <ActivityIndicator size={20} />
                    :
                    null
            }
            {
                data.find(x => x.id == id)?.id != null ?
                    renderItem(data.find(x => x.id == id), true)
                    :
                    null
            }

            <FlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => renderItem(item, false)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                }
            />
        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '79%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2
    },
    input: {
        width: '90%',
        textAlign: 'center'
    },
    textRender: {
        fontWeight: 'bold'

    }
})