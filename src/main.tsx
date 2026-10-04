import React from "react";
import ReactDOM from "react-dom/client";
import {HashRouter, Route, Routes} from "react-router";
import AppLayout from "./layouts/AppLayout.tsx";
import "./App.css";
import App from "./pages/App.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <HashRouter>
          <Routes>
              <Route element={<AppLayout/>}>
                <Route index element={<App/>}/>
              </Route>
          </Routes>
      </HashRouter>
  </React.StrictMode>,
);
