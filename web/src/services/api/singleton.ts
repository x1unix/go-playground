import environment from "~/environment";
import * as axios from "axios";
import {Client} from "./client";

const createClient = () => {
  const apiAddress = `${environment.apiUrl}/api`;
  const axiosClient = axios.default.create({ baseURL: apiAddress });

  return new Client(axiosClient);
}

const instance = createClient();
export default instance;
