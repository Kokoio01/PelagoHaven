import {Link, Outlet} from "react-router";
import {invoke} from "@tauri-apps/api/core";
import {useEffect, useState} from "react";
import Setup from "../pages/Setup.tsx";
import {HugeiconsIcon} from "@hugeicons/react";
import {
    ArrowLeft02Icon,
    ArrowRight02Icon,
    Home09Icon, LibraryIcon,
    MinusIcon,
    Settings05Icon, SquareArrowExpand01Icon, SquareArrowShrink01Icon, XIcon
} from "@hugeicons/core-free-icons";
import {getCurrentWindow} from "@tauri-apps/api/window";

type StatusResponse = {
    status: boolean,
    python: boolean,
    core: boolean
}

export default function AppLayout() {
    const [completedSetup, setCompletedSetup] = useState<boolean | undefined>()
    const appWindow = getCurrentWindow()
    const [maximized, setMaximized] = useState<boolean>(false)

    async function getStatus() {
        setCompletedSetup((await invoke<StatusResponse>("bootstrap_check_status")).status)
    }

    appWindow.onResized(async () => {
        setMaximized(await appWindow.isMaximized())
    })

    useEffect(() => {
        getStatus()
    }, [])

    return (
        <div className="bg-stone-900 text-stone100 w-screen h-screen overflow-hidden">
            {(!completedSetup && true) ? <Setup/> :
                <div className="flex flex-col h-full w-full">
                    <header data-tauri-drag-region className="flex pl-2.5 pr-1 py-2 justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-sans">PelagoHaven</h1>
                            <div className="flex text-stone-400">
                                <HugeiconsIcon icon={ArrowLeft02Icon} onClick={() => window.navigation.back()}/>
                                <HugeiconsIcon icon={ArrowRight02Icon} onClick={() => window.navigation.forward()}/>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center text-stone-400 scale-80">
                            <HugeiconsIcon icon={MinusIcon} onClick={() => appWindow.minimize()}/>
                            {maximized ?
                                <HugeiconsIcon icon={SquareArrowShrink01Icon} onClick={() => appWindow.toggleMaximize()}/> :
                                <HugeiconsIcon icon={SquareArrowExpand01Icon} onClick={() => appWindow.toggleMaximize()}/>
                            }
                            <HugeiconsIcon icon={XIcon} onClick={() => appWindow.close()}/>
                        </div>
                    </header>
                    <div className="flex flex-1 w-full min-h-0">
                        <aside className="flex flex-col h-full justify-between p-4 shrink-0">
                            <div className="flex flex-col items-center gap-4">
                                <Link to="/"><HugeiconsIcon icon={Home09Icon}/></Link>
                                <Link to="/library"><HugeiconsIcon icon={LibraryIcon}/></Link>
                            </div>
                            <div>
                                <Link to="/settings"><HugeiconsIcon icon={Settings05Icon}/></Link>
                            </div>
                        </aside>
                        <div className="flex-1 min-w-0 min-h-0 border-l border-t rounded-tl-2xl p-4 overflow-hidden">
                            <Outlet/>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}