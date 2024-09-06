import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useRef, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { grey } from '../../constants/Colors'
import { WmSApi } from '../../api/WMSApi'
import { ControlCajaEtiquetadoFiltro, ControlCajaEtiquetadointerface, ControlCajasEtiquetadoDetalleInterface } from '../../interfaces/ControlCajasEtiquetado/ControlCajasEtiquetadointerface'
import { Text } from 'react-native-elements'

type props = StackScreenProps<RootStackParams, "ControlCajaEtiquetasScreen">


export const ControlCajaEtiquetasScreen: FC<props> = ({ navigation }) => {
    const [BoxNum, setBoxNum] = useState<string>('')
    const [Empleado, setEmpleado] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const [dato, setDato] = useState<ControlCajasEtiquetadoDetalleInterface>()
    const textInputRef2 = useRef<TextInput>(null);
    const textInputRef = useRef<TextInput>(null);

    const insertBox = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<ControlCajaEtiquetadointerface>(`ControlCajasEtiquetadoAgregar/${BoxNum}/${Empleado}`).then(async resp => {
                    if (resp.data.boxNum != '') {
                        let filtro: ControlCajaEtiquetadoFiltro = {
                            pedido: '',
                            ruta: '',
                            boxNum: BoxNum,
                            lote: '',
                            empleado: Empleado,
                            page: 0,
                            size: 1
                        }
                        await WmSApi.post<ControlCajasEtiquetadoDetalleInterface[]>('ControlCajasEtiquetado', filtro).then(resp => {
                            setDato(resp.data[0])
                            setBoxNum('')
                            setEmpleado('')
                            textInputRef.current?.focus();
                        })
                    }
                })
            } catch {

            }
            setCargando(false)
        }

    }
    const getTiempo = (): string => {
        if (dato) {
            return dato.tiempo.getHours().toString()

        } else {
            return ""
        }
    }

    useEffect(() => {
        if (Empleado != '' && BoxNum != '') {
            insertBox()
        } else if (Empleado == BoxNum){
            setBoxNum('')
            setEmpleado('')
        }else if (Empleado == '' && BoxNum != '') {
            textInputRef2.current?.focus()
        }else if (Empleado != '' && BoxNum == '') {
            textInputRef2.current?.focus()
        }
    }, [Empleado, BoxNum])

    useEffect(() => {
        textInputRef.current?.focus()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Control Cajas Etiqutado' texto2='' texto3='' />
            <TextInput
                placeholder='IMXXBXXXXXXXX'
                ref={textInputRef}
                style={styles.input}
                onChangeText={(value) => setBoxNum(value)}
                value={BoxNum} />
            <TextInput
                placeholder='Empleado'
                ref={textInputRef2}
                style={styles.input}
                onChangeText={(value) => setEmpleado(value)}
                value={Empleado} />
            {
                dato &&
                <View style={{ width: '90%', borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 10 }}>
                    <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>{dato.empleado}</Text>
                    <Text><Text style={styles.texto}>Pedido: </Text>{dato.pedido}</Text>
                    <Text><Text style={styles.texto}>Ruta: </Text>{dato.ruta}</Text>
                    <Text><Text style={styles.texto}>Codigo Caja: </Text>{dato.codigoCaja}</Text>
                    <Text><Text style={styles.texto}>Numero Caja: </Text>{dato.numeroCaja}</Text>
                    <Text><Text style={styles.texto}>Linea: </Text>{dato.bfplineid}</Text>
                    <Text><Text style={styles.texto}>Lote: </Text>{dato.temporada}</Text>
                    <Text><Text style={styles.texto}>Inicio: </Text>{dato.inicio.toString()}</Text>
                    <Text><Text style={styles.texto}>Fin: </Text>{dato.fin.toString()}</Text>
                    <Text><Text style={styles.texto}>Tiempo: </Text>{dato.tiempo.toString().slice(11, 19)}</Text>
                </View>
            }
        </View>
    )
}
const styles = StyleSheet.create({
    input: {
        backgroundColor: grey,
        borderWidth: 1,
        borderRadius: 10,
        width: '90%',
        textAlign: 'center',
        marginTop: 3
    },
    texto: {
        fontWeight: 'bold'
    }

})

