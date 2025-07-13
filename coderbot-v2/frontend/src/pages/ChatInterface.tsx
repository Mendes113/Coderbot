import { ChatInterface as ChatComponent } from "@/components/chat/ChatInterface";
import { pb } from "@/integrations/pocketbase/client";

const ChatInterface = ({ whiteboardContext }: { whiteboardContext?: any }) => {
	const userId = pb.authStore.model?.id;
	if (!userId) return null;
	return (
		<div className="h-screen flex flex-col">
				<ChatComponent
					userId={userId}
					whiteboardContext={whiteboardContext}
				/>
		</div>
	);
};

export default ChatInterface;
