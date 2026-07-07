import {useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {Button} from "@/components/ui/button.tsx";

interface APWorld {
    game: string
}

export default function Home() {
    const [name, setName] = useState("")

    function greet() {
        invoke<APWorld>("login", {username: name}).then((message) => setName(message.game))
    }

    return (
        <main>
            <div>
                <h1>Welcome to PelagoHaven!</h1>
            </div>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={greet}>
                <p>p</p>
            </Button>
        </main>
    )
}