/** @format */

import { LoadingState } from "@/components/loading-state";
import { authClient } from "@/lib/auth-client";
import { ChatUI } from "./chat-ui";

interface Props {
	meetingId: string;
	meetingName: string;
}

export const ChatProvider = ({ meetingId, meetingName }: Props) => {
	const { data, isPending } = authClient.useSession.get();

	if (isPending || !data?.user) {
		return (
			<>
				<LoadingState
					title="Loading..."
					description="Please wait while we load your session."
				/>
			</>
		);
	}
	return (
		<ChatUI
			meetingId={meetingId}
			meetingName={meetingName}
			userId={data.user.id}
			userName={data.user.name}
			userImage={data.user.image ?? ""}></ChatUI>
	);
};
