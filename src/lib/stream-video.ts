/** @format */
import "server-only";

import { StreamClient } from "@stream-io/node-sdk";

export const streamVideo = new StreamClient(
	process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
	process.env.STREAM_VIDEO_SECRET_KEY!,
);

export enum StreamVideoConstant {
	CALL_SESSION_STARTED = "call.session_started",
	CALL_SESSION_ENDED = "call.session_ended",
	CALL_SESSION_PARTICIPANT_LEFT = "call.session_participant_left",
}
