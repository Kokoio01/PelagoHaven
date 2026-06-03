import React from "react";
import ReactDOM from "react-dom/client";
import {HashRouter, Route, Routes} from "react-router";
import AppLayout from "./layouts/appLayput.tsx";
import Home from "./routes/home.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <HashRouter>
          <Routes>
              <Route element={<AppLayout/>}>
                  <Route index element={<Home />} />
              </Route>
          </Routes>
      </HashRouter>
  </React.StrictMode>,
);
