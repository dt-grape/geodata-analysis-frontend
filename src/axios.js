import axios from "axios";

const instance = axios.create({
    baseURL: "http://api.geodata.novichikhin.com/",
});

export default instance;