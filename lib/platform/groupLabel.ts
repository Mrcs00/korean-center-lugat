// Group names can repeat (two teachers may both have a group called "individual D CH J 10.00"),
// so whenever the list holds groups of more than one teacher (the admin's view) the teacher's
// name is shown next to the group name. A teacher sees only their own groups, so nothing is added.

interface Labelable {
  id: string;
  name: string;
  teacher_id?: string | null;
  teacher?: { full_name: string } | null;
}

export function groupLabeler<G extends Labelable>(groups: G[]): (g: G) => string {
  const teacherIds = new Set(groups.map((g) => g.teacher_id ?? "none"));
  const showTeacher = teacherIds.size > 1;
  return (g) => (showTeacher ? `${g.name} · ${g.teacher?.full_name ?? "ustozsiz"}` : g.name);
}
