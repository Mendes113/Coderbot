import { useState } from "react";
import { ChatInterface as ChatComponent } from "@/components/chat/ChatInterface";
import { pb } from "@/integrations/pocketbase/client";

const methodologies = [
	{ id: "default", name: "Padrão" },
	{ id: "sequential_thinking", name: "Pensamento Sequencial" },
	{ id: "analogy", name: "Analogia" },
	{ id: "socratic", name: "Socrático" },
	{ id: "scaffolding", name: "Scaffolding" },
	{ id: "worked_examples", name: "Worked Example" },
];

const ChatInterface = ({ whiteboardContext }: { whiteboardContext?: any }) => {
	const userId = pb.authStore.model?.id;
	const [methodology, setMethodology] = useState("default");
	if (!userId) return null;
	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center gap-2 p-2 border-b bg-neutral-900">
				<label
					htmlFor="methodology-select"
					className="text-xs text-neutral-300"
				>
					Metodologia:
				</label>
				<select
					id="methodology-select"
					className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-600"
					value={methodology}
					onChange={(e) => setMethodology(e.target.value)}
				>
					{methodologies.map((m) => (
						<option key={m.id} value={m.id}>
							{m.name}
						</option>
					))}
				</select>
			</div>
			<div className="flex-1">
				<ChatComponent
					userId={userId}
					methodology={methodology}
					whiteboardContext={whiteboardContext}
				/>
			</div>
		</div>
	);
};

export default ChatInterface;
