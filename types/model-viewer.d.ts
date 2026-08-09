import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Le web component <model-viewer> (Google) n'a pas de types React officiels.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          exposure?: string;
          poster?: string;
          "ar-scale"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export { };