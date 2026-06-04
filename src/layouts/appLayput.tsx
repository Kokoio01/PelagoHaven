import {Outlet} from "react-router";
import {HomeIcon, SettingsIcon, ShelvingUnitIcon} from "lucide-react";

export function AppLayout() {
    return (

        <div className="flex flex-col h-screen w-screen bg-foreground">
            <header data-tauri-drag-region className="flex h-10 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-14"/>
                    <h1 className="text-lg font-sans">PelagoHaven</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-row min-w-0">
                <aside className="h-full p-4 w-16">
                    <nav className="h-full items-center justify-between flex flex-col gap-4">
                        <div className="flex flex-col gap-4 items-center">
                            <HomeIcon size={28}/>
                            <ShelvingUnitIcon size={28}/>
                        </div>
                        <SettingsIcon size={28}/>
                    </nav>
                </aside>
                <div className="rounded-tl-2xl bg-background text-amber-50 overflow-y-auto w-full p-4">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}