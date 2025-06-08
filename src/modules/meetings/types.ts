/** @format */

import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type MeetingGetOne = inferRouterOutputs<AppRouter>["meetings"]["getOne"];
export type MeetingGetMany =
	inferRouterOutputs<AppRouter>["meetings"]["getMany"]["items"];

export type StreamTranscriptItem = {
	speaker_id: string;
	type: string;
	text: string;
	start_ts: number;
	end_ts: number;
};
