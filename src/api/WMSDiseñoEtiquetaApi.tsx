import axios from 'axios';
import { URLDiseñoEtiquetas } from '../constants/api';


export const WMSDiseñoEtiquetaApi = axios.create({
    baseURL: URLDiseñoEtiquetas,
    headers: {
        'Content-Type': 'application/json'
    }
});