import Note from "./note";

export default async function Page({ params }) {
    const { id } = await params;
    return <Note key={id} id={id} />;
}
