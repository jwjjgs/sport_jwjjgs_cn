import React from "react";
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Map from "./pages/Map";

function Routes() {
  return (
    <HashRouter>
      <Switch>
        <Route path="/login" component={Login} />
        <Route
          path="/"
          render={() =>
            !localStorage.getItem("token") ? (
              <Redirect to="/login" />
            ) : (
              <Switch>
                <Route path="/map" component={Map} />
                <Route path="/" component={Home} />
              </Switch>
            )
          }
        />
      </Switch>
    </HashRouter>
  );
}
export default Routes;
