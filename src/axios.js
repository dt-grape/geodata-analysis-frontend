import axios from "axios";

const instance = axios.create({
    baseURL: "https://api-geodata.novichikhin.com/",
});

export default instance;