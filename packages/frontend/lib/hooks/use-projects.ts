import useSWR from "swr";
import { getProjects } from "@/lib/api";
import type { Project } from "@/types/schema";

export function useProjects() {
  return useSWR<Project[]>("projects", getProjects);
}

export function useFeaturedProjects() {
  const { data, ...rest } = useProjects();
  return {
    data: data?.filter((p) => p.isFeatured) ?? [],
    ...rest,
  };
}
