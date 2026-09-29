import { notFound } from "next/navigation";
import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import {
  EMPTY_STOP,
  getStopForEdit,
  type StopFormValues,
} from "@/lib/itinerary-db";
import StopForm from "../StopForm";

export default async function EditStopPage(
  props: PageProps<"/itinerary/edit/[id]">,
) {
  await connection();
  const { id: idParam } = await props.params;

  if (idParam === "new") {
    return <StopForm id="new" initialValues={EMPTY_STOP} />;
  }

  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  let values: StopFormValues | null;
  try {
    values = await getStopForEdit(id);
  } catch (error) {
    console.error("getStopForEdit failed", error);
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        This stop couldn&apos;t be loaded.
      </Alert>
    );
  }
  if (!values) notFound();

  return <StopForm id={id} initialValues={values} />;
}
