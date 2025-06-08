/** @format */

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import {
	streamVideo,
	StreamVideoConstant as StreamVideoWebhooks,
} from "@/lib/stream-video";
import {
	CallEndedEvent,
	CallRecordingReadyEvent,
	CallSessionParticipantLeftEvent,
	CallSessionStartedEvent,
	CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

const verifySignatureWithSdk = (body: string, signature: string) =>
	streamVideo.verifyWebhook(body, signature);

export const POST = async (req: NextRequest) => {
	// you can also use await headers
	const signature = req.headers.get("x-signature");
	const apiKey = req.headers.get("x-api-key");

	if (!signature || !apiKey) {
		return new Response("Missing signature or API key", { status: 400 });
	}

	const body = await req.text();

	if (!verifySignatureWithSdk(body, signature)) {
		return new Response("Invalid signature", { status: 401 });
	}

	let payload: unknown;

	try {
		payload = JSON.parse(body) as Record<string, unknown>;
	} catch {
		return new Response("Invalid JSON payload", { status: 400 });
	}

	const eventType = (payload as Record<string, unknown>)?.type as string;

	if (!eventType) {
		return new Response("Missing event type", { status: 400 });
	}

	if (eventType === StreamVideoWebhooks.CALL_SESSION_STARTED) {
		const event = payload as CallSessionStartedEvent;
		const meetingId = event.call.custom.meetingId as string;

		if (!meetingId) {
			return new Response("Missing meeting ID in event", { status: 400 });
		}

		const [existingMeeting] = await db
			.select()
			.from(meetings)
			.where(and(eq(meetings.id, meetingId), eq(meetings.status, "upcoming")));

		if (!existingMeeting) {
			return new Response("Meeting not found or not in upcoming status", {
				status: 404,
			});
		}

		await db
			.update(meetings)
			.set({
				status: "active",
				startedAt: new Date(),
				endedAt: null,
			})
			.where(eq(meetings.id, meetingId));

		const [existingAgent] = await db
			.select()
			.from(agents)
			.where(eq(agents.id, existingMeeting.agentId));

		if (!existingAgent) {
			return new Response("Agent not found for the meeting", { status: 404 });
		}

		const call = streamVideo.video.call("default", meetingId);
		const realtimeClient = await streamVideo.video.connectOpenAi({
			call,
			openAiApiKey: process.env.OPENAI_API_KEY!,
			agentUserId: existingAgent.id,
		});

		if (!realtimeClient) {
			console.error("Failed to connect to OpenAI realtimeClient");
			return new Response("Failed to connect to OpenAI", { status: 500 });
		}

		realtimeClient.updateSession({
			instructions: existingAgent.instructions,
		});
	} else if (eventType === StreamVideoWebhooks.CALL_SESSION_PARTICIPANT_LEFT) {
		const event = payload as CallSessionParticipantLeftEvent;
		const meetingId = event.call_cid.split(":")[1]; // Extract meeting ID from call_cid

		if (!meetingId) {
			return new Response("Missing meeting ID in event", { status: 400 });
		}

		const call = streamVideo.video.call("default", meetingId);

		await call.end();
	} else if (eventType === StreamVideoWebhooks.CALL_SESSION_ENDED) {
		const event = payload as CallEndedEvent;
		const meetingId = event.call.custom?.meetingId as string;

		if (!meetingId) {
			return new Response("Missing meeting ID in event", { status: 400 });
		}

		await db
			.update(meetings)
			.set({
				status: "processing",
				endedAt: new Date(),
			})
			.where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
	} else if (
		eventType === StreamVideoWebhooks.CALL_SESSION_TRANSCRIPTION_READY
	) {
		const event = payload as CallTranscriptionReadyEvent;
		const meetingId = event.call_cid.split(":")[1]; // Extract meeting ID from call_cid
		if (!meetingId) {
			return new Response("Missing meeting ID in event", { status: 400 });
		}

		const [updatedMeeting] = await db
			.update(meetings)
			.set({
				transcriptUrl: event.call_transcription.url,
			})
			.where(eq(meetings.id, meetingId))
			.returning();

		if (!updatedMeeting) {
			return new Response("Meeting not found", { status: 404 });
		}

		await inngest.send({
			name: "meetings/processing",
			data: {
				meetingId: updatedMeeting.id,
				transcriptUrl: updatedMeeting.transcriptUrl,
			},
		});
	} else if (eventType === StreamVideoWebhooks.CALL_RECORDING_READY) {
		const event = payload as CallRecordingReadyEvent;
		const meetingId = event.call_cid.split(":")[1]; // Extract meeting ID from call_cid
		if (!meetingId) {
			return new Response("Missing meeting ID in event", { status: 400 });
		}

		await db
			.update(meetings)
			.set({
				recordingUrl: event.call_recording.url,
			})
			.where(eq(meetings.id, meetingId));
	}

	return new Response("", {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
