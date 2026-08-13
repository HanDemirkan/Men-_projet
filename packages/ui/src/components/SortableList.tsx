"use client";

import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export interface SortableItemRenderProps {
  dragHandleAttributes: DraggableAttributes;
  dragHandleListeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (reorderedItems: T[]) => void;
  renderItem: (item: T, helpers: SortableItemRenderProps) => ReactNode;
  className?: string;
}

// Thin, reusable `@dnd-kit` wrapper - pointer + keyboard sensors, vertical
// list strategy. The caller owns rendering (via `renderItem`) and what
// happens with the newly-ordered array (via `onReorder`, e.g. persisting
// the new sortOrder values through a reorder API call).
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // dnd-kit auto-generates its `aria-describedby` id from a module-level
  // counter, which drifts between the server and client render pass
  // whenever more than one DndContext mounts on a page - a real hydration
  // mismatch. React's own `useId` is SSR/CSR-stable by design; passing it
  // through pins dnd-kit's id to that instead.
  const dndId = useId();

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-2", className)}>
          {items.map((item) => (
            <SortableListItem key={item.id} id={item.id}>
              {(helpers) => renderItem(item, helpers)}
            </SortableListItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableListItem({
  id,
  children,
}: {
  id: string;
  children: (helpers: SortableItemRenderProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-10 opacity-70")}>
      {children({ dragHandleAttributes: attributes, dragHandleListeners: listeners, isDragging })}
    </div>
  );
}
