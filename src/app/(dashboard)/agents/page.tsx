import { auth } from "@/lib/auth";
import { loadSearchParams } from "@/modules/agents/params";
import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { AgentsView, AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

interface Props {
    searchParams : Promise<SearchParams>
}

const Page = async ({searchParams} : Props) => {

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/");
    }



    const queryClient = getQueryClient();

    const params = await loadSearchParams(searchParams);

    void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({...params}))

    // note: ErrorBoundary can be used from react-error-boundary library to handle errors in the app.
    // but next js has a special error page that is used to handle errors in the app.

    return (
        <>
            <AgentsListHeader></AgentsListHeader>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<AgentsViewLoading></AgentsViewLoading>}>
                    <AgentsView></AgentsView>
                </Suspense>
            </HydrationBoundary>
        </>)
}


export default Page;