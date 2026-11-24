import { redirect } from "next/navigation";

// The student home moved to /student.
export default function DashboardRedirect() {
  redirect("/student");
}
