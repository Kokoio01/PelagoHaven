import {Link, Outlet, useLocation} from "react-router";
import {HomeIcon, MaximizeIcon, MinimizeIcon, MinusIcon, SettingsIcon, ShelvingUnitIcon, XIcon} from "lucide-react";
import {platform} from "@tauri-apps/plugin-os";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";

const tabs = [
    { name: "Home", path: "/", icon: <HomeIcon size={28}/> },
    { name: "Library", path: "/library", icon: <ShelvingUnitIcon size={28}/>},
    { name: "Settings", path: "/settings", icon: <SettingsIcon size={28}/>}
]

export function AppLayout() {
    const isMacOs = platform() === "macos"
    const appWindow = getCurrentWindow();
    const [isMaximised, setIsMaximised] = useState(false)
    const location = useLocation();
    const currentTab = tabs.find((tab) => tab.path === location.pathname);

    useEffect(() => {
        (async () => {
            setIsMaximised(await appWindow.isMaximized());
        })();
    }, []);

    function toggleMaximize() {
        appWindow.toggleMaximize()
        setIsMaximised(!isMaximised)
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-chrome text-primary">
            <header data-tauri-drag-region className="flex h-10 items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    {isMacOs ? <div className="w-14"/> : <div/>}
                    <h1 className="text-lg font-sans">PelagoHaven</h1>
                </div>
                {!isMacOs ?
                    <div className="flex">
                        <Button size="icon-lg" variant="ghost" onClick={() => appWindow.minimize()}>
                            <MinusIcon/>
                        </Button>
                        <Button size="icon-lg" variant="ghost" onClick={toggleMaximize}>
                            {isMaximised ? <MinimizeIcon/> : <MaximizeIcon/>}
                        </Button>
                        <Button size="icon-lg" variant="ghost" onClick={() => appWindow.close()}>
                            <XIcon/>
                        </Button>
                    </div> : <div/>
                }

            </header>
            <div className="flex flex-1 flex-row min-w-0">
                <aside className="h-full p-4 w-16">
                    <nav className="h-full items-center flex flex-col gap-6">
                        { tabs.map(tab => (
                            <Link to={tab.path} key={tab.name} className="relative transition active:scale-95 duration-150">
                                {tab.icon}
                                { currentTab?.name === tab.name ? <div className="absolute bg-accent w-2 top-0 bottom-1 right-10 rounded-r-4xl" /> : undefined}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <div className="rounded-tl-2xl bg-background text-amber-50 overflow-y-auto w-full p-6">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}