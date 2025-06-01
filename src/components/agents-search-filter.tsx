import { useAgentsFilters } from "@/modules/agents/hooks/use-agents-filters";
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";

export const AgentsSearchFilter = () => {
    const [filters, setFilters] = useAgentsFilters();

    return (<div className="relative">
        <Input placeholder="Filter by name" className="h-9 bg-white w-[200px] pl-7" value={filters.search} onChange={(e) => setFilters({ search: e.target.value })}/>
            <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"></SearchIcon>
    </div>)
}