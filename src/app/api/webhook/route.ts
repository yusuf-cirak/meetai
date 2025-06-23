/** @format */

import { db } from "@/db";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { agents, meetings, MeetingStatus, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import {
	streamVideo,
	StreamVideoConstant as StreamVideoWebhooks,
} from "@/lib/stream-video";
import {
	MessageNewEvent,
	CallEndedEvent,
	CallRecordingReadyEvent,
	CallSessionParticipantLeftEvent,
	CallSessionStartedEvent,
	CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

const openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
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
	} else if (eventType === StreamVideoWebhooks.MESSAGE_NEW) {
		const event = payload as MessageNewEvent;

		const userId = event.user?.id;
		const channelId = event.channel_id;
		const text = event.message?.text;

		if (!userId || !channelId || !text) {
			return new Response("Missing required fields", { status: 400 });
		}

		const [existingMeeting] = await db
			.select()
			.from(meetings)
			.where(eq(meetings.id, channelId));

		if (!existingMeeting) {
			return new Response("Meeting not found", { status: 404 });
		}

		const [existingAgent] = await db
			.select()
			.from(agents)
			.where(eq(agents.id, existingMeeting.agentId));

		if (!existingAgent) {
			return new Response("Agent not found for the meeting", { status: 404 });
		}

		if (userId !== existingAgent.id) {
			const instructions = `
      You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
      ${existingAgent.instructions}
      
      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.
      
      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
      `;

			const channel = streamChat.channel("messaging", channelId);
			await channel.watch();

			const previousMessages = channel.state.messages
				.slice(-5)
				.filter(Boolean)
				.map<ChatCompletionMessageParam>((message) => ({
					role: message.user_id === existingAgent.id ? "assistant" : "user",
					content: message.text ?? "",
				}));

			const gptResponse = await openAiClient.chat.completions.create({
				messages: [
					{ role: "system", content: instructions },
					...previousMessages,
					{ role: "user", content: "text" },
				],
				model: "gpt-4o",
			});

			const gptResponseText = gptResponse.choices[0].message.content;

			if (!gptResponseText) {
				console.error("Failed to generate response from Chat GPT");
				return new Response("Failed to generate response from Chat GPT", {
					status: 500,
				});
			}

			const avatarUri = generateAvatarUri({
				seed: existingAgent.name,
				variant: "botttsNeutral",
			});

			streamChat.upsertUser({
				id: userId,
				name: existingAgent.name,
				image: avatarUri,
			});

			await channel.sendMessage({
				text: gptResponseText,
				user: {
					id: existingAgent.id,
					name: existingAgent.name,
					image: avatarUri,
				},
			});
		}
	}
	return new Response("", {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
