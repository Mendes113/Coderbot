import { useEffect, useState } from "react";
import { ChatInterface as ChatComponent } from "@/components/chat/ChatInterface";
import { pb } from "@/integrations/pocketbase/client";

const ChatInterface = ({ whiteboardContext }: { whiteboardContext?: any }) => {
	const [userId, setUserId] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuth = () => {
			const currentUserId = pb.authStore.model?.id;
			console.log("ChatInterface - userId:", currentUserId); // Debug log
			setUserId(currentUserId);
			setIsLoading(false);
		};

		checkAuth();

		// Listen for auth changes
		const unsubscribe = pb.authStore.onChange(() => {
			checkAuth();
		});

		return () => unsubscribe();
	}, []);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-full">
				<p className="text-gray-500">Carregando...</p>
			</div>
		);
	}

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
