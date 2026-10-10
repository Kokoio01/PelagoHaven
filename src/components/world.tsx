import {MinimalWorld} from "../types/worlds.ts";

export function WorldCard({ world }: { world: MinimalWorld }) {
    if (world.grid) return (<img src={world.grid} alt={world.name + "grid image"} className="rounded-xl"></img>);
    else {
        return (<div className="bg-linear-to-t from-black to-stone-950 text-stone-300 w-full h-full rounded-xl content-center text-center p-2">
                    <p>{world.name}</p>
                </div>)
    }
}