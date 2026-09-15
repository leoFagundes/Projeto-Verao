import { redirect } from "next/navigation";

export default async function ProfileIndexPage(props: PageProps<"/perfil/[id]">) {
  const { id } = await props.params;
  redirect(`/perfil/${id}/treinos`);
}
