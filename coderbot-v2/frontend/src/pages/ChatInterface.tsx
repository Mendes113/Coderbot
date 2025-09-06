import { ChatInterface as ChatComponent } from "@/components/chat/ChatInterface";
import { pb } from "@/integrations/pocketbase/client";

const ChatInterface = ({ whiteboardContext }: { whiteboardContext?: any }) => {
	const userId = pb.authStore.model?.id;
	console.log("ChatInterface - userId:", userId); // Debug log
	
	if (!userId) {
		console.log("No userId found, component will not render"); // Debug log
		return (
			<div className="flex flex-col items-center justify-center h-full">
				<p className="text-red-500">Usuário não autenticado. Por favor, faça login.</p>
			</div>
		);
	}
	
	return (
		<div className="flex flex-col h-full">
				<ChatComponent
					userId={userId}
					whiteboardContext={whiteboardContext}
				/>
		</div>
	);
};

export default ChatInterface;
