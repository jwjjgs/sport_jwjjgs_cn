import { UseRequestProvider } from "ahooks";
import axios from "axios";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Routes from "./Routes";
import "./boot";

ReactDOM.render(
  <UseRequestProvider
    value={{
      requestMethod: (param) => axios(param),
    }}
  >
    <Routes />
  </UseRequestProvider>,
  document.getElementById("root")
);
