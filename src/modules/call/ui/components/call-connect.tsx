/** @format */
"use client";
import { useTRPC } from "@/trpc/client";
import {
	Call,
	CallingState,
	StreamCall,
	StreamVideo,
	StreamVideoClient,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useMutation } from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CallUI } from "./call-ui";
interface Props {
	meetingId: string;
	meetingName: string;
	userId: string;
	userName: string;
	userImage: string;
}

export const CallConnect = ({
	meetingId,
	meetingName,
	userId,
	userName,
	userImage,
}: Props) => {
	const trpc = useTRPC();

	const { mutateAsync: generateToken } = useMutation(
		trpc.meetings.generateToken.mutationOptions(),
	);

	const [client, setClient] = useState<StreamVideoClient>();

	useEffect(() => {
		const _client = new StreamVideoClient({
			apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
			user: {
				id: userId,
				name: userName,
				image: userImage,
			},
			tokenProvider: generateToken,
		});

		setClient(_client);

		return () => {
			setClient(undefined);
			_client.disconnectUser();
		};
	}, [userId, userName, userImage, generateToken]);

	const [call, setCall] = useState<Call>();

	useEffect(() => {
		if (!client) {
			return;
		}

		const _call = client.call("default", meetingId);

		setCall(_call);

		_call.camera.disable();
		_call.microphone.disable();

		return () => {
			if (_call.state.callingState !== CallingState.LEFT) {
				setCall(undefined);
				_call.leave();
				_call.endCall();
			}
		};
	}, [client, meetingId]);

	if (!client || !call) {
		return (
			<div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
				<LoaderIcon className="size-6 animate-spin text-white" />
			</div>
		);
	}
	return (
		<div>
			<StreamVideo client={client}>
				<StreamCall call={call}>
					<CallUI meetingName={meetingName} />
				</StreamCall>
			</StreamVideo>
		</div>
	);
};
