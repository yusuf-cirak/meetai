/** @format */
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";
interface Props {
	meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
	const call = useCall();

	const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

	const handleJoin = async () => {
		if (!call) {
			return;
		}

		if (call.state.callingState !== "joined") {
			await call.join();
		}

		setShow("call");
	};

	const handleLeave = async () => {
		if (!call) {
			return;
		}

		if (call.state.callingState !== "left") {
			await call.leave();
		}

		setShow("ended");
	};
	return (
		<StreamTheme className="w-full">
			{show === "lobby" && <CallLobby onJoin={handleJoin} />}
			{show === "call" && (
				<CallActive
					meetingName={meetingName}
					onLeave={handleLeave}
				/>
			)}
			{show === "ended" && <CallEnded />}
		</StreamTheme>
	);
};
