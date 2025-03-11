import { StackScreenProps } from "@react-navigation/stack"
import { FC, useContext, useEffect, useRef, useState, } from "react"
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, FlatList } from "react-native"
import { RootStackParams } from "../../../navigation/navigation"
import { WMSContext } from "../../../context/WMSContext"
import Header from "../../../components/Header"
import { ReceptionTelaService } from "../ReceptionTelaService"
import { TelaPickingIsScanning, TelaPickingMerge } from "../ReceptionTela.types"
import { black, blue, grey, navy, orange } from "../../../constants/Colors"
import Icon from 'react-native-vector-icons/FontAwesome5'
import { ReceptionTelaDetalleStyle } from "./ReceptionTelaDetalle.style"
import SoundPlayer from 'react-native-sound-player'
import { ModalSelectColor } from "./modal"

type props = StackScreenProps<RootStackParams, "ReceptionTelaDetalle">

export const ReceptionTelaDetalle: FC<props> = () => {

    const receptionTelaService = new ReceptionTelaService();

    const { WMSState } = useContext(WMSContext);

    const [telaPendiente, setTelaPendiente] = useState<TelaPickingMerge[]>([]);
    const [telaByColor, setTelaByColor] = useState<TelaPickingMerge[]>([]);
    const [telaScanning, setTelaScanning] = useState<TelaPickingMerge[]>([]);
    const [ubicacion, setUbicacion] = useState<string>('');
    const [rollo, setRollo] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const rolloInputRef = useRef<TextInput>(null);
    const ubicacionInputRef = useRef<TextInput>(null);

    useEffect(() => {
        //setModalVisible(!modalVisible);
        getData()
    }, [])

    const getData = async () => {
        if (!isLoading) {
            setIsLoading(true);
            receptionTelaService.postTelaPickingMerge(WMSState.telaJournalId)
                .then((data) => {

                    setTelaPendiente(data.filter(x => x.is_scanning === false));
                    setTelaScanning(data.filter(x => x.is_scanning === true));

                    setIsLoading(false);
                })
        }

    }

    const TelaItem = ({ item }: { item: TelaPickingMerge }) => (
        <View style={{ width: '100%', backgroundColor: !item.is_scanning ? orange : blue, borderRadius: 10, marginBottom: 5, padding: 5 }}>

            <Text style={{ fontWeight: 'bold', color: grey, marginBottom: 2 }}>{item.inventSerialId}</Text>

            <Text style={{ color: grey }} >PR: {item.vendRoll}</Text>
            <Text style={{ color: grey }} >Color: {`${item.nameColor} (${item.inventColorId})`}</Text>
            <Text style={{ color: grey }} >Qty: {item.qty.toFixed(2)}</Text>
            {item.itemId.startsWith('40') && <Text style={{ color: grey }} >RF: {item.reference}</Text>}
            <Text style={{ color: grey }} >{item.itemId}</Text>
            <Text style={{ color: grey }} >{item.inventBatchId}</Text>

        </View>
    );

    const PlaySound = (estado: 'success' | 'error' | 'repeat') => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const updateRollo = (rolloValue: string) => {

        setTelaByColor([]);
        const combinedTelas = [...telaPendiente, ...telaScanning];
        const listColors = combinedTelas.filter(x => x.vendRoll === rolloValue);
        setTelaByColor(telaByColor);

        const isUpdateAll = listColors.length > 0 && listColors.every(x =>
            x.itemId.startsWith('45 02') || x.itemId.startsWith('45 01')
        )


        if (isUpdateAll) {
            const telaPickingIsScanningList: TelaPickingIsScanning[] = listColors.map(({ 
                vendRoll: vendroll, journalId, inventSerialId 
            }) => ({
                ...{ vendroll, journalId, inventSerialId },
                userCode: WMSState.usuario, 
                location: ubicacion 
            }));
            
            sendTelaScanning(telaPickingIsScanningList);
        }else{

            if (listColors.length > 1) {
                PlaySound('repeat');
                setModalVisible(true);
                rolloInputRef.current?.blur();
    
            } else {
                putOneTelaPicking(rolloValue);
            }
        }

    }


    const putOneTelaPicking = (rolloValue: string, scanningRoll?: string | null) => {

        if (!scanningRoll) {
            scanningRoll = telaPendiente.find(x => x.vendRoll == rolloValue)?.inventSerialId;
        }

        if (scanningRoll != undefined) {

            let telaPickingIsScanning: TelaPickingIsScanning[] = [
                {
                    userCode: WMSState.usuario,
                    vendroll: rolloValue,
                    journalId: WMSState.telaJournalId,
                    inventSerialId: scanningRoll,
                    location: ubicacion
                }
            ];

            sendTelaScanning(telaPickingIsScanning);
        }else if(telaScanning.find(x => x.vendRoll == rolloValue)?.inventSerialId) {
            PlaySound('repeat');
            setRollo('');
        } else {
            PlaySound('error');
            setRollo('');
        }

    }

    const sendTelaScanning = (telaPickingIsScanning: TelaPickingIsScanning[]) => {
        receptionTelaService.putTelaPickingIsScanning(telaPickingIsScanning)
            .then(() => {
                setRollo('');
                PlaySound('success');
                getData();
            })
            .catch((err) => {
                PlaySound('error');
            })

    }

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }} >
            <Header texto1='Recepcion de tela' texto2={WMSState.telaJournalId} texto3={telaScanning.length + ' / ' + telaPendiente.length} />

            <ModalSelectColor
                isOpenModal={modalVisible}
                onClose={(value) => {

                    setTelaByColor([]);
                    setModalVisible(false);
                    if (value) {
                        putOneTelaPicking(value.vendRoll, value.inventSerialId);
                    }
                    setRollo('');
                    rolloInputRef.current?.focus();
                }}
                listColors={telaByColor}
                vendRoll={rollo}
            />

            <View style={[ReceptionTelaDetalleStyle.input, { borderColor: rollo != '' || ubicacion === '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center', width: '95%', opacity: ubicacion != '' ? 1 : 0.3 }]}>
                <TextInput
                    placeholder='Rollo'
                    style={[ReceptionTelaDetalleStyle.input, { width: '90%', borderWidth: 0 }]}
                    onChangeText={(value) => {
                        setRollo(value)
                        updateRollo(value)
                    }}
                    value={rollo}
                    onBlur={() => ubicacionInputRef.current?.isFocused() || ubicacion.length >= 1 ? null : rolloInputRef.current?.focus()}
                    ref={rolloInputRef}
                />
                {
                    isLoading ?
                        <ActivityIndicator size={20} />
                        :
                        <TouchableOpacity onPress={() => { setRollo('') }}>
                            <Icon name='times' size={15} color={black} />
                        </TouchableOpacity>
                }
            </View>

            <View style={[ReceptionTelaDetalleStyle.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center', width: '95%' }]}>
                <TextInput

                    placeholder='Ubicacion'
                    style={[ReceptionTelaDetalleStyle.input, { width: '90%', borderWidth: 0 }]}
                    onChangeText={(value) => {
                        setUbicacion(value)
                        rolloInputRef.current?.focus()
                    }}
                    value={ubicacion}
                    ref={ubicacionInputRef}
                />
                <TouchableOpacity onPress={() => { setRollo(''); setUbicacion('') }}>
                    <Icon name='times' size={15} color={black} />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flex: 1, width: '100%', padding: 4 }} >
                <View style={{ flex: 1, padding: 4 }}>
                    <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>PENDIENTE</Text>

                    <FlatList
                        style={{ width: '100%' }}
                        data={telaPendiente}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => <TelaItem item={item} />}
                        keyExtractor={(item) => item.tela_picking_id.toString()}
                    />

                </View>

                <View style={{ flex: 1, padding: 4 }}>
                    <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>ESCANEADO</Text>

                    <FlatList
                        style={{ width: '100%' }}
                        data={telaScanning}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => <TelaItem item={item} />}
                        keyExtractor={(item) => item.tela_picking_id.toString()}
                    />
                </View>
            </View>

        </View>)
}