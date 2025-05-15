import { StackScreenProps } from "@react-navigation/stack"
import { FC, useContext, useEffect, useRef, useState, } from "react"
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, FlatList, Alert } from "react-native"
import { RootStackParams } from "../../../../navigation/navigation"
import { WMSContext } from "../../../../context/WMSContext"
import Header from "../../../../components/Header"
import { ReceptionTelaService } from "../ReceptionTelaService"
import { ActualCount, Impresoras, TelaPickingDefecto, TelaPickingIsScanning, TelaPickingMerge, TelaPickingRule, TelaPickingUpdate } from "../ReceptionTela.types"
import { black, blue, green, grey, navy, orange } from "../../../../constants/Colors"
import Icon from 'react-native-vector-icons/FontAwesome5'
import { ReceptionTelaDetalleStyle } from "./ReceptionTelaDetalle.style"
import SoundPlayer from 'react-native-sound-player'
import { ModalSelectColor, ModalSelectDefecto, ModalRuleCount, ModalPrint } from "./modal"

type props = StackScreenProps<RootStackParams, "ReceptionTelaDetalle">

export const ReceptionTelaDetalle: FC<props> = () => {

    const receptionTelaService = new ReceptionTelaService();

    const { WMSState } = useContext(WMSContext);

    const [telaPendiente, setTelaPendiente] = useState<TelaPickingMerge[]>([]);
    const [telaByColor, setTelaByColor] = useState<TelaPickingMerge[]>([]);
    const [telaScanning, setTelaScanning] = useState<TelaPickingMerge[]>([]);
    const [listTelaPickingDefecto, setListTelaPickingDefecto] = useState<TelaPickingDefecto[]>([]);
    const [listRule, setListRule] = useState<TelaPickingRule[]>([]);
    const [listaImpresoras, setListaImpresoras] = useState<Impresoras[]>([]);
    const [actualCountFind, setActualCountFind] = useState<ActualCount | null>(null);
    const [listActualCount, setListActualCount] = useState<ActualCount[]>([]);
    const [selectedRollo, setSelectedRollo] = useState<TelaPickingMerge | null>(null);

    const [ubicacion, setUbicacion] = useState<string>('');
    const [rollo, setRollo] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isModalDefectoVisible, setIsModalDefectoVisible] = useState(false);
    const [isModalCount, setIsModalCount] = useState(false);
    const [isChangeDefecto, setIsChangeDefecto] = useState(false);
    const [isModalPrint, setIsModalPrint] = useState(false);
    const [isSendEmail, setIsSendEmail] = useState(false);
    const [isChnageLocation, setIsChangeLocation] = useState(false);
    const [isPrint, setIsPrint] = useState(false);

    const rolloInputRef = useRef<TextInput>(null);
    const ubicacionInputRef = useRef<TextInput>(null);

    useEffect(() => {

        receptionTelaService.getDataList()
            .then(data => {
                setListTelaPickingDefecto(data.defecto);
                setListRule(data.rules);
                setListaImpresoras(data.impresoras);
                getData()
            });

    }, [])

    useEffect(() => {
        if (isChangeDefecto === false) {

            setListActualCount([]);
            setListActualCount(prevList => {
                let updatedList = [...prevList];
                telaScanning.map(item => {
                    updatedList = setConteo(item, updatedList, listRule);
                });
                return updatedList;
            });
        }
    }, [telaScanning, listRule]);


    const setConteo = (item: TelaPickingMerge | TelaPickingUpdate, listActualCount: ActualCount[], listRule: TelaPickingRule[]) => {
        const newList = [...listActualCount];
        const cumpleRegla = listRule.find(rule => item.itemId.startsWith(rule.startWith));

        if (cumpleRegla) {
            let ubicacion = newList.find(rule => rule.location === item.location);

            if (ubicacion) {
                const updatedUbicacion = { ...ubicacion, qtyActual: ubicacion.qtyActual + 1 };

                if (updatedUbicacion.qtyActual === cumpleRegla.maxCount) {
                    updatedUbicacion.isComplete = true;
                }

                newList[newList.indexOf(ubicacion)] = updatedUbicacion;
            } else {
                newList.push({
                    location: item.location ?? '',
                    qtyActual: 1,
                    maxCount: cumpleRegla.maxCount,
                    isComplete: false
                });
            }
        }

        return newList;
    };

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

            <View style={{ flexDirection: 'row', justifyContent: item.is_scanning ? 'space-around' : 'flex-start', marginBottom: 4 }} >
                {
                    item.is_scanning &&
                    (<>
                        <Icon name='print'
                            size={20}
                            color={grey}
                            onPress={() => {

                                setSelectedRollo(item);
                                setIsModalPrint(true);
                            }}>
                        </Icon>
                    </>)
                }
                <Text style={{ fontWeight: 'bold', color: grey }}>{item.inventSerialId}</Text>

                {
                    item.is_scanning &&
                    (<>
                        <Icon name='edit'
                            size={20}
                            color={grey}
                            onPress={() => {

                                setSelectedRollo(item);
                                setIsModalDefectoVisible(true);
                            }}>
                        </Icon>
                    </>)
                }

            </View>


            <Text style={{ color: grey }} >PR: {item.vendRoll}</Text>

            <Text style={{ color: grey }} >Color: {`${item.nameColor} (${item.inventColorId})`}</Text>
            <Text style={{ color: grey }} >Qty: {item.qty.toFixed(2)}</Text>
            {item.location !== null && <Text style={{ color: grey }} >Ubicación: {item.location}</Text>}
            {item.itemId.startsWith('40') && <Text style={{ color: grey }} >Tela: {item.reference}</Text>}
            <Text style={{ color: grey }} >{item.itemId}</Text>
            <Text style={{ color: grey }} >{item.inventBatchId}</Text>
            {item.descriptionDefecto && <Text style={{ color: grey, borderTopWidth: 1, borderColor: '#fff', marginTop: 8 }} >Observación : {item.descriptionDefecto}</Text>}

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
        setTelaByColor(listColors);

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
        } else {

            if (listColors.length > 1 && listColors.some(x => x.is_scanning === false)) {
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

        const findScaning = [...telaPendiente, ...telaScanning].filter(x => x.vendRoll == rolloValue);

        if (scanningRoll !== undefined) {

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
        } else if (findScaning.length >= 1 && scanningRoll === undefined) {


            PlaySound('repeat');

            if ([...findScaning].filter(x => x.location !== ubicacion).length >= 1) {

                setIsChangeLocation(true)
                setTelaByColor(findScaning);
                setModalVisible(true);

            } else {

                rolloInputRef.current?.blur();
                rolloInputRef.current?.focus();

                setRollo('');
            }

        } else {

            PlaySound('error');
            setRollo('');
        }



    }

    const sendTelaScanning = (telaPickingIsScanning: TelaPickingIsScanning[], isUpdateDefecto?: boolean) => {

        let actuaCount: ActualCount | null = null;


        if (isUpdateDefecto !== true) {

            telaPickingIsScanning.filter(rollo => {
                const ubicacion = listActualCount.find(actual => actual.location === rollo.location);

                if (ubicacion?.isComplete) {
                    actuaCount = ubicacion;
                }

                return !ubicacion?.isComplete;
            });
        } else {
            setIsChangeDefecto(isChangeDefecto);
        }


        setActualCountFind(actuaCount);

        if (actuaCount === null) {
            receptionTelaService.putTelaPickingIsScanning(telaPickingIsScanning)
                .then((response) => {

                    if (isUpdateDefecto !== true) {
                        setListActualCount(prevList => {
                            let updatedList = [...prevList];
                            response.map(item => {
                                updatedList = setConteo(item, updatedList, listRule);
                            });

                            return updatedList;
                        });
                    }

                    setRollo('');
                    PlaySound('success');
                    setIsChangeLocation(false);
                    getData();

                })
                .catch((err) => {
                    setIsChangeLocation(false);
                    PlaySound('error');
                })
        } else {

            setIsModalCount(true);
            PlaySound('repeat');
        }

    }

    const sendEmail = () => {
        setIsSendEmail(true);

        receptionTelaService.EnviarCorreoDeRecepcionDeTela(WMSState.telaJournalId)
            .then(() => {
                setIsSendEmail(false);
            })
            .catch(() => {
                setIsSendEmail(false);
            })
    }

    const printEtiquetas = (ipPrint: string, selectedRollo: TelaPickingMerge | null) => {
        setIsPrint(true);

        const telaScanningByRack = telaScanning.filter(x => x.location === ubicacion);
        const telaToPrint = selectedRollo ? [selectedRollo] : telaScanningByRack;

        receptionTelaService
            .postPrintEtiquetasTela(ipPrint, telaToPrint)
            .then(() => {
                setIsPrint(false);
            })
            .catch((e) => {
                Alert.alert(
                    'Error al imprimir',
                    'No se pudo imprimir la etiqueta. Si el problema persiste, contacte con soporte.',
                    [{ text: 'OK' }]
                );
                setIsPrint(false);
            })
    }

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }} >

            <Header
                texto1={WMSState.telaJournalId}
                texto2={'Rollos : ' + telaScanning.length + ' / ' + (telaScanning.length + telaPendiente.length)}
                texto3={ubicacion && listActualCount.find(x => x.location === ubicacion) ? `Ubicacion: ${listActualCount.find(x => x.location === ubicacion)?.qtyActual} / ${listActualCount.find(x => x.location === ubicacion)?.maxCount}` : ''}
            />

            <ModalPrint
                selectedRollo={selectedRollo}
                isOpenModal={isModalPrint}
                journalId={WMSState.telaJournalId}
                onClose={(value, rolloToPrint) => {
                    if (value) {

                        printEtiquetas(value, rolloToPrint);
                    }

                    setIsModalPrint(false);
                    setSelectedRollo(null);
                }}
                listaImpresoras={listaImpresoras}
            />

            <ModalRuleCount
                isOpenModal={isModalCount}
                onClose={() => {
                    setIsModalCount(false);
                    setUbicacion('');
                    ubicacionInputRef.current?.focus();
                    setRollo('');
                }}
                limiteAlcanzado={actualCountFind?.maxCount ?? 0}
                location={ubicacion}
            />
            <ModalSelectDefecto
                isOpenModal={isModalDefectoVisible}
                onClose={(value) => {

                    if (value) {
                        let telaPickingIsScanning: TelaPickingIsScanning[] = [
                            {
                                userCode: WMSState.usuario,
                                vendroll: selectedRollo?.vendRoll ?? '',
                                journalId: WMSState.telaJournalId,
                                inventSerialId: selectedRollo?.inventSerialId ?? '',
                                location: ubicacion,
                                telaPickingDefectoId: value.telaPickingDefectoId
                            }
                        ];

                        sendTelaScanning(telaPickingIsScanning, true);
                    }
                    setIsModalDefectoVisible(false);
                    setSelectedRollo(null);
                }}
                listDefecto={listTelaPickingDefecto}
                selectedRollo={selectedRollo}
            />

            <ModalSelectColor
                isOpenModal={modalVisible}
                onClose={(value) => {

                    setTelaByColor([]);
                    setModalVisible(false);
                    if (value) {
                        if (isChnageLocation) value.location = ubicacion;
                        putOneTelaPicking(value.vendRoll, value.inventSerialId);
                    }
                    setRollo('');
                    rolloInputRef.current?.focus();
                }}
                listColors={telaByColor}
                title={isChnageLocation ? '¿Cambio de ubicación?' : 'PR: ' + rollo}
            />


            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, gap: 8 }} >
                <View style={[ReceptionTelaDetalleStyle.input, { borderColor: rollo != '' || ubicacion === '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center', flex: 1, opacity: ubicacion != '' ? 1 : 0.3 }]}>
                    <TextInput
                        ref={rolloInputRef}
                        placeholder='Rollo'
                        onSubmitEditing={() => {
                            rolloInputRef.current?.focus();
                        }}
                        style={[ReceptionTelaDetalleStyle.input, { width: '90%', borderWidth: 0 }]}
                        onChangeText={(value) => {
                            const valuSinLetras = value.replace(/\D/g, '');
                            setRollo(valuSinLetras);
                            updateRollo(valuSinLetras);
                        }}
                        value={rollo}


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

                <TouchableOpacity
                    onPress={() => sendEmail()}
                    style={{ backgroundColor: green, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 3, width: '10%' }}
                    disabled={isSendEmail}
                >
                    {
                        isSendEmail ?
                            <ActivityIndicator />
                            :
                            <Icon name='check' size={15} color={black} />
                    }

                </TouchableOpacity>
            </View>




            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, gap: 8 }}>
                <View style={[ReceptionTelaDetalleStyle.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center', flex: 1 }]}>
                    <TextInput
                        placeholder='Ubicacion'
                        style={[ReceptionTelaDetalleStyle.input, { width: '90%', borderWidth: 0 }]}
                        onKeyPress={(e) => {

                            if (e.nativeEvent.key === 'Enter') {
                                rolloInputRef.current?.focus()
                            }
                        }}
                        onChangeText={(value) => {
                            setUbicacion(value)
                        }}
                        value={ubicacion}
                        ref={ubicacionInputRef}
                    />
                    <TouchableOpacity onPress={() => { setRollo(''); setUbicacion('') }}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => setIsModalPrint(true)}
                    style={{ backgroundColor: blue, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 3, width: '10%' }}
                    disabled={isPrint}
                >
                    {
                        isPrint ?
                            <ActivityIndicator color="#fff" />
                            :
                            <Icon name='print' size={15} color='#fff' />
                    }

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