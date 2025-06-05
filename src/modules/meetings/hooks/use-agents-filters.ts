/** @format */

import { DEFAULT_PAGE } from "@/constants";
import { MeetingStatus } from "@/db/schema";
import {
	parseAsInteger,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from "nuqs";

export const useMeetingsFilters = () =>
	useQueryStates({
		search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
		page: parseAsInteger
			.withDefault(DEFAULT_PAGE)
			.withOptions({ clearOnDefault: true }),
		status: parseAsStringEnum(Object.values(MeetingStatus)),
		agentId: parseAsString
			.withDefault("")
			.withOptions({ clearOnDefault: true }),
	});
