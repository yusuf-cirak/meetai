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
import { meetings } from "@/db/schema";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";

export const meetingsRouter = createTRPCRouter({
	getOne: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const [meeting] = await db
				.select({
					...getTableColumns(meetings),
					meetingCount: sql<number>`5`,
				})
				.from(meetings)
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
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, search } = input;
			const data = await db
				.select({
					...getTableColumns(meetings),
					meetingCount: sql<number>`5`,
				})
				.from(meetings)
				.where(
					and(
						eq(meetings.userId, ctx.auth.user.id),
						search ? ilike(meetings.name, `%${search}%`) : undefined,
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
