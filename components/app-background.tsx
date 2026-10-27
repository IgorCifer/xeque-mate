import { getImageProps } from "next/image";
import desktop from "@/assets/background-desktop.png";
import mobile from "@/assets/background-mobile.png";

export function AppBackground() {
  const common = { alt: "", sizes: "100vw", quality: 75, loading: "eager" as const };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: desktop });
  const {
    props: { srcSet: mobileSrcSet, ...rest },
  } = getImageProps({ ...common, src: mobile });

  return (
    <picture>
      <source media="(orientation: landscape)" srcSet={desktopSrcSet} />
      <source srcSet={mobileSrcSet} />
      <img
        {...rest}
        alt=""
        className="fixed inset-0 -z-10 h-full w-full object-cover object-center"
      />
    </picture>
  );
}
