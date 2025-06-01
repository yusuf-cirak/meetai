"use client"

import { AgentsViewError } from "@/modules/agents/ui/views/agents-view"

// next js has a special error page that is used to handle errors in the app.

// react-error-boundary library can be used too. 

const ErrorPage = () => (<AgentsViewError></AgentsViewError>)

export default ErrorPage;