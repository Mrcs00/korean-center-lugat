import { supabase } from "../supabase/client";

export interface RealAssignment {
  id: string;
  groupId: string;
  groupName: string;
  setId: string;
  deadline: string | null;
  minimumMastery: number;
}

/** For the teacher panel — every assignment across every group. */
export async function fetchAllAssignments(): Promise<RealAssignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, group_id, set_id, deadline, minimum_mastery, groups(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((a) => ({
    id: a.id,
    groupId: a.group_id,
    groupName: (a.groups as unknown as { name: string } | null)?.name ?? a.group_id,
    setId: a.set_id,
    deadline: a.deadline,
    minimumMastery: a.minimum_mastery,
  }));
}

/** For a student — only assignments given to the group they belong to. */
export async function fetchAssignmentsForGroup(groupId: string): Promise<RealAssignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, group_id, set_id, deadline, minimum_mastery, groups(name)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((a) => ({
    id: a.id,
    groupId: a.group_id,
    groupName: (a.groups as unknown as { name: string } | null)?.name ?? a.group_id,
    setId: a.set_id,
    deadline: a.deadline,
    minimumMastery: a.minimum_mastery,
  }));
}

export async function createAssignment(input: {
  groupId: string;
  setId: string;
  deadline: string | null;
  minimumMastery: number;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  const { error } = await supabase.from("assignments").insert({
    group_id: input.groupId,
    set_id: input.setId,
    deadline: input.deadline,
    minimum_mastery: input.minimumMastery,
    created_by: userId,
  });
  if (error) throw error;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw error;
}
