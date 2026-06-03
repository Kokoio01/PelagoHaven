import {Outlet} from "react-router";
import {HomeIcon} from "lucide-react";

export default function AppLayout() {
    return (

        <div className="flex flex-row h-screen w-screen">
            <aside className="p-4 bg-green-400">
                <nav className="items-center flex flex-col gap-4">
                    <HomeIcon size={32}/>
                </nav>
            </aside>
            <Outlet/>
        </div>
    )
}