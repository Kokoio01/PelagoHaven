import {Outlet} from "react-router";

export default function AppLayout() {
    return (
        <div className="bg-stone-900 text-white w-screen h-screen">
            <Outlet/>
        </div>
    )
}