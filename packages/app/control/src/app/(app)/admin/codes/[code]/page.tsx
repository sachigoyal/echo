export default async function AdminCodePage(
  props: PageProps<'/admin/codes/[code]'>
) {
  const { code } = await props.params;

  return (
    <div>
      <h1>Admin Code: {code}</h1>
    </div>
  );
}
