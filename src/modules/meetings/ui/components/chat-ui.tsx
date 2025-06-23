/** @format */

import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	useCreateChatClient,
	Chat,
	Channel,
	MessageInput,
	MessageList,
	Window,
	Thread,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import type { Channel as StreamChannel } from "stream-chat";
interface ChatUIProps {
	meetingId: string;
	meetingName: string;
	userId: string;
	userName: string;
	userImage: string | undefined;
}

export const ChatUI = ({
	meetingId,
	meetingName,
	userId,
	userName,
	userImage,
}: ChatUIProps) => {
	const trpc = useTRPC();

	const { mutateAsync: generateChaToken } = useMutation(
		trpc.meetings.generateChatToken.mutationOptions(),
	);

	const [channel, setChannel] = useState<StreamChannel>();

	const client = useCreateChatClient({
		apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
		tokenOrProvider: generateChaToken,
		userData: {
			id: userId,
			name: userName,
			image: userImage,
		},
	});

	useEffect(() => {
		if (!client) {
			return;
		}

		const channel = client.channel("messaging", meetingId, {
			members: [userId],
		});

		setChannel(channel);
		return () => {
			channel._disconnect();
		};
	}, [client, meetingId, meetingName, userId]);

	if (!client) {
		return (
			<LoadingState
				title="Loading Chat"
				description="Connecting to chat..."></LoadingState>
		);
	}

	return (
		<div className="bg-white rounded-lg border overflow-hidden">
			<Chat client={client}>
				<Channel channel={channel}>
					<Window>
						<div className="flex-1 overflow-y-auto mah-h-[calc(100vh-23rem)] border-b">
							<MessageList />
						</div>
						<MessageInput />
					</Window>
					<Thread />
				</Channel>
			</Chat>
		</div>
	);
};
