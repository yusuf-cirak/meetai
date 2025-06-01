import { db } from "@/db";
import { agents } from "@/db/schema";
import {  createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agentsInsertSchema } from "../schemas";
import z from "zod";
import { eq } from "drizzle-orm";

export const agentsRouter = createTRPCRouter({
    getOne : protectedProcedure.input(z.object({id:z.string()})).query(async ({input}) => {

        const [agent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, input.id));

            
        return agent;
    }),
    getMany : protectedProcedure.query(async () => {
        const data = await db.select().from(agents);

        return data;
    }),
    create : protectedProcedure // protectedProcedure protectets this route
    .input(agentsInsertSchema) // Validate input using zod schema
    .mutation(async ({input,ctx}) => {
        const {auth} = ctx;

        const [createdAgent] = await db
        .insert(agents)
        .values({
            ...input,
            userId: auth.user.id
        })
        .returning();

        return createdAgent;
    })
});