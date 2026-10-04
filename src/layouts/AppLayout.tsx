import {Outlet} from "react-router";
import {invoke} from "@tauri-apps/api/core";
import {useEffect, useState} from "react";
import Setup from "../pages/Setup.tsx";

type StatusResponse = {
    status: boolean,
    python: boolean,
    core: boolean
}

export default function AppLayout() {
    const [completedSetup, setCompletedSetup] = useState<boolean | undefined>()

    async function getStatus() {
        setCompletedSetup((await invoke<StatusResponse>("bootstrap_check_status")).status)
    }

    useEffect(() => {
        getStatus()
    }, [])

    return (
        <div className="bg-stone-900 text-white w-screen h-screen">
            {(!completedSetup && true) ? <Setup/> : <Outlet/>}
        </div>
    )
}