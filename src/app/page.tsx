// / → /projects (「探す」が新しいホーム)
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/projects");
}
