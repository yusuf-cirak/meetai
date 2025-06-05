/** @format */

"use client";

import { authClient } from "@/lib/auth-client";

import { generateAvatarUri } from "@/lib/avatar";
import { LoaderIcon } from "lucide-react";
import { CallConnect } from "./call-connect";

interface Props {
	meetingId: string;
	meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
	const { data, isPending } = authClient.useSession.get();

	if (!data || isPending) {
		return (
			<div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
				<LoaderIcon className="size-6 animate-spin text-white" />
			</div>
		);
	}

	const userImage =
		data.user.image ??
		generateAvatarUri({
			seed: data.user.name,
			variant: "initials",
		});

	return (
		<CallConnect
			meetingId={meetingId}
			meetingName={meetingName}
			userId={data.user.id}
			userName={data.user.name}
			userImage={userImage}
		/>
	);
};
