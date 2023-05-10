import * as axios from "axios";
import environment from "~/environment";
import { Client } from "./client";

export * from "./models";
export * from "./client";
export * from "./interface";
export * from "./utils";

const apiAddress = `${environment.apiUrl}/api`;
const axiosClient = axios.default.create({ baseURL: apiAddress });

export default new Client(axiosClient);
