import React from "react";
import ReactDOM from "react-dom/client";
import {HashRouter, Route, Routes} from "react-router";
import {AppLayout} from "./layouts/appLayput.tsx";
import Home from "./routes/home.tsx";
import Settings from "./routes/settings.tsx";
import Library from "@/routes/library.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <HashRouter>
          <Routes>
              <Route element={<AppLayout/>}>
                  <Route index element={<Home />} />
                  <Route path="settings" element={<Settings />}/>
                  <Route path="library" element={<Library/>}/>
              </Route>
          </Routes>
      </HashRouter>
  </React.StrictMode>,
);
