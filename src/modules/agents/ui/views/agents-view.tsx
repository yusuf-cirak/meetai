"use client"

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const AgentsView = () => {
    const trpc = useTRPC();

    const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions())
    // use query fetches the data in the client, useSuspenseQuery fetches the data in the server and suspends the component until the data is available


    // note: if you were using the `useQuery` hook, you would need to handle loading and error states in this component.
    // but you are using hydration so loading and error states are being handled in agents/page.tsx

    // if (isLoading) {
    //     return <LoadingState title="Loading agents" description="This may take a few seconds"></LoadingState>
    // }

    // if (isError) {
    //     return <ErrorState title="Error when loading agents" description="Something went wrong"></ErrorState>
    // }

    return (<div></div>)
}


export const AgentsViewLoading = () => {
    return (
<LoadingState title="Loading agents" description="This may take a few seconds"></LoadingState>
    );
}

export const AgentsViewError = () => {
    return (
<ErrorState title="Error when loading agents" description="Something went wrong"></ErrorState>
    );
}