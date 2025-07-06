import { ChatInterface as ChatComponent } from "@/components/chat/ChatInterface";
import { pb } from "@/integrations/pocketbase/client";

const ChatInterface = ({ whiteboardContext }: { whiteboardContext?: any }) => {
	const userId = pb.authStore.model?.id;
	if (!userId) return null;
	return (
		<div className="h-full flex flex-col">
			<div className="flex-1">
				<ChatComponent
					userId={userId}
					whiteboardContext={whiteboardContext}
				/>
			</div>
		</div>
	);
};

export default ChatInterface;
