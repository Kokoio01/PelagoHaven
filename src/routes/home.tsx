import {useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {Button} from "@/components/ui/button.tsx";

export default function Home() {
    const [name, setName] = useState("")
    const [anwser, setAnwser] = useState("")

    function greet() {
        invoke<string>("get_game_options", { gameName: name })
            .then((message) => {
                console.log(message)
                setAnwser(JSON.stringify(message, null, 2));
            })
            .catch((err) => console.error("Tauri Error:", err));
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
            <p>
                {anwser}
            </p>
        </main>
    )
}