import {useEffect, useState} from "react";
import {Channel, invoke} from "@tauri-apps/api/core";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "../components/select.tsx";
import {Button} from "../components/button.tsx";

export type Step = "welcome" | "select_version" | "installing"

type APVerison = {
    name: string,
    tag_name: string,
    prerelease: boolean
}

type InstallProgress = {
    step: "python" | "extracting_python" | "ap" | "extracting_ap" | "installing_ap" | "testing_ap",
    percent: number,
}

export default function Setup() {
    const installChannel = new Channel<InstallProgress>()
    const [step, setStep] = useState<Step>("welcome")

    const [versions, setVersions] = useState<APVerison[]>([])
    const [selectedVersion, setSelectedVersion] = useState<string | null>("")

    const [status, setStatus] = useState<InstallProgress | undefined>()

    async function getVersionsFromApi() {
        setVersions((await invoke<APVerison[]>("bootstrap_get_ap_versions")))
    }

    async function startInstall() {
        try {
            await invoke<string>("bootstrap_install", {apversion: selectedVersion, onProgress: installChannel});
        } catch (e) {
            console.error(e);
        }
    }

    installChannel.onmessage = (m) => {
        console.log(m)
        setStatus(m)
    };

    useEffect(() => {
        switch (step) {
            case "select_version": {
                getVersionsFromApi()
                return
            }
            case "installing": {
                startInstall()
                return;
            }
        }
    },[step])


    return (
        <main className="relative h-full">
            <img
                src="https://images.unsplash.com/photo-1604065780813-1a33b65688fe?q=80&w=2233&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                className="absolute inset-0 h-full w-full object-cover z-0"
                alt="PelagoHaven Background"
            />
            <div className="absolute inset-0 bg-black/40 z-10" />
            <div className="relative flex flex-col justify-between h-full p-4 z-10">
                <div>
                    <div className="bg-stone-100 w-full h-2 rounded-full"></div>
                </div>
                { step === "welcome" ?
                    <div className="flex justify-between p-2 items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome to Pelago Haven</h1>
                            <p className="text-sm text-stone-300">An alternative, third-party Archipelago
                                Launcher</p>
                        </div>
                        <Button
                            onClick={() => setStep("select_version")}
                        >
                            Get Started
                        </Button>
                    </div> : null
                }
                { step === "select_version" ?
                    <div className="flex justify-between p-2 w-full">
                        <div>
                            <h1 className="text-2xl font-bold">Select your Archipelago Version</h1>
                            <p className="text-sm text-stone-300">Versions are pulled from the official Github Repo</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Select
                                items={versions.map((v) => {return {label: v.name, value :v.tag_name};})}
                                onValueChange={(e) => setSelectedVersion(e)}
                                value={selectedVersion}
                            >
                                <SelectTrigger className="min-w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="no-scrollbar">
                                    <SelectGroup>
                                        <SelectLabel>Versions</SelectLabel>
                                        {versions.map((v) => (
                                            <SelectItem key={v.tag_name} value={v.tag_name}>
                                                {v.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={() => setStep("installing")}
                            >
                                Continue
                            </Button>
                        </div>
                    </div> : null
                }
                { step === "installing" ?
                    <div>
                        <p>{status?.step}</p>
                        <p>{status?.percent}</p>
                    </div> : null
                }
            </div>
        </main>
    );
}
