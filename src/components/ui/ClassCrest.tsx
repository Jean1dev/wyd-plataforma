import Image from "next/image";
import { CLASS_META, type WydClass } from "@/lib/wyd-class";

export { CLASS_META, type WydClass };

const SIZES = { sm: 32, md: 44, lg: 56 } as const;

export function ClassCrest({
  cls,
  size = "md",
}: {
  cls: WydClass;
  size?: keyof typeof SIZES;
}) {
  const meta = CLASS_META[cls];
  const px = SIZES[size];

  return (
    <Image
      src={meta.image}
      alt={meta.label}
      title={meta.label}
      width={px}
      height={px}
      style={{
        flex: "none",
        borderRadius: "var(--radius-md)",
        objectFit: "cover",
      }}
    />
  );
}

export default ClassCrest;
