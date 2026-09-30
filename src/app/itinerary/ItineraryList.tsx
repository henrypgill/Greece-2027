"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PowerIcon from "@mui/icons-material/Power";
import StopDetails from "@/components/StopDetails";
import {
  EMPTY_STOP,
  getLegs,
  toStopFormValues,
  type ItineraryItem,
} from "@/data/itinerary";
import { reorderStops } from "./actions";
import StopDialog from "./StopDialog";

type Editing = { id: number | "new"; item?: ItineraryItem } | null;

export default function ItineraryList({
  itinerary,
  isAdmin,
}: {
  itinerary: ItineraryItem[];
  isAdmin: boolean;
}) {
  // Local copy so a drag shows its new order immediately; replaced whenever
  // the server sends fresh data (after any save).
  const [items, setItems] = useState(itinerary);
  const [serverItems, setServerItems] = useState(itinerary);
  if (itinerary !== serverItems) {
    setServerItems(itinerary);
    setItems(itinerary);
  }

  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startSaving] = useTransition();

  const sensors = useSensors(
    // A few pixels of movement before a drag starts, so tapping the handle
    // doesn't count as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from === -1 || to === -1) return;

    const previous = items;
    const reordered = arrayMove(items, from, to);
    setItems(reordered);
    startSaving(async () => {
      try {
        const result = await reorderStops(reordered.map((item) => item.id));
        if (!result.ok) {
          setItems(previous);
          setError(result.message);
        }
      } catch {
        setItems(previous);
        setError("Couldn't save the new order. Check your connection.");
      }
    });
  }

  const legs = getLegs(items);

  const list = items.map((item, index) => (
    <ItineraryRow
      key={item.id}
      item={item}
      number={index + 1}
      nextLeg={legs[index]}
      isAdmin={isAdmin}
      onEdit={() => setEditing({ id: item.id, item })}
    />
  ));

  return (
    <Box>
      {isAdmin && (
        <Stack
          direction="row"
          sx={{ justifyContent: "flex-end", px: 1, py: 0.5 }}
        >
          <Button
            startIcon={<AddIcon />}
            onClick={() => setEditing({ id: "new" })}
          >
            Add stop
          </Button>
        </Stack>
      )}

      {items.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2 }}>
          No stops yet.
        </Typography>
      )}

      {isAdmin ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box>{list}</Box>
          </SortableContext>
        </DndContext>
      ) : (
        list
      )}

      {editing && (
        <StopDialog
          key={editing.id}
          id={editing.id}
          initialValues={
            editing.item ? toStopFormValues(editing.item) : EMPTY_STOP
          }
          onClose={() => setEditing(null)}
        />
      )}

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

type RowProps = {
  item: ItineraryItem;
  number: number;
  nextLeg: ReturnType<typeof getLegs>[number] | undefined;
  isAdmin: boolean;
  onEdit: () => void;
};

function ItineraryRow(props: RowProps) {
  return props.isAdmin ? <SortableRow {...props} /> : <RowContent {...props} />;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** A row that can be dragged by its handle (admins only). */
function SortableRow(props: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "relative",
        zIndex: isDragging ? 2 : undefined,
        boxShadow: isDragging ? 6 : undefined,
      }}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
    >
      <RowContent
        {...props}
        handle={
          <IconButton
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${props.item.title}`}
            size="small"
            edge="start"
            // Keep taps and keys on the handle from also expanding the row
            // (it sits inside the row's clickable header). touchAction below
            // stops the browser scrolling instead of dragging on phones.
            onKeyDown={(e) => {
              listeners?.onKeyDown?.(e);
              e.stopPropagation();
            }}
            onKeyUp={stop}
            onClick={stop}
            onMouseDown={stop}
            onTouchStart={stop}
            onFocus={stop}
            sx={{
              touchAction: "none",
              cursor: isDragging ? "grabbing" : "grab",
              color: "text.secondary",
            }}
          >
            <DragIndicatorIcon />
          </IconButton>
        }
      />
    </Box>
  );
}

function RowContent({
  item,
  number,
  nextLeg,
  isAdmin,
  onEdit,
  handle,
}: RowProps & { handle?: React.ReactNode }) {
  return (
    <Accordion disableGutters square>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {handle}
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: 14,
              bgcolor: "primary.main",
            }}
          >
            {number}
          </Avatar>
          <Typography sx={{ fontWeight: 500 }}>{item.title}</Typography>
          {item.shorePower && (
            <PowerIcon
              fontSize="small"
              color="action"
              titleAccess="Will have shore power"
            />
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <StopDetails
          item={item}
          number={number}
          nextLeg={nextLeg}
          timesAction={
            isAdmin && (
              <IconButton
                aria-label={`Edit ${item.title}`}
                onClick={onEdit}
                size="small"
                sx={{ my: -1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )
          }
        />
      </AccordionDetails>
    </Accordion>
  );
}
