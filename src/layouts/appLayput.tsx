import {Link, Outlet, useLocation} from "react-router";
import {HomeIcon, SettingsIcon, ShelvingUnitIcon} from "lucide-react";

const tabs = [
    { name: "Home", path: "/", icon: <HomeIcon size={28}/> },
    { name: "Library", path: "/library", icon: <ShelvingUnitIcon size={28}/>},
    { name: "Settings", path: "/settings", icon: <SettingsIcon size={28}/>}
]

export function AppLayout() {
    const location = useLocation();
    const currentTab = tabs.find((tab) => tab.path === location.pathname);

    return (
        <div className="flex flex-col h-screen w-screen bg-chrome text-text">
            <header data-tauri-drag-region className="flex h-10 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-14"/>
                    <h1 className="text-lg font-sans">PelagoHaven</h1>
                </div>
            </header>
            <div className="flex flex-1 flex-row min-w-0">
                <aside className="h-full p-4 w-16">
                    <nav className="h-full items-center flex flex-col gap-6">
                        { tabs.map(tab => (
                            <Link to={tab.path} key={tab.name} className="relative">
                                {tab.icon}
                                { currentTab?.name === tab.name ? <div className="absolute bg-accent w-2 top-0 bottom-1 right-10 rounded-r-4xl" /> : undefined}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <div className="rounded-tl-2xl bg-background text-amber-50 overflow-y-auto w-full p-4">
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}