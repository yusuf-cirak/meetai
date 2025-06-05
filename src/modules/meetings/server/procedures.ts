/** @format */

import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { and, eq, getTableColumns, ilike, sql, desc, count } from "drizzle-orm";
import {
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	MAX_PAGE_SIZE,
	MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { agents, meetings, MeetingStatus } from "@/db/schema";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";

export const meetingsRouter = createTRPCRouter({
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

			// todo: create stream call, upsert stream users

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
