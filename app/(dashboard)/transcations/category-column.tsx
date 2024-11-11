import { useOpencategory } from "@/features/categories/hooks/use-open-category";
import { useOpenTranscation } from "@/features/transcations/hooks/use-open-transcation";
import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";

type Props = {
  id: string;
  category: string | null;
  categoryId: string | null;
};

const CategoryColumn = ({ id, category, categoryId }: Props) => {
  const { onOpen: onOpenCategory } = useOpencategory();
  const { onOpen: onOpentranscation } = useOpenTranscation();

  const onClick = () => {
    if (categoryId) {
      onOpenCategory(categoryId);
    } else {
      onOpentranscation(id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center cursor-pointer hover:underline",
        !category && "text-red-500"
      )}
    >
      {!category && <TriangleAlert className=" size-4 mr-2 shrink-0" />}
      {category || "Uncategorized"}
    </div>
  );
};

export default CategoryColumn;
