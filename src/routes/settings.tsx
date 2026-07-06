import {useState} from "react";
import MainSettings from "../components/settings/main.tsx";
import {SecondSettings} from "../components/settings/second.tsx";
import {EggFriedIcon, SettingsIcon} from "lucide-react";

const tabs = [
    { side: "Main", title: "Main Settings", icon: <SettingsIcon/> ,element: <MainSettings/> },
    { side: "Second", title: "Second Settings", icon: <EggFriedIcon/> ,element: <SecondSettings/>}
]
export default function Settings() {
    const [selectedTab, setSelectedTab] = useState("Main")
    const tab = tabs.find(tab => tab.side === selectedTab) || tabs[0];

    return (
        <main className="flex flex-col gap-6 h-full">
            <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-4xl min-w-1/4">Settings</h1>
                <h2 className="font-bold text-3xl pl-6.5">{tab.title}</h2>
            </div>
            <div className="flex gap-4 h-full">
                <aside className="flex flex-col min-w-1/4">
                    { tabs.map(tab => (
                        <button
                            className={`flex items-center gap-1 p-2 rounded-xl border-2 transition active:scale-95 duration-150 ${
                                selectedTab === tab.side ? "border-accent text-accent" : "border-transparent hover:bg-muted hover:text-highlight"
                            }`}
                            onClick={() => setSelectedTab(tab.side)}
                            key={tab.side}
                        >
                            {tab.icon}
                            <span>{tab.side}</span>
                        </button>
                    ))}
                </aside>
                <div className="w-0.5 bg-muted rounded-2xl"/>
                <div className="flex-1">
                    { tab.element }
                </div>
            </div>
        </main>
    )
}