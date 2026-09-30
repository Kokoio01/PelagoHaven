import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/App.tsx";
import {HashRouter, Route, Routes} from "react-router";
import AppLayout from "./layouts/AppLayout.tsx";

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
