import { AgentsView, AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

const Page = () => {
    const queryClient = getQueryClient();

    void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions())

    // note: ErrorBoundary can be used from react-error-boundary library to handle errors in the app.
    // but next js has a special error page that is used to handle errors in the app.

    return (<HydrationBoundary state={dehydrate(queryClient)}>
    <Suspense fallback = {<AgentsViewLoading></AgentsViewLoading>}>
    <AgentsView></AgentsView>
    </Suspense>
    </HydrationBoundary>)
}


export default Page;