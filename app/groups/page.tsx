import { redirect } from "next/navigation";

// Groups and assignments now live under "Mening kurslarim" and "Uy vazifalari".
export default function GroupsRedirect() {
  redirect("/student/courses");
}
