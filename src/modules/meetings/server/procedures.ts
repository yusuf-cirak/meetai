/** @format */

import { db } from "@/db";
import JSONL from "jsonl-parse-stringify";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import {
	and,
	eq,
	getTableColumns,
	ilike,
	sql,
	desc,
	count,
	inArray,
} from "drizzle-orm";
import {
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	MAX_PAGE_SIZE,
	MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { agents, meetings, MeetingStatus, user } from "@/db/schema";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { StreamTranscriptItem } from "../types";
import { streamChat } from "@/lib/stream-chat";

export const meetingsRouter = createTRPCRouter({
	generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
		const token = streamChat.createToken(ctx.auth.user.id);
		await streamChat.upsertUser({
			id: ctx.auth.user.id,
			name: ctx.auth.user.name,
			role: "admin",
			image:
				ctx.auth.user.image ??
				generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }),
		});

		return token;
	}),
	getTranscript: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const { id } = input;
			const { auth } = ctx;

			const [existingMeeting] = await db
				.select()
				.from(meetings)
				.where(and(eq(meetings.id, id), eq(meetings.userId, auth.user.id)));

			if (!existingMeeting) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Meeting not found or transcript not available",
				});
			}
			if (!existingMeeting.transcriptUrl) {
				return [];
			}

			const transcript = await fetch(existingMeeting.transcriptUrl)
				.then((res) => res.text())
				.then((text) => JSONL.parse<StreamTranscriptItem>(text))
				.catch(() => {
					return [];
				});

			const speakekerIds = [
				...new Set(transcript.map((item) => item.speaker_id)),
			];

			const userSpeakers = await db
				.select()
				.from(user)
				.where(inArray(user.id, speakekerIds))
				.then((users) =>
					users.map((user) => ({
						...user,
						image:
							user.image ??
							generateAvatarUri({
								seed: user.name,
								variant: "initials",
							}),
					})),
				);

			const agentSpekers = await db
				.select()
				.from(agents)
				.where(inArray(agents.id, speakekerIds))
				.then((agents) =>
					agents.map((agent) => ({
						...agent,
						image: generateAvatarUri({
							seed: agent.name,
							variant: "botttsNeutral",
						}),
					})),
				);

			const speakers = [...userSpeakers, ...agentSpekers];

			const transcriptWithSpeakers = transcript.map((item) => {
				const speaker = speakers.find((s) => s.id === item.speaker_id);
				return {
					...item,
					speaker: {
						id: item.speaker_id,
						name: speaker?.name ?? "Unknown",
						image: speaker?.image ?? "",
					},
				};
			});

			return transcriptWithSpeakers;
		}),
	getOne: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const [meeting] = await db
				.select({
					...getTableColumns(meetings),
					meetingCount: sql<number>`5`,
					agent: agents,
					duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
						"duration",
					),
				})
				.from(meetings)
				.innerJoin(agents, eq(meetings.agentId, agents.id))
				.where(
					and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)),
				);

			if (!meeting) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
			}

			return meeting;
		}),
	getMany: protectedProcedure
		.input(
			z.object({
				page: z.number().default(DEFAULT_PAGE),
				pageSize: z
					.number()
					.min(MIN_PAGE_SIZE)
					.max(MAX_PAGE_SIZE)
					.default(DEFAULT_PAGE_SIZE),
				search: z.string().nullish(),
				agentId: z.string().nullish(),
				status: z
					.enum(Object.values(MeetingStatus) as [string, ...string[]])
					.nullish(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, search, status, agentId } = input;
			const data = await db
				.select({
					...getTableColumns(meetings),
					agent: agents,
					duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
						"duration",
					),
				})
				.from(meetings)
				.innerJoin(agents, eq(meetings.agentId, agents.id))
				.where(
					and(
						eq(meetings.userId, ctx.auth.user.id),
						search ? ilike(meetings.name, `%${search}%`) : undefined,
						status ? eq(meetings.status, status) : undefined,
						agentId ? eq(meetings.agentId, agentId) : undefined,
					),
				)
				.orderBy(desc(meetings.createdAt), desc(meetings.id))
				.limit(pageSize)
				.offset((page - 1) * pageSize);

			const [total] = await db
				.select({ count: count() })
				.from(meetings)
				.where(
					and(
						eq(meetings.userId, ctx.auth.user.id),
						search ? ilike(meetings.name, `%${search}%`) : undefined,
						status ? eq(meetings.status, status) : undefined,
						agentId ? eq(meetings.agentId, agentId) : undefined,
					),
				);

			const totalPages = Math.ceil(total.count / pageSize);

			return {
				items: data,
				totalCount: total.count,
				totalPages,
			};
		}),
	create: protectedProcedure // protectedProcedure protectets this route
		.input(meetingsInsertSchema) // Validate input using zod schema
		.mutation(async ({ input, ctx }) => {
			const { auth } = ctx;

			const [createdMeeting] = await db
				.insert(meetings)
				.values({
					...input,
					userId: auth.user.id,
				})
				.returning();

			const [existingAgent] = await db
				.select()
				.from(agents)
				.where(eq(agents.id, createdMeeting.agentId));

			if (!existingAgent) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Agent not found",
				});
			}

			const call = streamVideo.video.call("default", createdMeeting.id);

			await call.create({
				data: {
					created_by_id: ctx.auth.user.id,
					custom: {
						meetingId: createdMeeting.id,
						meetingName: createdMeeting.name,
					},
					settings_override: {
						transcription: {
							language: "en",
							mode: "auto-on",
							closed_caption_mode: "auto-on",
						},
						recording: {
							mode: "auto-on",
							quality: "1080p",
						},
					},
				},
			});

			await streamVideo.upsertUsers([
				{
					id: existingAgent.userId,
					name: existingAgent.name,
					role: "user",
					image: generateAvatarUri({
						seed: existingAgent.name,
						variant: "botttsNeutral",
					}),
				},
			]);
			return createdMeeting;
		}),

	update: protectedProcedure
		.input(meetingsUpdateSchema)
		.mutation(async ({ input, ctx }) => {
			const { id, ...data } = input;
			const { auth } = ctx;

			const [updatedMeeting] = await db
				.update(meetings)
				.set(data)
				.where(and(eq(meetings.id, id), eq(meetings.userId, auth.user.id)))
				.returning();

			if (!updatedMeeting) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
			}

			return updatedMeeting;
		}),

	generateToken: protectedProcedure.mutation(async ({ ctx }) => {
		await streamVideo.upsertUsers([
			{
				id: ctx.auth.user.id,
				name: ctx.auth.user.name,
				role: "admin",
				image:
					ctx.auth.user.image ??
					generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }),
			},
		]);

		const now = Date.now();

		const expirationTime = Math.floor(now / 1000) + 3600; // 1 hour
		const issuedAt = Math.floor(now / 1000) - 60;

		const token = streamVideo.generateUserToken({
			user_id: ctx.auth.user.id,
			exp: expirationTime,
			validity_in_seconds: issuedAt,
		});
		return token;
	}),
	remove: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const { id } = input;
			const { auth } = ctx;

			const [deletedMeeting] = await db
				.delete(meetings)
				.where(and(eq(meetings.id, id), eq(meetings.userId, auth.user.id)))
				.returning();

			if (!deletedMeeting) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Meeting not found",
				});
			}

			return deletedMeeting;
		}),
});
