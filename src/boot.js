import { message as Msg } from "antd";
import axios from "axios";
import { HashRouter } from "react-router-dom";

const router = new HashRouter();

axios.defaults.withCredentials = false;
axios.defaults.baseURL = "https://upes.legym.cn/";
axios.defaults.headers.post["Content-Type"] =
  "application/json;; charset=utf-8";
axios.interceptors.request.use((config) => {
  if ("post" === config.method.toLowerCase() && typeof config.data === "object")
    config.data = JSON.stringify(config.data);
  const token = localStorage.getItem("token");
  if (token) config.headers.authorization = token;
  return config;
});

axios.interceptors.response.use(
  (res) => {
    const {
      data: { code, message, data },
    } = res;
    if (code !== 0) {
      const _message = message || "未知原因";
      Msg.warning({
        content: _message,
        key: _message,
      });
      return Promise.reject();
    }
    if (message)
      Msg.success({
        content: message,
        key: message,
      });
    return data;
  },
  (err) => {
    const {
      response: {
        status,
        data: { error_description },
      },
    } = err;
    if (status === 401) {
      const _message = "登录失效";
      Msg.warning({
        content: _message,
        key: _message,
      });
      localStorage.clear("token");
      router.history.push("/login");
    } else {
      const _message = error_description;
      Msg.warning({
        content: _message,
        key: _message,
      });
    }
  }
);
